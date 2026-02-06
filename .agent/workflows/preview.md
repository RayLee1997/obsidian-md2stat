---
description: 开发模式预览 Obsidian 插件
---

# 开发模式预览 Obsidian 插件

本 workflow 帮助你快速启动开发模式并在 Obsidian 中预览插件效果。

## 步骤

### 1. 安装依赖（首次运行）

如果是第一次运行，需要先安装 npm 依赖：

// turbo

```bash
npm install
```

### 2. 启动开发模式

启动开发模式会自动监听文件变化并重新编译：

```bash
npm run dev
```

**注意**：开发模式会持续运行，按 `Ctrl+C` 停止。

### 3. 部署到 Obsidian（首次设置）

创建软链接将插件部署到 Obsidian：

// turbo

```bash
# 确保插件目录存在
mkdir -p /Users/ray/Obsidian/.obsidian/plugins

# 创建软链接（只需运行一次）
ln -sf $(pwd) /Users/ray/Obsidian/.obsidian/plugins/obsidian-md2stat
```

如果软链接不工作，可以手动复制文件：

```bash
# 确保插件目录存在
mkdir -p /Users/ray/Obsidian/.obsidian/plugins/obsidian-md2stat

# 复制必要文件
cp main.js manifest.json styles.css /Users/ray/Obsidian/.obsidian/plugins/obsidian-md2stat/
cp -r assets /Users/ray/Obsidian/.obsidian/plugins/obsidian-md2stat/ 2>/dev/null || true
```

### 4. 在 Obsidian 中启用插件

在 Obsidian 中：

1. 打开 **设置** → **第三方插件**
2. 关闭**安全模式**（如果尚未关闭）
3. 刷新插件列表
4. 找到 **Obsidian MD to Stat** 并启用

### 5. 查看效果

- 打开任意 Markdown 文档
- 点击右侧边栏的眼睛图标 👁️ 打开公众号预览面板
- 选择模板、调整字体和字号
- 实时预览转换效果

### 6. 开发调试技巧

**重新加载插件：**

- 修改代码后，在 Obsidian 中按 `Cmd+R` (Mac) 或 `Ctrl+R` (Windows)
- 或者在设置中禁用再重新启用插件

**查看控制台日志：**

- 在 Obsidian 中按 `Cmd+Opt+I` (Mac) 或 `Ctrl+Shift+I` (Windows)
- 打开开发者工具查看错误信息和日志

**停止开发模式：**

- 在终端中按 `Ctrl+C`

## 构建生产版本

如果要打包发布版本：

```bash
npm run build
bash build.sh
```

这会在项目上两级目录创建发布用的 zip 文件。
