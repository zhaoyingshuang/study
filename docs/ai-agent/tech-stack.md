# 技术栈总览

## Agent 框架

### LangChain / LangGraph

最主流的 Agent 开发框架，生态最完善。

**LangChain** 提供了 LLM 应用的基础组件：模型封装、提示模板、工具、记忆、链式调用。

**LangGraph** 在 LangChain 基础上提供了**状态图**能力，用图结构定义 Agent 的执行流程，支持循环、分支、并行。

```python
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI

model = ChatOpenAI(model="gpt-4o")
agent = create_react_agent(model, tools=[search_tool, calculator_tool])
result = agent.invoke({"messages": [{"role": "user", "content": "帮我算一下"}]})
```

**适用场景：** 需要 fine-grained 控制 Agent 流程的场景

### CrewAI

多 Agent 协作框架，用「团队」的概念组织多个 Agent。

```python
from crewai import Agent, Task, Crew

researcher = Agent(
    role="研究员",
    goal="收集和分析信息",
    backstory="你是一个经验丰富的技术研究员",
    llm=llm
)

writer = Agent(
    role="写作者",
    goal="将研究结果写成文章",
    backstory="你是一个技术写作者",
    llm=llm
)

crew = Crew(
    agents=[researcher, writer],
    tasks=[research_task, write_task]
)

result = crew.kickoff()
```

**适用场景：** 快速搭建多 Agent 协作场景

### AutoGen（微软）

多 Agent 对话框架，Agent 之间可以互相对话来解决问题。

**适用场景：** 需要 Agent 之间自由对话、协作的场景

### OpenAI Agents SDK

OpenAI 官方 Agent 框架，与 OpenAI 模型深度集成。

**适用场景：** 使用 OpenAI 模型，追求简单直接的 Agent 开发

### Claude Agent SDK

Anthropic 官方 Agent SDK，与 Claude 模型深度集成，支持 tool use、流式输出。

**适用场景：** 使用 Claude 模型，需要长上下文和强指令遵循

### 框架选型建议

| 你的需求 | 推荐框架 |
|----------|----------|
| 刚入门，想快速上手 | LangChain |
| 需要精确控制 Agent 流程 | LangGraph |
| 多 Agent 协作，低代码 | CrewAI |
| OpenAI 模型为主 | OpenAI Agents SDK |
| Claude 模型为主 | Claude Agent SDK |
| 企业级 .NET 项目 | Semantic Kernel |

## 向量数据库

### 对比

| 数据库 | 类型 | 特点 | 适用场景 |
|--------|------|------|----------|
| Chroma | 嵌入式 | 轻量，零配置 | 开发调试、原型 |
| FAISS | 库 | Meta 开源，速度极快 | 大规模相似搜索 |
| Milvus | 分布式 | 高性能，支持亿级数据 | 生产环境、大规模 |
| Pinecone | 云服务 | 全托管，免运维 | 快速上线、免运维 |
| Weaviate | 独立服务 | 支持混合搜索（向量+关键词） | 需要混合检索 |
| Qdrant | 独立服务 | Rust 实现，性能好 | 对性能有要求 |
| pgvector | PG 扩展 | 基于已有 PostgreSQL | 已有 PG 基础设施 |

### 选型建议

```
开发阶段 → Chroma（最简单）
     ↓
数据量增长 → FAISS（单机够用）
     ↓
需要持久化/分布式 → Milvus / Qdrant
     ↓
不想运维 → Pinecone（云服务）
已有 PostgreSQL → pgvector（无缝集成）
```

## Embedding 模型

将文本转化为向量表示，是 RAG 的基础。

| 模型 | 维度 | 特点 |
|------|------|------|
| text-embedding-3-small | 1536 | OpenAI，性价比高 |
| text-embedding-3-large | 3072 | OpenAI，效果最好 |
| BGE-large-zh | 1024 | 智源，中文效果好，开源 |
| BGE-M3 | 1024 | 智源，多语言，支持稠密+稀疏检索 |
| Cohere embed-v3 | 1024 | 多语言，搜索场景优化 |
| GTE-Qwen2 | 多种 | 阿里，开源，效果好 |

**建议：** 中文场景优先考虑 BGE 系列，英文场景用 OpenAI embedding。

## 开发语言与工具

### Python（推荐）

AI Agent 开发的首选语言，生态最完善。

```txt
# 核心依赖
anthropic          # Claude SDK
openai             # OpenAI SDK
langchain          # Agent 框架
langgraph          # 状态图
chromadb           # 向量数据库
sentence-transformers  # Embedding
```

### TypeScript / JavaScript

前端开发者更熟悉，适合 Web 应用。

```txt
@anthropic-ai/sdk  # Claude SDK
openai             # OpenAI SDK
langchain          # LangChain JS 版
```

### 开发工具

| 工具 | 用途 |
|------|------|
| FastAPI | 构建 Agent API 服务 |
| Streamlit | 快速搭建 Demo 界面 |
| Gradio | 快速搭建 ML Demo |
| Docker | 容器化部署 |
| LangSmith | Agent 调试和监控 |
| Weights & Biases | 实验追踪 |

### 开发环境

```bash
# 推荐 Python 3.10+
python -m venv venv
source venv/bin/activate

# 安装核心依赖
pip install langchain langgraph chromadb anthropic
```
