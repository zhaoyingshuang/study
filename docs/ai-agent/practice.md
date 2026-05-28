# 实战项目

从零开始的动手项目，按难度递进排列。每个项目都可以作为独立的学习练手。

## 项目一：命令行 AI 助手

**难度：** ★☆☆☆☆
**目标：** 用最少的代码实现一个能调用工具的 Agent
**学习点：** Function Calling 基本流程

### 功能

- 多轮对话
- 调用天气 API
- 调用计算器
- 网络搜索

### 技术栈

- Python 3.10+
- Anthropic SDK / OpenAI SDK
- 无需框架

### 核心代码

```python
import anthropic
import json

client = anthropic.Anthropic()

tools = [
    {
        "name": "calculator",
        "description": "执行数学计算",
        "input_schema": {
            "type": "object",
            "properties": {
                "expression": {"type": "string", "description": "数学表达式，如'2+3*4'"}
            },
            "required": ["expression"]
        }
    }
]

def calculator(expression: str) -> str:
    try:
        result = eval(expression)  # 注意：生产环境不要用 eval
        return str(result)
    except Exception as e:
        return f"计算错误: {e}"

def agent_chat():
    messages = []
    print("AI 助手（输入 quit 退出）")

    while True:
        user_input = input("\n你: ")
        if user_input.lower() == "quit":
            break

        messages.append({"role": "user", "content": user_input})

        while True:
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                system="你是一个有用的助手。可以用中文回答。",
                messages=messages,
                tools=tools,
                max_tokens=1024
            )

            messages.append({"role": "assistant", "content": response.content})

            if response.stop_reason == "tool_use":
                for block in response.content:
                    if block.type == "tool_use":
                        result = calculator(**block.input)
                        messages.append({
                            "role": "user",
                            "content": [{
                                "type": "tool_result",
                                "tool_use_id": block.id,
                                "content": result
                            }]
                        })
            else:
                for block in response.content:
                    if block.type == "text":
                        print(f"\nAI: {block.text}")
                break

agent_chat()
```

### 扩展方向

- 添加更多工具（天气、搜索、文件读写）
- 支持流式输出
- 添加对话历史持久化

---

## 项目二：文档问答系统

**难度：** ★★☆☆☆
**目标：** 实现一个基础的 RAG 问答系统
**学习点：** 文档加载、分块、Embedding、向量检索

### 功能

- 上传 PDF/Markdown 文档
- 基于文档内容回答问题
- 显示答案来源

### 技术栈

- Python + LangChain
- Chroma 向量数据库
- Streamlit 界面

### 项目结构

```
doc-qa/
├── app.py              # Streamlit 主程序
├── ingest.py           # 文档处理和向量化
├── requirements.txt
└── data/               # 存放文档
    └── knowledge.pdf
```

### 文档处理

```python
# ingest.py
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

# 加载文档
loader = DirectoryLoader("./data", glob="**/*.pdf", loader_cls=PyPDFLoader)
docs = loader.load()

# 分块
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50
)
chunks = splitter.split_documents(docs)

# 向量化存储
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db"
)
```

### Web 界面

```python
# app.py
import streamlit as st
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import OpenAIEmbeddings

st.title("📄 文档问答系统")

# 加载向量库
embeddings = OpenAIEmbeddings()
vectorstore = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)

# 创建问答链
llm = ChatOpenAI(model="gpt-4o", temperature=0)
qa = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=vectorstore.as_retriever(search_kwargs={"k": 3}),
    return_source_documents=True
)

# 用户输入
question = st.text_input("请输入你的问题：")

if question:
    with st.spinner("思考中..."):
        result = qa({"query": question})

    st.markdown("### 回答")
    st.write(result["result"])

    st.markdown("### 来源")
    for i, doc in enumerate(result["source_documents"]):
        st.expander(f"来源 {i+1}").write(doc.page_content)
```

### 运行

```bash
# 安装依赖
pip install streamlit langchain chromadb openai pypdf

# 处理文档
python ingest.py

# 启动应用
streamlit run app.py
```

### 扩展方向

- 支持多种文档格式
- 添加对话历史
- 使用更好的 Embedding 模型
- 添加 Reranking

---

## 项目三：智能研究助手

**难度：** ★★★☆☆
**目标：** 实现一个能自动搜索、分析、总结的研究 Agent
**学习点：** Agent 循环、工具调用、LangGraph

### 功能

- 输入研究主题
- 自动搜索相关信息
- 分析和整理
- 生成研究报告

### 技术栈

- Python + LangGraph
- Tavily 搜索 API
- Markdown 输出

### 核心流程

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, List

class ResearchState(TypedDict):
    topic: str
    search_results: List[str]
    analysis: str
    report: str

