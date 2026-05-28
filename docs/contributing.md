# 贡献指南

欢迎为这个项目贡献内容！

## 如何贡献

### 方式一：直接提交内容

1. Fork 本仓库
2. 在 `docs/` 目录下创建或编辑 Markdown 文件
3. 如果新增页面，更新 `docs/.vitepress/config.mts` 中的导航配置
4. 提交 Pull Request

### 方式二：提出建议

- 在 Issues 中提出你想看的内容主题
- 对现有内容提出改进建议
- 报告内容错误或过时信息

## 内容规范

### 文件命名

- 使用小写英文 + 短横线：`my-topic.md`
- 不要使用中文文件名或空格

### Markdown 格式

```markdown
---
# 不需要 frontmatter（首页除外）
---

# 页面标题

简短介绍段落。

## 二级标题

正文内容。

### 三级标题

更细分的内容。
```

### 写作风格

- 使用中文
- 语言简洁，避免大段文字
- 多用表格、列表、代码示例
- 实用为主，减少纯理论
- 提供可运行的代码示例
- 标注信息来源（如论文、官方文档链接）

### 代码示例

- 优先使用 Python
- 代码要可运行（包含 import）
- 添加必要的注释
- 保持示例简洁，突出重点

## 目录结构

```
docs/
├── .vitepress/config.mts    # 站点配置
├── index.md                 # 首页
├── faq.md                   # FAQ
├── changelog.md             # 更新日志
├── contributing.md          # 本文件
└── ai-agent/                # AI Agent 主题
    ├── index.md             # 主题首页
    ├── basics.md            # 各个页面
    └── ...
```

## 添加新页面

### 1. 创建 Markdown 文件

在 `docs/ai-agent/` 下创建新的 `.md` 文件。

### 2. 更新导航

在 `docs/.vitepress/config.mts` 的 `sidebar` 中添加：

```typescript
sidebar: {
  '/ai-agent/': [
    {
      text: '分类名',
      items: [
        { text: '页面标题', link: '/ai-agent/your-new-page' },
      ],
    },
  ],
}
```

### 3. 本地预览

```bash
npm run dev
# 访问 http://localhost:5173
```

### 4. 检查清单

- [ ] 内容准确、无错别字
- [ ] 代码示例可运行
- [ ] 导航配置已更新
- [ ] 本地预览正常显示
