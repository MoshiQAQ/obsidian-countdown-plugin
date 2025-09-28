import {
  App,
  Editor,
  MarkdownPostProcessorContext,
  MarkdownRenderChild,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  SectionCache,
  Setting,
  TFile,
  setIcon
} from "obsidian";

interface CountdownPluginSettings {
  defaultLabel: string;
  defaultDurationMinutes: number;
  defaultColor: string;
}

const COLOR_PRESETS = [
  "#F25C54",
  "#F79009",
  "#F2C94C",
  "#12B76A",
  "#2E90FA",
  "#9E77ED",
  "#98A2B3"
];

const DEFAULT_SETTINGS: CountdownPluginSettings = {
  defaultLabel: "Countdown",
  defaultDurationMinutes: 60,
  defaultColor: COLOR_PRESETS[1]
};

type CountdownBlockContext = {
  sourcePath: string;
  section: SectionCache;
};

type CountdownBlockData = {
  target: Date;
  label: string;
  color: string;
};

type CountdownModalResult = CountdownBlockData;

type CountdownModalOptions = {
  heading: string;
  initialTarget: Date;
  initialLabel: string;
  initialColor: string;
  strings: Translations;
  onSubmit: (result: CountdownModalResult) => Promise<void> | void;
};

type CountdownViewOptions = {
  target: Date;
  label: string;
  color: string;
  context: CountdownBlockContext | null;
  strings: Translations;
};

interface CountdownUnit {
  key: "days" | "hours" | "minutes" | "seconds";
  label: string;
}

interface Translations {
  commandInsert: string;
  insertHeading: string;
  editHeading: string;
  targetLabel: string;
  targetHint: string;
  labelLabel: string;
  labelHint: string;
  colorLabel: string;
  colorHint: string;
  modalConfirm: string;
  modalCancel: string;
  emptyWarning: string;
  parseWarning: string;
  applyError: string;
  openMarkdownWarning: string;
  blockMissingTarget: string;
  blockInvalidTarget: string;
  toolbarEdit: string;
  toolbarColour: string;
  colorPopoverTitle: string;
  defaultLabel: string;
  settingsHeader: string;
  settingsDefaultLabel: string;
  settingsDefaultDuration: string;
  settingsDefaultColour: string;
  unitDays: string;
  unitHours: string;
  unitMinutes: string;
  unitSeconds: string;
}

const enStrings: Translations = {
  commandInsert: "Insert countdown timer",
  insertHeading: "Insert countdown",
  editHeading: "Edit countdown",
  targetLabel: "Target time",
  targetHint: "Pick the end time for the countdown.",
  labelLabel: "Label",
  labelHint: "Shown under the digits.",
  colorLabel: "Colour",
  colorHint: "Highlight colour for the countdown blocks.",
  modalConfirm: "Confirm",
  modalCancel: "Cancel",
  emptyWarning: "Please choose a target date and time.",
  parseWarning: "Unable to parse the target date.",
  applyError: "Failed to apply countdown changes.",
  openMarkdownWarning: "Open a markdown file to insert the countdown.",
  blockMissingTarget: "Countdown block needs a target date.",
  blockInvalidTarget: "Invalid countdown target date.",
  toolbarEdit: "Edit countdown",
  toolbarColour: "Change colour",
  colorPopoverTitle: "Colour",
  defaultLabel: "Countdown",
  settingsHeader: "Countdown Timer",
  settingsDefaultLabel: "Default label",
  settingsDefaultDuration: "Default duration (minutes)",
  settingsDefaultColour: "Default colour",
  unitDays: "Days",
  unitHours: "Hours",
  unitMinutes: "Minutes",
  unitSeconds: "Seconds"
};

const zhStrings: Translations = {
  commandInsert: "插入倒计时",
  insertHeading: "插入倒计时",
  editHeading: "编辑倒计时",
  targetLabel: "结束时间",
  targetHint: "选择倒计时结束的日期和时间。",
  labelLabel: "标签",
  labelHint: "显示在数字下方，可留空。",
  colorLabel: "颜色",
  colorHint: "倒计时块的高亮颜色。",
  modalConfirm: "确认",
  modalCancel: "取消",
  emptyWarning: "请选择结束时间。",
  parseWarning: "无法解析该时间，请重新选择。",
  applyError: "应用倒计时时出错。",
  openMarkdownWarning: "请在 Markdown 文件中插入倒计时。",
  blockMissingTarget: "倒计时代码块缺少目标时间。",
  blockInvalidTarget: "倒计时代码块的目标时间无效。",
  toolbarEdit: "修改倒计时",
  toolbarColour: "更改颜色",
  colorPopoverTitle: "颜色",
  defaultLabel: "倒计时",
  settingsHeader: "Countdown Timer",
  settingsDefaultLabel: "默认标签",
  settingsDefaultDuration: "默认时长（分钟）",
  settingsDefaultColour: "默认颜色",
  unitDays: "天",
  unitHours: "时",
  unitMinutes: "分",
  unitSeconds: "秒"
};

