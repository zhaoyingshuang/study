# 学习资源

## 必读文章

### 综述与架构

| 文章 | 说明 |
|------|------|
| [LLM Powered Autonomous Agents](https://lilianweng.github.io/posts/2023-06-23-agent/) | Lilian Weng 的经典综述，Agent 架构必读 |
| [A Survey on Large Language Model based Autonomous Agents](https://arxiv.org/abs/2308.11432) | Agent 综述论文，系统全面 |
| [The Landscape of Emerging AI Agent Architectures](https://www.cognitivestrategy.ai/blog/the-landscape-of-emerging-ai-agent-architectures) | Agent 架构全景 |
| [Building effective agents](https://docs.anthropic.com/en/docs/build-with-claude/agent-patterns) | Anthropic 官方 Agent 设计模式指南 |

### 核心论文

| 论文 | 说明 |
|------|------|
| [ReAct](https://arxiv.org/abs/2210.03629) | 推理+行动范式，Agent 的核心模式 |
| [Toolformer](https://arxiv.org/abs/2302.04761) | LLM 自学使用工具 |
| [Generative Agents](https://arxiv.org/abs/2304.03442) | 斯坦福小镇，交互式 Agent |
| [Tree of Thoughts](https://arxiv.org/abs/2305.10601) | 树状推理，提升规划能力 |
| [Self-Refine](https://arxiv.org/abs/2303.17651) | 自我迭代优化输出 |
| [Retrieval-Augmented Generation](https://arxiv.org/abs/2005.11401) | RAG 原论文 |

## 官方文档

### 框架文档

| 框架 | 文档地址 |
|------|----------|
| LangChain | https://python.langchain.com/ |
| LangGraph | https://langchain-ai.github.io/langgraph/ |
| CrewAI | https://docs.crewai.com/ |
| AutoGen | https://microsoft.github.io/autogen/ |
| LlamaIndex | https://docs.llamaindex.ai/ |

### 模型 API 文档

| 模型 | 文档地址 |
|------|----------|
| Anthropic Claude | https://docs.anthropic.com/ |
| OpenAI | https://platform.openai.com/docs |
| 智谱 GLM | https://open.bigmodel.cn/dev/api |
| 通义千问 | https://help.aliyun.com/zh/dashscope/ |
| DeepSeek | https://platform.deepseek.com/api-docs |

## 视频课程

### 免费课程

| 课程 | 平台 | 说明 |
|------|------|------|
| AI Agents in LangGraph | DeepLearning.AI | LangGraph 入门，Andrew Ng 出品 |
| Functions, Tools and Agents with LangChain | DeepLearning.AI | 工具调用和 Agent 基础 |
| Building Agentic RAG with LlamaIndex | DeepLearning.AI | RAG + Agent 结合 |
| Multi AI Agent Systems with CrewAI | DeepLearning.AI | CrewAI 多 Agent |
| Prompt Engineering for Developers | DeepLearning.AI | Prompt 工程入门 |

### YouTube / B 站

- **3Blue1Brown** — 神经网络和 Transformer 直观讲解
- **Andrej Karpathy** — Let's build GPT 系列
- **LangChain YouTube** — 官方教程和更新
- B 站搜索「AI Agent」「LangChain 教程」有大量中文教程

## 开源项目

### 学习型项目

| 项目 | 说明 |
|------|------|
| [MetaGPT](https://github.com/geekan/MetaGPT) | 多 Agent 软件开发团队，代码质量高 |
| [AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) | 自主 Agent 先驱，了解 Agent 起源 |
| [OpenHands](https://github.com/All-Hands-AI/OpenHands) | AI 编程 Agent，架构设计优秀 |
| [AutoGen Examples](https://github.com/microsoft/autogen/tree/main/python/packages/autogen-agentchat/samples) | 微软官方示例集 |

### 生产级项目

| 项目 | 说明 |
|------|------|
| [Dify](https://github.com/langgenius/dify) | LLM 应用开发平台，功能完整 |
| [Anything LLM](https://github.com/Mintplex-Labs/anything-llm) | 全能 RAG 应用 |
| [Flowise](https://github.com/FlowiseAI/Flowise) | 可视化 LLM 工作流 |
| [Langflow](https://github.com/langflow-ai/langflow) | 可视化 LangChain |

### 模板与脚手架

| 项目 | 说明 |
|------|------|
| [create-llama](https://github.com/run-llama/create-llama) | LlamaIndex 项目脚手架 |
| [LangChain Templates](https://github.com/langchain-ai/langchain/tree/master/templates) | LangChain 官方模板 |

## 社区与资讯

### 社区

| 社区 | 说明 |
|------|------|
| [LangChain GitHub Discussions](https://github.com/langchain-ai/langchain/discussions) | LangChain 社区讨论 |
| [r/LangChain](https://www.reddit.com/r/LangChain/) | Reddit LangChain 板块 |
| [r/LocalLLaMA](https://www.reddit.com/r/LocalLLaMA/) | 本地模型社区 |
| 掘金 AI 话题 | 中文技术社区 |
| 知乎 AI Agent 话题 | 中文讨论 |

### 资讯

- [The Batch (DeepLearning.AI)](https://www.deeplearning.ai/the-batch/) — Andrew Ng 的 AI 周报
- [TLDR AI](https://tldr.tech/ai) — AI 每日快讯
- [Latent Space](https://www.latent.space/) — AI 工程播客和通讯
- [LangChain Blog](https://blog.langchain.dev/) — LangChain 官方博客

## 推荐学习顺序

```
第 1 周：基础
├── 看 DeepLearning.AI 的 Prompt Engineering 课程
├── 阅读 Lilian Weng 的 Agent 综述
└── 动手：用 API 调用 LLM，尝试 Function Calling

第 2 周：框架入门
├── 看 DeepLearning.AI 的 LangGraph 课程
├── 跑通一个简单的 Agent 示例
└── 动手：做一个能搜索+计算的简单 Agent

第 3 周：RAG
├── 看 Building Agentic RAG 课程
├── 理解 Embedding、向量数据库
└── 动手：做一个文档问答系统

第 4 周：进阶
├── 阅读论文：ReAct、Tree of Thoughts
├── 学习 Multi-Agent 模式
└── 动手：做一个完整的项目（见实战项目页面）
```
