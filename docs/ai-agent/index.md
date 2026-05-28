# AI 智能体开发

## 什么是 AI Agent？

AI Agent（智能体）是一个能够**感知环境、自主决策、执行动作以达成目标**的 AI 系统。

它不仅仅是一个聊天机器人。传统 LLM 对话是被动的「你问我答」，而 Agent 是主动的——它能自己规划任务、调用工具、根据反馈调整策略。

### Agent vs 传统 LLM 对话

| 维度 | 传统 LLM 对话 | AI Agent |
|------|---------------|----------|
| 交互模式 | 一问一答 | 自主循环执行 |
| 工具使用 | 无 | 能调用 API、搜索、执行代码 |
| 记忆 | 仅当前对话 | 短期 + 长期记忆 |
| 任务处理 | 单轮回答 | 拆解复杂任务，分步执行 |
| 错误处理 | 无法自我纠正 | 根据反馈调整策略 |

### Agent 的核心能力

1. **规划（Planning）** — 将复杂任务拆解为可执行的子任务
2. **工具调用（Tool Use）** — 调用外部 API、数据库、搜索引擎等
3. **记忆（Memory）** — 维持对话上下文，记住历史交互
4. **反思（Reflection）** — 评估自己的输出，发现并纠正错误
5. **协作（Collaboration）** — 与其他 Agent 或人类协同工作

### Agent 的典型架构

```
用户输入
  ↓
┌─────────────┐
│   Planner   │ ← 任务规划，拆解子任务
└──────┬──────┘
       ↓
┌─────────────┐
│   Agent     │ ← 核心循环：推理 → 行动 → 观察
│  (LLM +    │
│  ReAct)    │
└──────┬──────┘
       ↓
┌─────────────┐
│   Tools     │ ← 搜索 / API / 数据库 / 代码执行
└──────┬──────┘
       ↓
┌─────────────┐
│   Memory    │ ← 短期记忆（对话历史）+ 长期记忆（向量库）
└─────────────┘
```

## 学习路径

按照以下顺序学习，循序渐进：

```
第 1 步：基础概念
  ├── LLM 基本原理
  ├── Prompt Engineering
  └── Function Calling
       ↓
第 2 步：核心技术
  ├── RAG（检索增强生成）
  ├── Agent 框架（LangChain / LangGraph）
  └── 记忆系统
       ↓
第 3 步：进阶
  ├── Multi-Agent 协作
  ├── Agent 评估与测试
  └── 生产部署
       ↓
第 4 步：实战
  └── 动手做项目，巩固所学
```

## 开始学习

- [基础概念](/ai-agent/basics) — 从零理解 Agent 的底层概念
- [技术栈总览](/ai-agent/tech-stack) — 工具和框架速查
- [Prompt Engineering](/ai-agent/prompt-engineering) — 提示词工程详解
- [Function Calling](/ai-agent/function-calling) — 工具调用详解
- [RAG 技术](/ai-agent/rag) — 检索增强生成
- [Multi-Agent](/ai-agent/multi-agent) — 多智能体协作
- [实战项目](/ai-agent/practice) — 动手做项目
- [学习资源](/ai-agent/resources) — 精选外部资源
