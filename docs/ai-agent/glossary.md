# 术语表

AI Agent 相关术语的中英对照速查。

## A

| 英文 | 中文 | 说明 |
|------|------|------|
| Agent | 智能体 | 能自主感知、决策、执行的 AI 系统 |
| Agentic RAG | 智能体化 RAG | Agent 自主决定检索策略的 RAG |
| A2A (Agent-to-Agent) | 智能体间通信协议 | Google 推出的 Agent 间通信标准 |
| Augmented LLM | 增强型 LLM | 配备工具和检索能力的 LLM |

## B

| 英文 | 中文 | 说明 |
|------|------|------|
| Batch API | 批量 API | 异步批量处理请求，成本更低 |

## C

| 英文 | 中文 | 说明 |
|------|------|------|
| Chain of Thought (CoT) | 思维链 | 让模型展示推理过程的技术 |
| Chunking | 分块 | 将文档切分为小段用于检索 |
| Context Window | 上下文窗口 | 模型一次能处理的最大 token 数 |
| CrewAI | — | 多 Agent 协作框架 |

## D

| 英文 | 中文 | 说明 |
|------|------|------|
| Embedding | 向量化 / 嵌入 | 将文本转为数值向量的过程 |

## E

| 英文 | 中文 | 说明 |
|------|------|------|
| Evaluator-Optimizer | 评估-优化器 | Agent 设计模式之一，生成-评估-改进循环 |
| Episodic Memory | 情景记忆 | 记录具体事件和经历的记忆类型 |

## F

| 英文 | 中文 | 说明 |
|------|------|------|
| FAISS | — | Meta 开源的向量相似搜索库 |
| Few-shot Learning | 少样本学习 | 通过少量示例引导模型 |
| Fine-tuning | 微调 | 在特定数据上继续训练模型 |
| Function Calling | 函数调用 / 工具调用 | LLM 调用外部工具的能力 |

## G

| 英文 | 中文 | 说明 |
|------|------|------|
| Ground Truth | 真实值 / 标准答案 | 评估模型输出时的参考标准 |

## H

| 英文 | 中文 | 说明 |
|------|------|------|
| Hallucination | 幻觉 | 模型编造不存在的信息 |
| Hybrid Search | 混合检索 | 结合向量检索和关键词检索 |

## I

| 英文 | 中文 | 说明 |
|------|------|------|
| In-context Learning | 上下文学习 | 不更新模型参数，通过 Prompt 让模型学习 |

## K

| 英文 | 中文 | 说明 |
|------|------|------|
| Knowledge Graph | 知识图谱 | 结构化的知识表示，用三元组存储事实 |

## L

| 英文 | 中文 | 说明 |
|------|------|------|
| LangChain | — | 最主流的 LLM 应用开发框架 |
| LangGraph | — | LangChain 的状态图扩展 |
| LLM (Large Language Model) | 大语言模型 | GPT、Claude 等大规模语言模型 |
| Long-term Memory | 长期记忆 | 跨会话持久化的记忆 |

## M

| 英文 | 中文 | 说明 |
|------|------|------|
| MCP (Model Context Protocol) | 模型上下文协议 | Anthropic 推出的工具连接标准 |
| Memory | 记忆 | Agent 维持上下文的能力 |
| MMR (Maximal Marginal Relevance) | 最大边际相关性 | 兼顾相关性和多样性的检索方法 |
| Multi-Agent | 多智能体 | 多个 Agent 协同工作 |
| Multimodal | 多模态 | 处理文本、图片、语音等多种信息 |

## O

| 英文 | 中文 | 说明 |
|------|------|------|
| Orchestrator-Worker | 编排者-执行者 | Agent 设计模式之一 |

## P

| 英文 | 中文 | 说明 |
|------|------|------|
| Parallelization | 并行化 | Agent 设计模式之一，多个 LLM 并行处理 |
| Prompt Chaining | 提示链 | 多步骤串行执行的 Agent 设计模式 |
| Prompt Engineering | 提示词工程 | 与 LLM 有效沟通的技术 |
| Prompt Injection | 提示注入 | 一种安全攻击，在输入中嵌入恶意指令 |

## R

| 英文 | 中文 | 说明 |
|------|------|------|
| RAG (Retrieval-Augmented Generation) | 检索增强生成 | 先检索相关文档再生成回答的技术 |
| ReAct | 推理+行动 | Agent 核心模式，推理和行动交替进行 |
| Reasoning | 推理 | 模型分析和解决问题的过程 |
| Reranking | 重排序 | 对检索结果做二次精排 |
| Routing | 路由 | 根据输入类型分发到不同处理流程 |
| RAGAS | — | RAG 评估框架 |

## S

| 英文 | 中文 | 说明 |
|------|------|------|
| Semantic Memory | 语义记忆 | 结构化的知识存储 |
| Short-term Memory | 短期记忆 | 当前对话的消息历史 |
| System Prompt | 系统提示词 | 定义 Agent 角色和行为的 Prompt |
| Self-Consistency | 自一致性 | 多次生成取最一致结果的方法 |

## T

| 英文 | 中文 | 说明 |
|------|------|------|
| Temperature | 温度 | 控制模型输出随机性的参数 |
| Token | 词元 | 模型处理文本的最小单位 |
| Tool Use | 工具使用 | LLM 调用外部工具的能力 |
| Top-P | 核采样参数 | 控制候选词范围的参数 |
| Tree of Thoughts | 思维树 | 树状推理结构，提升规划能力 |

## V

| 英文 | 中文 | 说明 |
|------|------|------|
| Vector Database | 向量数据库 | 存储和检索向量数据的数据库 |
| Vector Store | 向量存储 | 向量数据库的统称 |

## W

| 英文 | 中文 | 说明 |
|------|------|------|
| Working Memory | 工作记忆 | 当前任务的临时状态 |
| Workflow | 工作流 | 预定义的固定执行流程 |

## Z

| 英文 | 中文 | 说明 |
|------|------|------|
| Zero-shot | 零样本 | 不给示例直接让模型完成任务 |
| Zero-shot CoT | 零样本思维链 | 不给示例但要求模型展示推理过程 |
