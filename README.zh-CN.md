# Countdown Timer（飞书风格倒计时）

[English README](README.md) · [发布页](https://github.com/MoshiQAQ/obsidian-countdown-plugin/releases) · [问题反馈](https://github.com/MoshiQAQ/obsidian-countdown-plugin/issues)

在 Obsidian 中插入飞书/Lark 风格的倒计时模块。插件会根据 Obsidian 界面语言自动切换中英文文案，并提供快捷的悬浮操作按钮，让你随时修改时间或配色。

## 功能亮点
- **飞书式外观**：方块数字、中文单位、过期灰显，一眼识别。
- **命令面板一键插入**：运行 `Insert countdown timer / 插入倒计时` 即可。
- **所见即所得的编辑体验**：悬浮按钮支持修改时间、标签或切换预设颜色。
- **代码块保存全部信息**：ISO 时间、标签、颜色各占一行，随时手动调整。
- **全局默认值**：在设置页配置默认标签、默认倒计时时长与初始颜色。

## 使用环境
- Obsidian ≥ v1.4.0（桌面 / 移动端）
- 无需联网或额外密钥

## 安装方式
### 方式 A · 下载发布包
1. 打开最新的 [Release 页面](https://github.com/MoshiQAQ/obsidian-countdown-plugin/releases)。
2. 下载压缩包（如 `obsidian-countdown-plugin-vX.X.X.zip`）。
3. 解压后放入库目录的 `.obsidian/plugins/obsidian-countdown-plugin/`，目录内应包含 `manifest.json`、`main.js`、`styles.css`。
4. 在 Obsidian 设置 → 社区插件 中刷新后启用 **Countdown Timer**。

### 方式 B · 本地构建
```bash
npm install      # 安装依赖
npm run dev      # 开启监听（开发时使用）
npm run build    # 生成发布版
```
构建完成后，将 `manifest.json`、`main.js`、`styles.css` 拷贝到插件目录即可。

## 快速上手
1. 在任意笔记中运行命令 **Insert countdown timer / 插入倒计时**。
2. 在弹窗里选择目标时间、填写（或留空）标签，并挑选喜欢的高亮颜色。
3. 插件会插入类似下面的代码块：
   ```countdown
   2024-12-31T16:00:00.000Z
   新年倒计时
   #F79009
   ```
4. 切换到阅读模式或实时预览，就能看到倒计时实时更新；悬浮右上角即可再次编辑或换色。

### 支持的命令
| 命令 | 说明 |
| --- | --- |
| `Insert countdown timer` / `插入倒计时` | 弹出创建新倒计时的窗口，在光标处插入代码块。 |

### 设置项说明
| 设置项 | 作用 |
| --- | --- |
| 默认标签 | 当代码块未填写标签时使用，自动随界面语言切换。 |
| 默认时长（分钟） | 打开弹窗时自动加上的“未来多久”。 |
| 默认颜色 | 新建计时器时的初始高亮颜色。 |

## 小贴士
- 代码块的三行分别是：ISO 时间、标签、十六进制颜色，可手动编辑。
- 如果 Obsidian 改为中文界面，计时器单位会自动变为“天/时/分/秒”。
- 倒计时结束后会自动变灰，方便事后查看。

## 参与贡献
欢迎通过 Issue 或 PR 反馈问题、提交改进。项目结构参考官方 [obsidian-sample-plugin](https://github.com/obsidianmd/obsidian-sample-plugin)，提交前请运行 `npm run build` 确认通过构建。

## 许可证
MIT