export default class CountdownTimerPlugin extends Plugin {
  settings: CountdownPluginSettings = DEFAULT_SETTINGS;

  async onload() {
    await this.loadSettings();

    this.registerMarkdownCodeBlockProcessor(
      "countdown",
      (source, el, ctx) => this.renderCountdownBlock(source, el, ctx)
    );

    this.addCommand({
      id: "insert-countdown-timer",
      name: this.getStrings().commandInsert,
      editorCallback: (editor) => {
        this.openInsertModal(editor);
      }
    });

    this.addSettingTab(new CountdownSettingTab(this.app, this));

  }

  onunload() {}

  getStrings(): Translations {
    return getTranslations(this.app);
  }

  private openInsertModal(editor: Editor) {
    const strings = this.getStrings();
    const now = new Date();
    const defaultTarget = new Date(now.getTime() + this.settings.defaultDurationMinutes * 60 * 1000);

    new CountdownModal(this.app, this, {
      heading: strings.insertHeading,
      strings,
      initialTarget: defaultTarget,
      initialLabel: this.getDefaultLabel(strings),
      initialColor: this.settings.defaultColor,
      onSubmit: async ({ target, label, color }) => {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) {
          new Notice(strings.openMarkdownWarning);
          return;
        }

        const iso = target.toISOString();
        const blockLines = serializeCountdownLines({ target: iso, label, color });
        const snippet = `\n\n${blockLines.join("\n")}\n\n`;
        const cursor = editor.getCursor();
        editor.replaceRange(snippet, cursor);
      }
    }).open();
  }

  private getDefaultLabel(strings: Translations) {
    const custom = this.settings.defaultLabel?.trim();
    if (!custom) {
      return strings.defaultLabel;
    }

    if (strings === enStrings && custom === zhStrings.defaultLabel) {
      return strings.defaultLabel;
    }

    if (strings === zhStrings && custom === enStrings.defaultLabel) {
      return strings.defaultLabel;
    }

    return custom;
  }

  private renderCountdownBlock(source: string, el: HTMLElement, ctx: MarkdownPostProcessorContext) {
    const strings = this.getStrings();
    const trimmedSource = source.trim();
    const parsed = parseCountdownSource(source, this.getDefaultLabel(strings), this.settings.defaultColor);
    if (!parsed.target) {
      const message = trimmedSource.length ? strings.blockInvalidTarget : strings.blockMissingTarget;
      el.createEl("p", { text: message });
      return;
    }

    const section = ctx.getSectionInfo(el);
    const blockContext = section
      ? ({
          sourcePath: ctx.sourcePath,
          section
        } satisfies CountdownBlockContext)
      : null;

    const container = el.createDiv({ cls: "obsidian-countdown" });
    const countdown = new CountdownView(this, container, {
      target: parsed.target,
      label: parsed.label,
      color: parsed.color,
      context: blockContext,
      strings
    });
    ctx.addChild(countdown);
  }

  async updateCountdownBlock(context: CountdownBlockContext, data: CountdownBlockData) {
    const file = this.app.vault.getAbstractFileByPath(context.sourcePath);
    if (!(file instanceof TFile)) {
      new Notice(this.getStrings().applyError);
      return;
    }

    const content = await this.app.vault.read(file);
    const lines = content.split("\n");
    const { lineStart, lineEnd } = context.section;

    const iso = data.target.toISOString();
    const blockLines = serializeCountdownLines({ target: iso, label: data.label, color: data.color });

    lines.splice(lineStart, lineEnd - lineStart + 1, ...blockLines);
    await this.app.vault.modify(file, lines.join("\n"));
  }

  async loadSettings() {
    const stored = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, stored ?? {});

    if (!stored || stored.defaultLabel === undefined) {
      this.settings.defaultLabel = this.getStrings().defaultLabel;
    }

    if (!stored || stored.insertHotkey === undefined) {
      this.settings.insertHotkey = DEFAULT_SETTINGS.insertHotkey;
    }
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class CountdownModal extends Modal {
  private plugin: CountdownTimerPlugin;
  private options: CountdownModalOptions;
  private strings: Translations;
  private targetValue: string;
  private labelValue: string;
  private colorValue: string;

  constructor(app: App, plugin: CountdownTimerPlugin, options: CountdownModalOptions) {
    super(app);
    this.plugin = plugin;
    this.options = options;
    this.strings = options.strings;

    this.targetValue = toDateTimeLocalInput(options.initialTarget);
    this.labelValue = options.initialLabel;
    this.colorValue = normaliseColor(options.initialColor) ?? plugin.settings.defaultColor;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: this.options.heading });

    new Setting(contentEl)
      .setName(this.strings.targetLabel)
      .setDesc(this.strings.targetHint)
      .addText((text) => {
        text.setValue(this.targetValue);
        text.inputEl.type = "datetime-local";
        text.inputEl.onchange = () => {
          this.targetValue = text.getValue();
        };
      });

    new Setting(contentEl)
      .setName(this.strings.labelLabel)
      .setDesc(this.strings.labelHint)
      .addText((text) => {
        text.setPlaceholder(this.plugin.getDefaultLabel(this.strings));
        text.setValue(this.labelValue);
        text.onChange((value) => (this.labelValue = value));
      });

    new Setting(contentEl)
      .setName(this.strings.colorLabel)
      .setDesc(this.strings.colorHint)
      .addColorPicker((picker) => {
        picker.setValue(this.colorValue);
        picker.onChange((value) => {
          this.colorValue = normaliseColor(value) ?? this.plugin.settings.defaultColor;
        });
      });

    const actionSetting = new Setting(contentEl);
    actionSetting.addButton((btn) => {
      btn.setButtonText(this.strings.modalConfirm).setCta().onClick(() => void this.handleSubmit());
    });
    actionSetting.addExtraButton((btn) => {
      btn.setIcon("x").setTooltip(this.strings.modalCancel).onClick(() => this.close());
    });
  }

  private async handleSubmit() {
    if (!this.targetValue) {
      new Notice(this.strings.emptyWarning);
      return;
    }

    const parsed = parseTargetDate(this.targetValue);
    if (!parsed) {
      new Notice(this.strings.parseWarning);
      return;
    }

    const label = this.labelValue.trim() || this.plugin.getDefaultLabel(this.strings);
    const color = normaliseColor(this.colorValue) ?? this.plugin.settings.defaultColor;

    try {
      await this.options.onSubmit({ target: parsed, label, color });
      this.close();
    } catch (error) {
      console.error(error);
      new Notice(this.strings.applyError);
    }
  }
}

