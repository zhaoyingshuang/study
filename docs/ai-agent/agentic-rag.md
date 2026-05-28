# Agentic RAG

传统 RAG 是「静态检索」——用户问什么就搜什么。Agentic RAG 让 Agent **自主决定如何检索、检索什么、何时需要检索**，是更智能的 RAG 模式。

## 传统 RAG vs Agentic RAG

| 维度 | 传统 RAG | Agentic RAG |
|------|----------|-------------|
| 检索方式 | 固定：用户问题 → 检索 → 生成 | 灵活：Agent 自主决定检索策略 |
| 检索次数 | 1 次 | 可多次迭代 |
| 查询改写 | 无或简单 | Agent 自主改写和优化 |
| 多源检索 | 通常单数据源 | Agent 决定查哪些数据源 |
| 结果评估 | 不评估检索质量 | Agent 评估是否需要补充检索 |
| 适应性 | 对复杂问题效果差 | 能处理复杂、多步推理问题 |

## Agentic RAG 的工作方式

```
用户提问
  ↓
Agent 思考：这个问题需要什么信息？
  ↓
Agent 决策：先搜数据源 A
  ↓
检索结果返回
  ↓
Agent 评估：信息够了吗？
  ├── 不够 → 改写查询，再搜一次
  │          ↓
  │         还是不够 → 换数据源 B 搜索
  │          ↓
  │         够了 → 生成回答
  └── 够了 → 生成回答
```

## 核心能力

### 1. 查询改写（Query Rewriting）

Agent 根据需要改写用户的原始查询。

```python
class AgenticRAG:
    async def rewrite_query(self, original_query: str, context: str = "") -> list[str]:
        """将用户问题改写为多个更好的检索查询"""
        response = await self.llm.ainvoke(f"""
        用户原始问题：{original_query}
        当前上下文：{context}

        请将这个问题改写为 3 个更适合检索的查询。
        要求：
        - 每个查询关注不同的方面
        - 使用更精确的关键词
        - 适合向量检索

        输出 JSON 数组。
        """)
        return json.loads(response)

    async def search(self, query: str, sources: list[str] = None):
        """多源检索"""
        results = []
        sources = sources or ["wiki", "docs", "api_docs"]

        for source in sources:
            docs = self.vector_stores[source].similarity_search(query, k=3)
            results.extend(docs)

        return results
```

### 2. 迭代检索（Iterative Retrieval）

检索、评估、补充检索的循环。

```python
class IterativeRetriever:
    def __init__(self, llm, vector_stores):
        self.llm = llm
        self.vector_stores = vector_stores

    async def retrieve(self, question: str, max_rounds=3):
        all_context = []
        current_query = question

        for round_num in range(max_rounds):
            # 检索
            results = await self.search_all_sources(current_query)
            all_context.extend(results)

            # 评估是否足够
            evaluation = await self.evaluate_sufficiency(question, all_context)

            if evaluation["sufficient"]:
                break

            # 根据评估生成新的查询
            current_query = evaluation["suggested_query"]

        return all_context

    async def evaluate_sufficiency(self, question, context_docs):
        """评估当前检索结果是否足够回答问题"""
        context_text = "\n".join(d.page_content for d in context_docs)

        response = await self.llm.ainvoke(f"""
        问题：{question}

        已检索到的信息：
        {context_text}

        这些信息是否足够回答问题？
        如果不够，缺少什么信息？应该用什么新的查询来检索？

        输出 JSON：
        {{
            "sufficient": true/false,
            "missing_info": "缺少什么信息",
            "suggested_query": "建议的新查询"
        }}
        """)

        return json.loads(response)
```

### 3. 路由检索（Routed Retrieval）

Agent 根据问题类型选择最合适的数据源。

```python
class RoutedRetriever:
    def __init__(self, llm):
        self.llm = llm
        self.sources = {
            "product_docs": "产品文档，包含功能说明和使用方法",
            "api_docs": "API 文档，包含接口定义和参数说明",
            "troubleshooting": "故障排除文档，包含常见问题和解决方案",
            "changelog": "更新日志，包含版本变更信息",
        }

    async def route(self, question: str) -> list[str]:
        """根据问题类型选择数据源"""
        response = await self.llm.ainvoke(f"""
        用户问题：{question}

        可用的数据源：
        {json.dumps(self.sources, ensure_ascii=False)}

        请选择最相关的 1-3 个数据源来回答这个问题。
        输出数据源名称的 JSON 数组。
        """)

        selected_sources = json.loads(response)
        return selected_sources

    async def retrieve(self, question: str):
        # 1. 路由选择数据源
        sources = await self.route(question)

        # 2. 从选定的数据源检索
        all_results = []
        for source_name in sources:
            store = self.vector_stores[source_name]
            results = store.similarity_search(question, k=3)
            all_results.extend(results)

        return all_results
```

