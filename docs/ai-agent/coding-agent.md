# AI Coding Agent

AI 编程 Agent 是当前最热门的 AI 应用方向之一，它直接参与代码编写、调试、审查等开发工作。

## 什么是 AI Coding Agent？

与聊天式 AI 助手不同，Coding Agent 能够**自主完成编程任务**——读代码、写代码、运行测试、修复 bug，形成闭环。

```
普通 AI 助手：
  你问 → 它回答（你手动执行）

AI Coding Agent：
  你描述需求 → 它自己读代码、写代码、运行、调试、提交
```

## 主流产品

### Claude Code

Anthropic 官方的命令行编程 Agent。

**特点：**
- 运行在终端中，直接操作你的项目文件
- 支持读取、编辑、创建文件
- 可以执行 Shell 命令（运行测试、安装依赖等）
- 支持多文件编辑，理解项目上下文
- 支持 MCP 扩展工具能力

**典型使用场景：**
```bash
# 启动
claude

# 直接描述任务
> 帮我给用户模块添加邮箱验证功能

# 它会：
# 1. 读取现有的用户模块代码
# 2. 设计修改方案
# 3. 编辑相关文件
# 4. 运行测试验证
# 5. 提交代码（如果你同意）
```

**核心能力：**
- 理解整个项目上下文（不只是当前文件）
- 自主决策使用哪些工具
- 在执行前确认有风险的操作
- 支持 CLAUDE.md 项目配置

### GitHub Copilot

最广泛使用的 AI 编程助手。

**形态：**
- **Copilot Edit** — IDE 内代码补全和建议
- **Copilot Chat** — IDE 内对话
- **Copilot Agent** — 自主完成 GitHub Issue

**特点：**
- 深度集成 VS Code / JetBrains
- 代码补全体验最流畅
- 支持自然语言转代码
- Agent 模式可以自主解决 Issue

### Cursor

基于 VS Code 的 AI-first 代码编辑器。

**特点：**
- 内置 AI 对话和编辑功能
- **Composer 模式** — 多文件自主编辑
- 支持 Claude / GPT 等多种模型
- Codebase 索引，理解整个项目
- `.cursorrules` 文件配置项目规则

**核心功能：**
```
Cmd+K → 选中代码，自然语言修改
Cmd+L → 打开 AI 对话面板
Composer → 多文件自主编辑模式
```

### 其他产品

| 产品 | 形态 | 特点 |
|------|------|------|
| Windsurf (Codeium) | IDE | AI Flow 理念，Cascade 多步编辑 |
| Devin | 独立 Agent | Cognition 出品，全自主编程 |
| OpenHands | 开源 Agent | 前身 OpenDevin，可自部署 |
| Aider | 命令行工具 | 开源，支持多种模型 |
| Continue | VS Code/JetBrains 插件 | 开源，可配置 |

## 技术原理

### 核心架构

```
用户指令
   ↓
┌──────────────┐
│  LLM 推理    │ ← 理解需求、规划方案
└──────┬───────┘
       ↓
┌──────────────┐
│  工具调用     │ ← 读文件、写文件、执行命令
└──────┬───────┘
       ↓
┌──────────────┐
│  反馈处理     │ ← 分析执行结果（报错、测试结果）
└──────┬───────┘
       ↓
  继续或完成
```

### 关键技术

**1. 上下文管理**

代码项目可能很大，需要智能地选择上下文：

```python
# 检索相关文件
relevant_files = codebase_index.search(user_query, top_k=10)

# 构建上下文
context = ""
for file in relevant_files:
    context += f"\n--- {file.path} ---\n{file.content}\n"
```

**2. 文件编辑**

不是重写整个文件，而是精确地做 diff 编辑：

```python
# Agent 输出的编辑指令
edit = {
    "file": "src/auth.py",
    "old_string": "def login(username, password):\n    ...",
    "new_string": "def login(username, password, mfa_code=None):\n    ..."
}
```

**3. 执行与验证**

```
编辑代码 → 运行测试 → 测试通过？
                       ├── 是 → 完成
                       └── 否 → 分析报错 → 修复 → 重新运行
```

**4. 安全边界**

```
读写文件 → 检查路径是否在项目目录内
执行命令 → 确认后执行（可配置自动批准）
网络访问 → 默认禁止
删除操作 → 必须确认
```

## 最佳实践

### 写好项目配置

**CLAUDE.md（Claude Code）**

```markdown
# 项目说明
这是一个 Python FastAPI 后端项目。

# 技术栈
- Python 3.11
- FastAPI + SQLAlchemy
- PostgreSQL
- pytest 测试

# 代码规范
- 使用 type hints
- 函数添加 docstring
- 遵循 PEP 8

# 注意事项
- 不要修改 alembic 迁移文件
- 测试文件放在 tests/ 目录
- API 路由在 src/api/ 目录
```

**.cursorrules（Cursor）**

```markdown
- 这是 TypeScript + Next.js 项目
- 使用 Tailwind CSS
- 优先使用函数组件和 hooks
- 不要使用 any 类型
```

### 给 Agent 好的指令

```
❌ 修个 bug
✅ 在 src/auth.py 的 login 函数中，添加对密码为空的情况的处理，
   应该返回 400 错误和 "密码不能为空" 的消息

❌ 写个功能
✅ 在用户注册流程中添加邮箱验证步骤：
   1. 注册后发送验证邮件
   2. 用户点击链接验证
   3. 验证后才能登录
   需要修改的文件：src/auth.py, src/models.py, src/email.py
   参考现有代码风格
```

### 有效使用模式

| 场景 | 推荐工具 | 用法 |
|------|----------|------|
| 快速补全 | Copilot | 写注释，Tab 接受 |
| 单文件修改 | Cursor Cmd+K | 选中代码，描述修改 |
| 多文件重构 | Cursor Composer / Claude Code | 描述整体需求 |
| Bug 修复 | Claude Code | 贴报错信息，让它自己找原因 |
| 写测试 | Claude Code | "给 xxx 写测试" |
| Code Review | Claude Code | "审查最近的改动" |
| 学习代码 | Cursor Chat | "这段代码在做什么？" |

## 对开发者的影响

### 积极面

- **效率提升** — 重复性编码工作大幅减少
- **学习加速** — 快速理解不熟悉的代码库
- **降低门槛** — 不熟悉的语言也能写代码
- **减少错误** — AI 可以发现常见的 bug

### 注意事项

- **代码审查更重要** — AI 生成的代码也需要 review
- **安全风险** — 不要盲目信任 AI 生成的代码
- **理解比生成重要** — 不能只依赖 AI，要理解原理
- **Prompt 技能** — 清晰描述需求是核心能力

## 未来趋势

- **更强的自主性** — Agent 能处理更复杂的多文件任务
- **更好的项目理解** — 索引整个代码库，理解架构
- **团队协作** — 多个 Agent 分工协作
- **DevOps 集成** — 从写代码到部署的全流程
- **定制化** — 基于团队代码风格和规范定制 Agent
