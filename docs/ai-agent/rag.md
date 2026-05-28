# RAG（检索增强生成）

RAG（Retrieval-Augmented Generation）让 Agent 能够访问**私有知识库**或**最新信息**，解决 LLM 知识过时和缺乏私有数据的问题。

## 为什么需要 RAG？

| 问题 | LLM 的局限 | RAG 的解决方式 |
|------|------------|----------------|
| 知识过时 | 训练数据有截止日期 | 检索最新文档 |
| 缺少私有数据 | 不知道你的企业内部知识 | 从你的知识库检索 |
| 幻觉 | 可能编造不存在的信息 | 基于检索到的事实回答 |
| 成本高 | 把所有知识塞进 Prompt 很贵 | 只检索相关的片段 |

## RAG 完整流程

```
┌─────────────────── 离线阶段（索引） ───────────────────┐
│                                                        │
│  原始文档 → 加载 → 分块 → Embedding → 存入向量数据库    │
│  PDF/Word/HTML/TXT                                      │
└────────────────────────────────────────────────────────┘

┌─────────────────── 在线阶段（查询） ───────────────────┐
│                                                        │
│  用户提问                                              │
│     ↓                                                  │
│  问题 Embedding                                        │
│     ↓                                                  │
│  向量相似度检索 → 取出 Top-K 相关文档片段                │
│     ↓                                                  │
│  构建 Prompt：问题 + 检索到的文档片段                    │
│     ↓                                                  │
│  LLM 生成回答                                          │
└────────────────────────────────────────────────────────┘
```

## 第一步：文档加载

### 支持的文档格式

| 格式 | 加载器 | 说明 |
|------|--------|------|
| PDF | PyPDFLoader | 最常见，注意扫描版 PDF 需要 OCR |
| Word | Docx2txtLoader | .docx 格式 |
| Markdown | UnstructuredMarkdownLoader | 保持格式 |
| HTML | UnstructuredHTMLLoader | 网页内容 |
| CSV | CSVLoader | 表格数据，每行一个文档 |
| 代码 | 路径遍历 | 按文件加载 |
| Notion | NotionDBLoader | Notion 数据库 |

```python
from langchain_community.document_loaders import (
    PyPDFLoader,
    Docx2txtLoader,
    DirectoryLoader,
    TextLoader
)

# 加载单个 PDF
loader = PyPDFLoader("knowledge.pdf")
docs = loader.load()

# 加载整个目录
loader = DirectoryLoader(
    "./documents",
    glob="**/*.{pdf,txt,md}",
    loader_cls=TextLoader
)
docs = loader.load()

# 每个 doc 包含：
# doc.page_content  → 文本内容
# doc.metadata      → 元数据（文件名、页码等）
```

## 第二步：文本分块（Chunking）

分块是 RAG 效果的关键环节。块太大→检索不精确；块太小→缺少上下文。

### 分块策略

**1. 固定大小分块**

最简单，按字符数切分，块之间有重叠。

```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,       # 每块最大 500 字符
    chunk_overlap=50,      # 相邻块重叠 50 字符
    separators=["\n\n", "\n", "。", "！", "？", " ", ""]  # 优先在段落/句子边界切分
)
chunks = splitter.split_documents(docs)
```

**2. 按语义分块**

按文档的自然结构切分，效果更好。

```python
# Markdown 按标题切分
from langchain.text_splitter import MarkdownHeaderTextSplitter

splitter = MarkdownHeaderTextSplitter(
    headers_to_split_on=[
        ("#", "chapter"),
        ("##", "section"),
        ("###", "subsection"),
    ]
)
chunks = splitter.split_text(markdown_text)
```

**3. 代码按语法切分**

```python
from langchain.text_splitter import Language, RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter.from_language(
    language=Language.PYTHON,
    chunk_size=1000,
    chunk_overlap=100
)
```

### 分块参数调优

| 参数 | 建议 | 说明 |
|------|------|------|
| chunk_size | 300-1000 | 中文建议 300-500，英文 500-1000 |
| chunk_overlap | chunk_size 的 10-20% | 保证上下文连贯 |
| 分块方式 | 优先语义分块 | 保留文档结构比固定切分效果好 |

## 第三步：Embedding（向量化）

将文本转换为固定维度的向量，用于相似度计算。

```python
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings

# 方式1：OpenAI API
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# 方式2：本地模型（免费，中文推荐）
embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-large-zh-v1.5"
)

# 生成向量
vector = embeddings.embed_query("什么是人工智能？")
# 返回一个浮点数列表，如 [0.012, -0.034, 0.056, ...]
```

### Embedding 模型选择

| 场景 | 推荐模型 | 原因 |
|------|----------|------|
| 中文为主 | BGE-large-zh | 中文效果最好 |
| 英文为主 | text-embedding-3-small | 性价比高 |
| 多语言 | BGE-M3 | 支持混合检索 |
| 离线/私有化 | BGE / GTE | 开源，可本地部署 |
| 追求效果 | text-embedding-3-large | 维度高，效果最好 |