class CountdownView extends MarkdownRenderChild {
  private plugin: CountdownTimerPlugin;
  private strings: Translations;
  private target: Date;
  private label: string;
  private color: string;
  private context: CountdownBlockContext | null;
  private intervalId: number | null = null;
  private valueEls: Record<CountdownUnit["key"], HTMLElement>;
  private containerEl: HTMLElement;
  private labelEl: HTMLElement | null = null;
  private colorPopover: HTMLElement | null = null;

  constructor(plugin: CountdownTimerPlugin, containerEl: HTMLElement, options: CountdownViewOptions) {
    super(containerEl);
    this.plugin = plugin;
    this.containerEl = containerEl;
    this.target = options.target;
    this.label = options.label;
    this.color = options.color;
    this.context = options.context;
    this.strings = options.strings;
    this.valueEls = this.setupDom(containerEl);
  }

  onload() {
    this.tick();
    this.intervalId = window.setInterval(() => this.tick(), 1000);
  }

  onunload() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private setupDom(root: HTMLElement) {
    root.addClass("obsidian-countdown__container");
    this.applyColor(this.color);

    if (this.context) {
      const actions = root.createDiv({ cls: "obsidian-countdown__actions" });

      const editBtn = actions.createEl("button", { cls: "obsidian-countdown__action-btn" });
      editBtn.setAttr("type", "button");
      setIcon(editBtn, "pencil");
      editBtn.setAttribute("aria-label", this.strings.toolbarEdit);
      editBtn.setAttribute("title", this.strings.toolbarEdit);
      editBtn.addEventListener("mousedown", (evt) => evt.stopPropagation());
      editBtn.onclick = (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        this.openEditModal();
      };

      const colorBtn = actions.createEl("button", { cls: "obsidian-countdown__action-btn" });
      colorBtn.setAttr("type", "button");
      setIcon(colorBtn, "palette");
      colorBtn.setAttribute("aria-label", this.strings.toolbarColour);
      colorBtn.setAttribute("title", this.strings.toolbarColour);
      colorBtn.addEventListener("mousedown", (evt) => evt.stopPropagation());
      colorBtn.onclick = (evt) => {
        evt.preventDefault();
        evt.stopPropagation();
        this.toggleColorPopover();
      };

      const popover = root.createDiv({ cls: "obsidian-countdown__color-popover" });
      popover.createDiv({ cls: "obsidian-countdown__color-title", text: this.strings.colorPopoverTitle });
      const palette = popover.createDiv({ cls: "obsidian-countdown__color-options" });

      COLOR_PRESETS.forEach((hex) => {
        const option = palette.createEl("button", { cls: "obsidian-countdown__color-option" });
        option.setAttr("type", "button");
        option.setAttribute("aria-label", hex);
        option.style.setProperty("--color", hex);
        option.style.backgroundColor = hex;
        option.dataset.color = hex;
        if (colorsEqual(hex, this.color)) {
          option.addClass("is-selected");
        }
        option.addEventListener("mousedown", (evt) => evt.stopPropagation());
        option.onclick = async (evt) => {
          evt.preventDefault();
          evt.stopPropagation();
          await this.setColor(hex);
          this.closeColorPopover();
        };
      });

      popover.addEventListener("mousedown", (evt) => evt.stopPropagation());
      root.appendChild(popover);
      this.colorPopover = popover;

      this.registerDomEvent(window, "mousedown", (event) => {
        if (!this.containerEl.contains(event.target as Node)) {
          this.closeColorPopover();
        }
      });

      this.registerDomEvent(window, "keydown", (event) => {
        if ((event as KeyboardEvent).key === "Escape") {
          this.closeColorPopover();
        }
      });
    }

    const content = root.createDiv({ cls: "obsidian-countdown__content" });

    const digitsWrapper = content.createDiv({ cls: "obsidian-countdown__digits" });
    const valueElements: Partial<Record<CountdownUnit["key"], HTMLElement>> = {};
    const units: CountdownUnit[] = [
      { key: "days", label: this.strings.unitDays },
      { key: "hours", label: this.strings.unitHours },
      { key: "minutes", label: this.strings.unitMinutes },
      { key: "seconds", label: this.strings.unitSeconds }
    ];

    units.forEach((unit, index) => {
      const unitEl = digitsWrapper.createDiv({ cls: "obsidian-countdown__unit" });
      const valueEl = unitEl.createDiv({ cls: "obsidian-countdown__value", text: "00" });
      unitEl.createDiv({ cls: "obsidian-countdown__suffix", text: unit.label });
      valueElements[unit.key] = valueEl;

      if (index < units.length - 1) {
        digitsWrapper.createDiv({ cls: "obsidian-countdown__separator", text: ":" });
      }
    });

    this.labelEl = content.createDiv({ cls: "obsidian-countdown__label", text: this.label });

    return valueElements as Record<CountdownUnit["key"], HTMLElement>;
  }