def search_node(state):
    """搜索相关信息"""
    results = tavily_search(state["topic"], max_results=5)
    return {"search_results": results}

def analyze_node(state):
    """分析搜索结果"""
    prompt = f"分析以下关于'{state['topic']}'的信息，提取关键要点：\n\n"
    for r in state["search_results"]:
        prompt += r + "\n\n"
    analysis = llm.invoke(prompt)
    return {"analysis": analysis}

def report_node(state):
    """生成研究报告"""
    prompt = f"""基于以下分析，生成一份关于 '{state["topic"]}' 的研究报告。
    格式要求：
    1. 概述
    2. 核心要点
    3. 详细分析
    4. 总结

    分析内容：
    {state["analysis"]}
    """
    report = llm.invoke(prompt)
    return {"report": report}

# 构建工作流
graph = StateGraph(ResearchState)
graph.add_node("search", search_node)
graph.add_node("analyze", analyze_node)
graph.add_node("report", report_node)

graph.set_entry_point("search")
graph.add_edge("search", "analyze")
graph.add_edge("analyze", "report")
graph.add_edge("report", END)

app = graph.compile()
result = app.invoke({"topic": "RAG 技术最新进展"})
```

---

## 项目四：Multi-Agent 编程团队

**难度：** ★★★★☆
**目标：** 实现一个多 Agent 协作的软件开发团队
**学习点：** Multi-Agent 协作、任务分配、质量保证

### 功能

- 产品经理 Agent 分析需求
- 架构师 Agent 设计方案
- 开发者 Agent 编写代码
- 审查员 Agent 检查代码

### 技术栈

- Python + CrewAI
- 文件系统操作

### Agent 设计

```python
from crewai import Agent, Task, Crew

# 产品经理
pm = Agent(
    role="产品经理",
    goal="分析用户需求，输出详细的功能说明",
    backstory="你有10年产品经理经验，擅长需求分析",
    llm=llm
)

# 架构师
architect = Agent(
    role="架构师",
    goal="根据需求设计技术方案",
    backstory="你是资深架构师，精通 Python 和 Web 开发",
    llm=llm
)

# 开发者
developer = Agent(
    role="开发者",
    goal="根据技术方案编写高质量代码",
    backstory="你是高级 Python 开发者，注重代码质量",
    llm=llm,
    allow_code_execution=True
)

# 审查员
reviewer = Agent(
    role="代码审查员",
    goal="审查代码质量，确保符合最佳实践",
    backstory="你是严格的代码审查员",
    llm=llm
)
```

---

## 项目五：智能客服 Agent

**难度：** ★★★★★
**目标：** 构建一个生产级的智能客服系统
**学习点：** RAG + Agent + 多轮对话 + 意图识别

### 功能

- 意图识别（售前咨询 / 售后问题 / 技术支持）
- 基于知识库的 RAG 问答
- 多轮对话上下文管理
- 无缝转人工
- 对话质量监控

### 系统架构

```
用户消息
   ↓
┌──────────┐
│ 意图识别  │ → 售前 / 售后 / 技术支持 / 闲聊
└────┬─────┘
     ↓
┌──────────┐
│ 路由分发  │ → 不同场景走不同 Agent
└────┬─────┘
     ↓
┌──────────┐     ┌──────────┐     ┌──────────┐
│ 售前Agent │     │ 售后Agent │     │ 技术Agent │
│ + 产品知识 │     │ + 工单系统 │     │ + RAG知识库│
└────┬─────┘     └────┬─────┘     └────┬─────┘
     ↓                ↓                ↓
┌──────────┐
│ 质量检查  │ → 检查回答是否合适
└────┬─────┘
     ↓
  回复用户 / 转人工
```

---

## 项目难度与建议

| 项目 | 难度 | 建议用时 | 核心收获 |
|------|------|----------|----------|
| 命令行助手 | ★☆☆☆☆ | 1-2 天 | 理解 Agent 循环和工具调用 |
| 文档问答 | ★★☆☆☆ | 3-5 天 | 掌握 RAG 完整流程 |
| 研究助手 | ★★★☆☆ | 5-7 天 | 学会 LangGraph 工作流 |
| 编程团队 | ★★★★☆ | 7-10 天 | 掌握 Multi-Agent 协作 |
| 智能客服 | ★★★★★ | 2-3 周 | 生产级 Agent 系统设计 |

## 通用建议

1. **从简单开始** — 先跑通最小可用版本，再逐步加功能
2. **多打印日志** — Agent 的中间过程对调试很重要
3. **用 LangSmith** — 追踪 Agent 的每一步执行
4. **先手动测试** — 每个工具和 Prompt 单独测通，再组装
5. **写好测试用例** — 准备 10-20 个测试问题，评估效果