### 4. 子查询分解（Sub-Query Decomposition）

把复杂问题拆成多个子问题分别检索。

```python
class SubQueryDecomposer:
    async def decompose(self, question: str) -> list[str]:
        """将复杂问题拆分为子问题"""
        response = await self.llm.ainvoke(f"""
        将以下问题拆分为 2-5 个独立的子问题，
        每个子问题可以从文档中独立检索到答案。

        原始问题：{question}

        输出 JSON 数组，只包含子问题文本。
        """)
        return json.loads(response)

    async def decomposed_retrieve(self, question: str):
        # 1. 拆分子问题
        sub_queries = await self.decompose(question)

        # 2. 每个子问题独立检索
        all_results = []
        for sq in sub_queries:
            results = self.vectorstore.similarity_search(sq, k=2)
            all_results.extend(results)

        # 3. 去重
        seen = set()
        unique_results = []
        for doc in all_results:
            if doc.page_content not in seen:
                seen.add(doc.page_content)
                unique_results.append(doc)

        return unique_results
```

## 完整 Agentic RAG Agent

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, List

class RAGState(TypedDict):
    question: str
    sub_queries: List[str]
    retrieved_docs: List[dict]
    evaluation: dict
    answer: str
    rounds: int

def decompose_node(state):
    """分解问题"""
    sub_queries = decomposer.decompose(state["question"])
    return {"sub_queries": sub_queries, "rounds": state.get("rounds", 0) + 1}

def retrieve_node(state):
    """多源检索"""
    all_docs = []
    for query in state["sub_queries"]:
        # 选择数据源
        sources = router.route(query)
        # 检索
        for source in sources:
            docs = vector_stores[source].similarity_search(query, k=3)
            all_docs.extend(docs)
    return {"retrieved_docs": deduplicate(all_docs)}

def evaluate_node(state):
    """评估检索质量"""
    evaluation = evaluate_sufficiency(
        state["question"],
        state["retrieved_docs"]
    )
    return {"evaluation": evaluation}

def should_continue(state):
    """决定是否需要继续检索"""
    if state["evaluation"]["sufficient"]:
        return "generate"
    if state["rounds"] >= 3:
        return "generate"
    return "refine"

def refine_node(state):
    """根据评估优化查询"""
    new_queries = [state["evaluation"]["suggested_query"]]
    return {"sub_queries": new_queries, "rounds": state["rounds"] + 1}

def generate_node(state):
    """生成最终回答"""
    context = format_docs(state["retrieved_docs"])
    answer = llm.invoke(f"""
    基于以下信息回答问题。如果信息不足，请说明。

    问题：{state["question"]}
    参考资料：{context}
    """)
    return {"answer": answer}

# 构建工作流
graph = StateGraph(RAGState)
graph.add_node("decompose", decompose_node)
graph.add_node("retrieve", retrieve_node)
graph.add_node("evaluate", evaluate_node)
graph.add_node("refine", refine_node)
graph.add_node("generate", generate_node)

graph.set_entry_point("decompose")
graph.add_edge("decompose", "retrieve")
graph.add_edge("retrieve", "evaluate")
graph.add_conditional_edges("evaluate", should_continue, {
    "refine": "refine",
    "generate": "generate"
})
graph.add_edge("refine", "retrieve")
graph.add_edge("generate", END)

agentic_rag = graph.compile()
```

## 效果对比

| 场景 | 传统 RAG | Agentic RAG |
|------|----------|-------------|
| 简单事实查询 | 好 | 好（但更贵） |
| 多步推理问题 | 差 | 好 |
| 跨文档关联 | 差 | 好 |
| 信息不全的问题 | 差 | 好（能补充检索） |
| 成本 | 低 | 较高（多次 LLM + 检索） |
| 延迟 | 低 | 较高 |

**建议：** 简单查询用传统 RAG，复杂查询用 Agentic RAG。可以通过路由层自动选择。
