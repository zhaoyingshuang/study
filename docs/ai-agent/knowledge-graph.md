# 知识图谱 + Agent

知识图谱（Knowledge Graph）提供结构化的知识表示，与 LLM 结合可以提升 Agent 的准确性和推理能力。

## 为什么需要知识图谱？

| 问题 | 纯 LLM / RAG | 知识图谱 + LLM |
|------|-------------|----------------|
| 事实准确性 | 可能编造 | 从图谱获取确定的事实 |
| 关系推理 | 弱 | 强（图谱天然表示关系） |
| 多跳推理 | 困难 | 图遍历即可 |
| 一致性 | 可能前后矛盾 | 图谱保证一致性 |
| 可解释性 | 黑盒 | 推理路径可追踪 |

## 核心概念

### 知识图谱 = 三元组

```
(主体, 关系, 客体)

示例：
(Python, 是, 编程语言)
(Python, 创始人, Guido van Rossum)
(Python, 用于, Web开发)
(Django, 是, Python框架)
(Django, 用于, Web开发)
```

### 图示例

```
  Python ──是──→ 编程语言
    │
  创始人──→ Guido van Rossum
    │
  用于──→ Web开发
    │
  框架──→ Django ──特点──→ 全功能
    │                    │
    └──ORM──→ Django ORM ←┘
```

## 构建知识图谱

### 从非结构化文本提取

```python
async def extract_triples(text: str) -> list[dict]:
    """用 LLM 从文本中提取三元组"""
    response = await llm.ainvoke(f"""
    从以下文本中提取知识三元组（主体、关系、客体）。

    文本：{text}

    输出 JSON 数组，每个元素格式：
    {{"subject": "主体", "relation": "关系", "object": "客体"}}

    要求：
    - 关系要简洁明确（如"是"、"位于"、"属于"）
    - 实体要具体（不用代词）
    - 只提取明确表述的关系，不要推理
    """)

    return json.loads(response)

# 示例
text = "Python是由Guido van Rossum在1991年创建的编程语言。它广泛用于Web开发、数据分析和AI领域。"
triples = await extract_triples(text)
# [
#   {"subject": "Python", "relation": "创建者", "object": "Guido van Rossum"},
#   {"subject": "Python", "relation": "创建时间", "object": "1991年"},
#   {"subject": "Python", "relation": "是", "object": "编程语言"},
#   {"subject": "Python", "relation": "用于", "object": "Web开发"},
#   {"subject": "Python", "relation": "用于", "object": "数据分析"},
#   {"subject": "Python", "relation": "用于", "object": "AI领域"},
# ]
```

### 存储到图数据库

```python
from neo4j import GraphDatabase

class KnowledgeGraphStore:
    def __init__(self, uri="bolt://localhost:7687", user="neo4j", password="password"):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def add_triple(self, subject: str, relation: str, obj: str):
        """添加三元组"""
        with self.driver.session() as session:
            session.run(
                """
                MERGE (s:Entity {name: $subject})
                MERGE (o:Entity {name: $object})
                MERGE (s)-[r:RELATION {type: $relation}]->(o)
                """,
                subject=subject, object=obj, relation=relation
            )

    def add_triples_batch(self, triples: list[dict]):
        """批量添加"""
        with self.driver.session() as session:
            for t in triples:
                self.add_triple(t["subject"], t["relation"], t["object"])

    def query_entity(self, entity_name: str, depth=2) -> dict:
        """查询实体的关联信息"""
        with self.driver.session() as session:
            result = session.run(
                """
                MATCH (e:Entity {name: $name})-[r*1..2]-(related)
                RETURN e, r, related
                """,
                name=entity_name
            )
            return [record.data() for record in result]

    def find_path(self, entity_a: str, entity_b: str) -> list:
        """找到两个实体之间的关系路径"""
        with self.driver.session() as session:
            result = session.run(
                """
                MATCH path = shortestPath(
                    (a:Entity {name: $name_a})-[*..5]-(b:Entity {name: $name_b})
                )
                RETURN path
                """,
                name_a=entity_a, name_b=entity_b
            )
            return [record.data() for record in result]
```

## Agent 集成

### GraphRAG

将知识图谱作为 RAG 的补充数据源。

```python
class GraphRAGAgent:
    def __init__(self, llm, vector_store, graph_store):
        self.llm = llm
        self.vector_store = vector_store
        self.graph = graph_store

    async def answer(self, question: str) -> str:
        # 1. 提取问题中的实体
        entities = await self.extract_entities(question)

        # 2. 从知识图谱获取结构化信息
        graph_context = self.get_graph_context(entities)

        # 3. 从向量库获取文档信息
        doc_context = self.vector_store.similarity_search(question, k=3)

        # 4. 合并上下文，生成回答
        response = await self.llm.ainvoke(f"""
        问题：{question}

        结构化知识（来自知识图谱）：
        {graph_context}

        参考资料（来自文档）：
        {format_docs(doc_context)}

        请综合以上信息回答问题。
        """)

        return response

    async def extract_entities(self, text: str) -> list[str]:
        response = await self.llm.ainvoke(f"""
        提取以下文本中的关键实体（人名、地名、组织、技术、概念等）。
        文本：{text}
        输出 JSON 数组。
        """)
        return json.loads(response)

    def get_graph_context(self, entities: list[str]) -> str:
        context_parts = []
        for entity in entities:
            related = self.graph.query_entity(entity)
            if related:
                context_parts.append(f"关于 {entity}：")
                for r in related:
                    context_parts.append(f"  - {r}")
        return "\n".join(context_parts)
```