## 第四步：向量存储与检索

```python
from langchain_community.vectorstores import Chroma

# 创建向量库并存入
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db"  # 持久化存储
)

# 检索
results = vectorstore.similarity_search(
    query="什么是 RAG？",
    k=3  # 返回最相关的 3 个文档片段
)

for doc in results:
    print(f"内容: {doc.page_content}")
    print(f"来源: {doc.metadata}")
    print("---")
```

### 检索策略

**基础相似度检索**

```python
# 最简单，用余弦相似度
results = vectorstore.similarity_search("查询内容", k=3)
```

**MMR（最大边际相关性）检索**

兼顾相关性和多样性，减少重复结果。

```python
results = vectorstore.max_marginal_relevance_search(
    query="查询内容",
    k=3,
    fetch_k=10  # 先取10个候选，再从中选3个最多样化的
)
```

**混合检索（Hybrid Search）**

结合向量检索和关键词检索，效果最好。

```python
# Weaviate 支持混合检索
results = weaviate_client.query
    .hybrid(query="查询内容", alpha=0.5)  # alpha 控制向量/关键词的权重
    .get()
```

### 检索参数调优

| 参数 | 建议值 | 说明 |
|------|--------|------|
| k（返回数量） | 3-5 | 太多会引入噪声，太少可能遗漏 |
| score_threshold | 0.7-0.8 | 过滤低相关度结果 |
| 检索方式 | 优先 MMR | 兼顾相关性和多样性 |

## 第五步：生成回答

```python
from langchain.chains import RetrievalQA
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o", temperature=0)

# 基础 RAG Chain
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",  # 将所有检索结果放入一个 Prompt
    retriever=vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 3}
    ),
    return_source_documents=True  # 返回来源文档
)

result = qa_chain({"query": "什么是 RAG？"})
print(result["result"])
print("来源：", result["source_documents"])
```

### Chain Type 选择

| 类型 | 说明 | 适用场景 |
|------|------|----------|
| stuff | 所有文档塞入一个 Prompt | 文档少且短 |
| map_reduce | 每个文档单独处理，再合并 | 文档多，需要并行 |
| refine | 逐个文档迭代优化答案 | 需要综合多文档信息 |
| map_rerank | 每个文档生成答案并打分 | 需要选择最佳答案 |

## 高级 RAG 技术

### Query Transformation（查询改写）

用户的原始查询可能不够好，先改写再检索。

```python
# 方法1：让 LLM 重写查询
rewrite_prompt = """
请将以下用户问题改写为更适合搜索的查询。
原始问题：{question}
改写后的查询：
"""

# 方法2：HyDE（假设性文档嵌入）
# 先让 LLM 生成一个假设性的答案
# 用这个答案的 Embedding 去检索（比用问题检索效果好）
hyde_answer = llm.predict(f"请简要回答：{question}")
results = vectorstore.similarity_search(hyde_answer, k=3)
```

### Reranking（重排序）

先多检索一些结果，再用 Cross-Encoder 精排。

```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain_cohere import CohereRerank

# 先检索 20 个候选
base_retriever = vectorstore.as_retriever(search_kwargs={"k": 20})

# 用 Reranker 精排到 3 个
compressor = CohereRerank(top_n=3)
compression_retriever = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=base_retriever
)

results = compression_retriever.get_relevant_documents("查询内容")
```

### Parent-Child 检索

小块检索，返回大块上下文。

```
文档 → 大块（parent）→ 小块（child）

检索时：用小块做 Embedding 匹配（精度高）
返回时：返回小块对应的大块（上下文完整）
```

## RAG 效果评估

### 评估指标

| 指标 | 说明 |
|------|------|
| 上下文精确率 | 检索到的文档中有多少是相关的 |
| 上下文召回率 | 所有相关文档中有多少被检索到了 |
| 答案相关性 | 生成的答案是否真正回答了问题 |
| 忠实度 | 答案是否基于检索到的文档（不是编造的） |

### 评估工具

- **Ragas** — RAG 评估框架，自动计算上述指标
- **LangSmith** — LangChain 的监控和评估平台
- **TruLens** — LLM 应用评估工具

```python
from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_precision,
    context_recall
)

results = evaluate(
    dataset=eval_dataset,
    metrics=[faithfulness, answer_relevancy, context_precision, context_recall]
)
```

## RAG 最佳实践总结

1. **分块大小**：中文 300-500 字符，英文 500-1000 字符
2. **Embedding 模型**：中文用 BGE，英文用 OpenAI
3. **检索方式**：优先 MMR 或混合检索
4. **检索数量**：k=3-5，配合 score_threshold 过滤
5. **Reranking**：有条件就加，效果提升明显
6. **评估**：用 Ragas 自动评估，迭代优化
7. **元数据**：保存好文档来源、页码，方便溯源