  private toggleColorPopover() {
    if (!this.colorPopover) {
      return;
    }

    if (this.containerEl.hasClass("obsidian-countdown--color-open")) {
      this.closeColorPopover();
    } else {
      this.openColorPopover();
    }
  }

  private openColorPopover() {
    if (!this.colorPopover) {
      return;
    }
    this.containerEl.addClass("obsidian-countdown--color-open");
    this.updateColorSelection();
  }

  private closeColorPopover() {
    this.containerEl.removeClass("obsidian-countdown--color-open");
  }

  private updateColorSelection() {
    if (!this.colorPopover) {
      return;
    }
    const options = Array.from(this.colorPopover.querySelectorAll<HTMLElement>(".obsidian-countdown__color-option"));
    options.forEach((option) => {
      const dataColor = option.dataset.color ?? option.style.getPropertyValue("--color");
      const hex = normaliseColor(dataColor) ?? "";
      if (hex) {
        option.style.backgroundColor = hex;
      }
      if (colorsEqual(hex, this.color)) {
        option.addClass("is-selected");
      } else {
        option.removeClass("is-selected");
      }
    });
  }

  private async setColor(color: string) {
    if (!this.context || colorsEqual(color, this.color)) {
      return;
    }

    await this.plugin.updateCountdownBlock(this.context, {
      target: this.target,
      label: this.label,
      color
    });

    this.color = color;
    this.applyColor(color);
    this.updateColorSelection();
  }

  private applyColor(color: string) {
    this.containerEl.style.setProperty("--countdown-color", color);
  }

