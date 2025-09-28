# Countdown Timer (Lark Style)

[中文说明 (Chinese README)](README.zh-CN.md) · [Latest Release](https://github.com/MoshiQAQ/obsidian-countdown-plugin/releases) · [Issue Tracker](https://github.com/MoshiQAQ/obsidian-countdown-plugin/issues)

Bring Feishu/Lark-style countdown blocks to Obsidian. The plugin renders a vivid, live-updating timer that adapts to your app language (English or Chinese), and lets you tweak its look without leaving your note.

## Highlights
- **Lark-inspired design** – ribbon digits, localized labels, and smooth hover actions.
- **Command palette workflow** – insert timers anywhere with `Insert countdown timer`.
- **Editable in place** – change the target date/time or switch preset colours from inline buttons.
- **Per-note configuration** – optional label stored in the code block alongside the ISO timestamp and colour.
- **Global defaults** – set fallback label, duration (minutes), and colour in the plugin settings.

## Requirements
- Obsidian v1.4.0 or newer (desktop or mobile)
- No additional services or API keys

## Installation
### Option A · Download from Releases
1. Visit the [latest release](https://github.com/MoshiQAQ/obsidian-countdown-plugin/releases).
2. Download the asset archive (e.g. `obsidian-countdown-plugin-vX.X.X.zip`).
3. Extract the archive into your vault’s `.obsidian/plugins/obsidian-countdown-plugin/` directory so it contains `manifest.json`, `main.js`, and `styles.css`.
4. In Obsidian, open *Settings → Community plugins*, disable **Safe mode** if needed, and enable **Countdown Timer**.

### Option B · Build from source
```bash
# install dependencies
npm install

# watch mode for development	npm run dev
# or build once for release
npm run build
```
Copy the generated `manifest.json`, `main.js`, and `styles.css` into `.obsidian/plugins/obsidian-countdown-plugin/` afterwards.

## Getting Started
1. Open any Markdown note and run the command **Insert countdown timer**.
2. Pick the target date/time, enter an optional label, and choose one of the preset highlight colours.
3. The plugin inserts a code block similar to:
   ```countdown
   2024-12-31T16:00:00.000Z
   New Year Countdown
   #F79009
   ```
4. Switch to Reading or Live Preview mode to watch the timer tick down. Hover the block to reveal inline buttons for editing or recolouring.

### Commands
| Command | Description |
| --- | --- |
| `Insert countdown timer` | Opens the modal to create a new countdown at the cursor. |

### Settings
| Setting | Description |
| --- | --- |
| Default label | Used when the block omits a custom label (auto-localised). |
| Default duration (minutes) | Pre-fills the modal with a relative future time. |
| Default colour | Initial highlight colour for new timers. |

## Tips & Notes
- The code block stores three lines: ISO timestamp, label, and hex colour. You can edit them manually if you prefer.
- When Obsidian runs in Chinese, the UI strings and unit labels switch automatically.
- Expired timers grey out but stay in place for reference.

## Contributing & Building
Pull requests and issues are welcome. This project follows the same layout as the official [obsidian-sample-plugin](https://github.com/obsidianmd/obsidian-sample-plugin). Before opening a PR, run `npm run build` and ensure linting/tests (if any) pass.

## License
MIT