### Graph Agent 工具

将知识图谱操作封装为 Agent 工具。

```python
tools = [
    {
        "name": "query_entity",
        "description": "查询知识图谱中某个实体的关联信息",
        "input_schema": {
            "type": "object",
            "properties": {
                "entity": {"type": "string", "description": "实体名称"}
            },
            "required": ["entity"]
        }
    },
    {
        "name": "find_relation_path",
        "description": "查找两个实体之间的关系路径",
        "input_schema": {
            "type": "object",
            "properties": {
                "entity_a": {"type": "string"},
                "entity_b": {"type": "string"}
            },
            "required": ["entity_a", "entity_b"]
        }
    },
    {
        "name": "search_documents",
        "description": "从文档库中搜索相关信息",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"}
            },
            "required": ["query"]
        }
    }
]
```

### 多跳推理

```python
async def multi_hop_reasoning(self, question: str):
    """利用知识图谱做多跳推理"""

    # 问题：Django 用的编程语言的创始人是谁？
    # 第1跳：Django → 使用的编程语言 → Python
    # 第2跳：Python → 创始人 → Guido van Rossum

    entities = await self.extract_entities(question)

    # 在图谱中遍历
    hops = []
    current_entities = entities

    for hop in range(3):  # 最多 3 跳
        next_entities = []
        for entity in current_entities:
            related = self.graph.query_entity(entity, depth=1)
            for r in related:
                hops.append(r)
                next_entities.append(r["related"])

        # 检查是否找到答案
        answer = await self.llm.ainvoke(f"""
        基于以下图谱信息，能否回答问题？
        问题：{question}
        图谱信息：{hops}
        如果能回答，请给出答案。如果不能，输出"NEED_MORE"。
        """)

        if "NEED_MORE" not in answer:
            return answer

        current_entities = next_entities

    return "无法通过知识图谱回答此问题"
```

## 自动构建知识图谱

### 从文档批量构建

```python
async def build_knowledge_graph_from_docs(doc_directory: str):
    """从文档目录自动构建知识图谱"""

    # 1. 加载文档
    loader = DirectoryLoader(doc_directory, glob="**/*.md")
    docs = loader.load()

    # 2. 分块
    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = splitter.split_documents(docs)

    # 3. 提取三元组
    graph_store = KnowledgeGraphStore()

    for chunk in chunks:
        triples = await extract_triples(chunk.page_content)
        graph_store.add_triples_batch(triples)

    # 4. 实体消歧（合并同一实体的不同表述）
    await entity_disambiguation(graph_store)

    return graph_store
```

### 实体消歧

```python
async def entity_disambiguation(graph_store):
    """合并同一实体的不同名称"""
    all_entities = graph_store.get_all_entities()

    # 用 LLM 判断哪些是同一实体
    for i, entity_a in enumerate(all_entities):
        for entity_b in all_entities[i+1:]:
            is_same = await llm.ainvoke(f"""
            以下两个实体是否指同一个事物？
            A: {entity_a}
            B: {entity_b}
            只回答 true 或 false。
            """)

            if is_same.strip().lower() == "true":
                graph_store.merge_entities(entity_a, entity_b)
```

## 适用场景

| 场景 | 说明 |
|------|------|
| 企业知识管理 | 组织架构、业务流程、产品关系的结构化管理 |
| 智能问答 | 需要多跳推理的复杂问题 |
| 推荐系统 | 基于实体关系的个性化推荐 |
| 风控分析 | 实体关联分析，发现隐藏关系 |
| 研究助手 | 学术领域的知识网络构建 |

## 技术选型

| 工具 | 说明 |
|------|------|
| Neo4j | 最流行的图数据库，Cypher 查询语言 |
| ArangoDB | 多模型数据库（文档+图+KV） |
| NetworkX | Python 图计算库，适合小规模分析 |
| LlamaIndex KnowledgeGraphIndex | LlamaIndex 内置的知识图谱索引 |
| LightRAG | 轻量级 GraphRAG 框架 |
| Microsoft GraphRAG | 微软的 GraphRAG 开源实现 |

## 最佳实践

1. **图谱 + 向量互补** — 结构化事实用图谱，非结构化知识用向量
2. **自动构建** — 用 LLM 从文档自动提取三元组，减少人工维护
3. **定期更新** — 知识图谱需要持续更新，保持与最新信息同步
4. **质量控制** — 自动提取的三元组可能有错误，需要校验
5. **可视化** — 图谱可视化有助于理解和调试