  private async openEditModal() {
    if (!this.context) {
      return;
    }

    new CountdownModal(this.plugin.app, this.plugin, {
      heading: this.strings.editHeading,
      strings: this.strings,
      initialTarget: this.target,
      initialLabel: this.label,
      initialColor: this.color,
      onSubmit: async ({ target, label, color }) => {
        await this.plugin.updateCountdownBlock(this.context!, { target, label, color });
        this.target = target;
        this.label = label;
        this.color = color;
        this.applyColor(color);
        this.labelEl?.setText(label);
        this.tick();
        this.updateColorSelection();
      }
    }).open();
  }

  private tick() {
    const now = Date.now();
    const diffMs = this.target.getTime() - now;
    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));

    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    this.valueEls.days.setText(pad(days));
    this.valueEls.hours.setText(pad(hours));
    this.valueEls.minutes.setText(pad(minutes));
    this.valueEls.seconds.setText(pad(seconds));

    if (diffMs <= 0) {
      this.containerEl.addClass("obsidian-countdown__expired");
      if (this.intervalId) {
        window.clearInterval(this.intervalId);
        this.intervalId = null;
      }
    } else {
      this.containerEl.removeClass("obsidian-countdown__expired");
    }
  }
}

class CountdownSettingTab extends PluginSettingTab {
  private plugin: CountdownTimerPlugin;

  constructor(app: App, plugin: CountdownTimerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    const strings = this.plugin.getStrings();

    containerEl.empty();
    containerEl.createEl("h2", { text: strings.settingsHeader });

    new Setting(containerEl)
      .setName(strings.settingsDefaultLabel)
      .setDesc(strings.labelHint)
      .addText((text) =>
        text.setValue(this.plugin.settings.defaultLabel).onChange(async (value) => {
          this.plugin.settings.defaultLabel = value.trim();
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(strings.settingsDefaultDuration)
      .setDesc(strings.targetHint)
      .addText((text) => {
        text.inputEl.type = "number";
        text.inputEl.min = "1";
        text.setValue(String(this.plugin.settings.defaultDurationMinutes));
        text.onChange(async (value) => {
          const parsed = Number(value);
          if (!Number.isFinite(parsed) || parsed <= 0) {
            return;
          }
          this.plugin.settings.defaultDurationMinutes = Math.floor(parsed);
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName(strings.settingsDefaultColour)
      .setDesc(strings.colorHint)
      .addColorPicker((picker) => {
        picker.setValue(this.plugin.settings.defaultColor);
        picker.onChange(async (value) => {
          const normalised = normaliseColor(value) ?? DEFAULT_SETTINGS.defaultColor;
          this.plugin.settings.defaultColor = normalised;
          await this.plugin.saveSettings();
        });
      });
  }
}

function parseCountdownSource(source: string, fallbackLabel: string, fallbackColor: string) {
  const lines = source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!lines.length) {
    return {
      target: null,
      label: fallbackLabel,
      color: fallbackColor
    };
  }

  const target = parseTargetDate(lines[0]);
  const label = (lines[1] || fallbackLabel).trim();
  const color = normaliseColor(lines[2]) ?? fallbackColor;

  return { target, label, color };
}

function serializeCountdownLines(data: { target: string; label: string; color: string }) {
  return ["```countdown", data.target, data.label, data.color, "```"];
}

function normaliseColor(input: string | undefined): string | null {
  if (!input) {
    return null;
  }
  const value = input.trim();
  const match = value.match(/^#([0-9a-fA-F]{6})$/);
  return match ? `#${match[1].toUpperCase()}` : null;
}

function colorsEqual(a: string, b: string) {
  return normaliseColor(a) === normaliseColor(b);
}

function parseTargetDate(input: string | undefined): Date | null {
  if (!input) {
    return null;
  }

  const normalized = input.trim().replace(/\s+/, "T");
  const timestamp = Date.parse(normalized);
  if (Number.isNaN(timestamp)) {
    return null;
  }

  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateTimeLocalInput(date: Date): string {
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

function getTranslations(app: App): Translations {
  const localeCandidate =
    (app as any)?.locale ??
    (app as any)?.lang ??
    (app.vault as any)?.getConfig?.("locale") ??
    (typeof window !== "undefined" && window.localStorage?.getItem("language")) ??
    (typeof window !== "undefined" && window.localStorage?.getItem("lang")) ??
    (typeof navigator !== "undefined" ? navigator.language : "en");

  const locale = String(localeCandidate ?? "en").toLowerCase();
  if (locale.startsWith("zh")) {
    return zhStrings;
  }
  return enStrings;
}
