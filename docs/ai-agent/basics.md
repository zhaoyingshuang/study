# 基础概念

## LLM（大语言模型）

Agent 的「大脑」，负责理解、推理和生成文本。

### 主流模型对比

| 模型 | 厂商 | 特点 | 适用场景 |
|------|------|------|----------|
| GPT-4o | OpenAI | 综合能力强，生态最完善 | 通用 Agent |
| Claude Sonnet/Opus | Anthropic | 长上下文(200K)，安全性好，指令遵循强 | 复杂任务、长文档处理 |
| GLM-4 | 智谱 | 中文能力强 | 国内场景 |
| DeepSeek-V3 | DeepSeek | 性价比高，开源 | 成本敏感场景 |
| Qwen-Max | 阿里 | 中文能力好，工具调用稳定 | 国内企业应用 |
| Llama 3 | Meta | 开源，可本地部署 | 私有化、离线场景 |

### 关键参数

- **Context Window（上下文窗口）** — 模型一次能处理的最大 token 数，从 4K 到 200K 不等
- **Temperature** — 控制输出的随机性，0=确定性输出，1=更随机。Agent 场景一般用较低值（0-0.3）
- **Max Tokens** — 单次生成的最大长度
- **Top-P** — 核采样参数，控制候选词范围

### API 调用基础

```python
import anthropic

client = anthropic.Anthropic()

response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    system="你是一个有帮助的AI助手。",
    messages=[
        {"role": "user", "content": "你好"}
    ]
)
print(response.content[0].text)
```

## Prompt Engineering

与 LLM 沟通的核心技能，也是 Agent 质量的基础。

### System Prompt

定义 Agent 的角色、行为规范和约束。好的 System Prompt 应该包含：

1. **角色定义** — 你是谁
2. **能力范围** — 你能做什么、不能做什么
3. **行为规范** — 如何回应用户
4. **输出格式** — 期望的输出结构
5. **安全约束** — 什么情况下应该拒绝

```
你是一个专业的代码审查助手。

你的职责：
- 审查用户提交的代码，发现潜在的 bug 和安全问题
- 提出改进建议，包括性能优化和代码风格
- 给出具体的修改方案

输出格式：
1. 总体评价（1-5分）
2. 发现的问题列表（按严重程度排序）
3. 改进建议
4. 修改后的代码片段

注意事项：
- 只关注代码质量，不评价开发者的能力
- 如果代码片段不完整，指出需要补充的部分
- 使用中文回复
```

### Few-shot Learning

通过提供示例来引导模型输出格式。

```
请对以下用户反馈进行情感分类。

示例：
输入：这个产品太好用了！
输出：正面

输入：质量一般，不值这个价
输出：负面

输入：物流很快，但包装有破损
输出：中性

现在请分类：
输入：功能很强大，就是学习曲线有点陡
输出：
```

### Chain of Thought (CoT)

让模型「展示思考过程」，显著提升复杂推理任务的准确率。

**方法一：直接要求**

```
请一步步思考并解决这个问题。
```

**方法二：Zero-shot CoT**

```
请先进行思考，然后给出答案。
把思考过程写在 <thinking> 标签中。
```

**方法三：Few-shot CoT（最有效）**

给出带思考过程的示例：

```
问题：一个商店有 23 个苹果，卖了 15 个，又进货了 8 个，现在有多少个？

思考过程：
1. 初始有 23 个苹果
2. 卖出 15 个：23 - 15 = 8
3. 进货 8 个：8 + 8 = 16
4. 现在有 16 个

答案：16
```

### ReAct 模式

Agent 最常用的推理模式——**推理（Reasoning）和行动（Acting）交替进行**。

```
问题：2024 年奥运会在哪里举办？

思考：我需要搜索 2024 年奥运会的信息。
行动：search("2024年奥运会举办地")
观察：2024年夏季奥运会在法国巴黎举办。

思考：我已经得到了答案。
回答：2024 年奥运会在法国巴黎举办。
```

## Function Calling / Tool Use

让 LLM 调用外部工具的能力，是 Agent 从「聊天」进化为「行动」的关键。

### 工作原理

```
用户提问 "北京今天天气怎么样？"
       ↓
LLM 判断需要调用天气 API
       ↓
输出结构化的函数调用请求：
{
  "name": "get_weather",
  "arguments": {"city": "北京"}
}
       ↓
应用层执行函数，获取结果
       ↓
将结果返回给 LLM：
{"temperature": 28, "condition": "晴"}
       ↓
LLM 生成自然语言回答：
"北京今天天气晴朗，气温28°C。"
```

### 定义工具

```python
tools = [
    {
        "name": "get_weather",
        "description": "获取指定城市的天气信息",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "城市名称，如'北京'、'上海'"
                }
            },
            "required": ["city"]
        }
    },
    {
        "name": "search_web",
        "description": "搜索互联网获取最新信息",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "搜索关键词"
                }
            },
            "required": ["query"]
        }
    }
]
```

### Agent 循环

```python
while True:
    # 1. 调用 LLM
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        system="你是一个有用的助手，可以使用工具帮助用户。",
        messages=messages,
        tools=tools,
        max_tokens=1024
    )

    # 2. 检查是否需要调用工具
    if response.stop_reason == "tool_use":
        for block in response.content:
            if block.type == "tool_use":
                # 3. 执行工具
                result = execute_tool(block.name, block.input)
                # 4. 将结果加入消息历史
                messages.append({"role": "assistant", "content": response.content})
                messages.append({
                    "role": "user",
                    "content": [{
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": str(result)
                    }]
                })
    else:
        # 5. LLM 给出最终回答
        print(response.content[0].text)
        break
```

## RAG（检索增强生成）

让 Agent 能访问私有知识库的技术。解决 LLM 两个核心问题：**知识过时** 和 **缺乏私有数据**。

### 基本流程

```
知识库文档 → 分块 → Embedding 向量化 → 存入向量数据库
                                              ↓
用户提问 → Embedding 向量化 → 相似度检索 → 取出相关文档片段
                                              ↓
                              相关文档 + 用户问题 → LLM → 回答
```

### 关键环节

**1. 文档加载与分块**

```python
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 加载文档
loader = PyPDFLoader("knowledge.pdf")
docs = loader.load()

# 分块
splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,      # 每块最大 500 字符
    chunk_overlap=50,     # 块之间重叠 50 字符
)
chunks = splitter.split_documents(docs)
```

**2. 向量化与存储**

```python
from langchain_community.embeddings import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma_db"
)
```

**3. 检索与生成**

```python
from langchain.chains import RetrievalQA
from langchain_community.chat_models import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=vectorstore.as_retriever(search_kwargs={"k": 3})
)

answer = qa_chain.run("什么是 RAG？")
```

## Memory（记忆系统）

Agent 维持上下文和记住历史交互的能力。

### 记忆类型

| 类型 | 说明 | 实现方式 |
|------|------|----------|
| 短期记忆 | 当前对话的上下文 | 消息历史列表 |
| 长期记忆 | 跨对话的持久知识 | 向量数据库存储 |
| 工作记忆 | 当前任务的中间状态 | Scratchpad / 变量 |

### 短期记忆管理

对话变长后，token 数会超限，需要截断或摘要：

```python
# 方法1：滑动窗口，保留最近 N 轮对话
messages = messages[-10:]

# 方法2：摘要压缩，用 LLM 总结历史对话
summary = llm.run("请总结以下对话的关键信息：" + str(old_messages))
messages = [{"role": "system", "content": f"之前对话的摘要：{summary}"}] + recent_messages
```

### 长期记忆

```python
# 存储记忆
memory_db.add_texts(
    texts=["用户喜欢Python，偏好简洁的代码风格"],
    metadatas=[{"type": "user_preference", "user_id": "u1"}]
)

# 检索相关记忆
relevant_memories = memory_db.similarity_search("用户偏好的编程语言", k=3)
```
