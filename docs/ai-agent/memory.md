# 记忆系统详解

记忆是 Agent 维持上下文、积累经验的核心能力。没有记忆的 Agent 每次交互都从零开始，能力非常有限。

## 为什么记忆很重要？

```
没有记忆的 Agent：
  用户：我叫张三
  Agent：好的，张三。
  用户：我叫什么名字？
  Agent：抱歉，我不知道你的名字。（对话丢失）

有记忆的 Agent：
  用户：我叫张三
  Agent：好的，张三。
  （1小时后）
  用户：我叫什么名字？
  Agent：你叫张三。（从长期记忆中回忆）
```

## 记忆类型

### 类型总览

| 类型 | 持续时间 | 存储位置 | 容量 | 示例 |
|------|----------|----------|------|------|
| 工作记忆 | 当前任务 | Prompt 中 | 小 | 当前对话上下文 |
| 短期记忆 | 当前会话 | 内存 | 中 | 本次对话历史 |
| 长期记忆 | 永久 | 向量数据库 | 大 | 用户偏好、历史对话 |
| 情景记忆 | 永久 | 向量数据库 | 中 | 具体的事件和经历 |
| 语义记忆 | 永久 | 知识库/图谱 | 大 | 事实知识和概念 |

### 它们如何协作

```
用户提问
  ↓
1. 查工作记忆 — 当前任务进行到哪了？
  ↓
2. 查短期记忆 — 这次对话聊了什么？
  ↓
3. 查长期记忆 — 这个用户有什么偏好？之前聊过相关话题吗？
  ↓
4. 查语义记忆 — 关于这个话题，我知道什么事实？
  ↓
综合所有记忆 → 生成回答
```

## 工作记忆（Working Memory）

当前任务的中间状态，类似人类的「草稿纸」。

```python
class WorkingMemory:
    """任务执行过程中的临时状态"""

    def __init__(self):
        self.state = {}
        self.scratchpad = []

    def set(self, key, value):
        self.state[key] = value

    def get(self, key, default=None):
        return self.state.get(key, default)

    def add_note(self, note: str):
        self.scratchpad.append(note)

    def get_context(self) -> str:
        context = "当前任务状态：\n"
        for k, v in self.state.items():
            context += f"- {k}: {v}\n"
        if self.scratchpad:
            context += "\n任务笔记：\n"
            for note in self.scratchpad:
                context += f"- {note}\n"
        return context

# 使用
memory = WorkingMemory()
memory.set("current_task", "分析销售数据")
memory.set("step", 2)
memory.add_note("发现 Q3 销售额下降了 15%")
```

**适用场景：** 多步骤任务执行过程中保持状态。

## 短期记忆（Short-term Memory）

当前对话的消息历史。

### 基本实现

```python
class ShortTermMemory:
    def __init__(self, max_messages=50):
        self.messages = []
        self.max_messages = max_messages

    def add(self, role: str, content: str):
        self.messages.append({"role": role, "content": content})
        if len(self.messages) > self.max_messages:
            self.messages = self.messages[-self.max_messages:]

    def get_messages(self):
        return self.messages

    def clear(self):
        self.messages = []
```

### 管理策略

对话越来越长会超出 token 限制，需要管理。

**策略一：滑动窗口**

保留最近 N 轮对话，丢弃更早的。

```python
def sliding_window(messages, max_rounds=10):
    """保留最近 10 轮对话"""
    return messages[-(max_rounds * 2):]  # 每轮包含 user + assistant
```

优点：简单。缺点：丢失早期重要信息。

**策略二：摘要压缩**

用 LLM 把早期对话压缩成摘要。

```python
async def summarize_old_messages(messages, keep_recent=6):
    """保留最近几轮，对更早的做摘要"""
    if len(messages) <= keep_recent:
        return messages

    old = messages[:-keep_recent]
    recent = messages[-keep_recent:]

    summary = await llm.ainvoke(f"""
    请用 2-3 句话总结以下对话的关键信息：
    {format_messages(old)}

    只输出摘要内容，不要其他内容。
    """)

    return [
        {"role": "system", "content": f"[之前对话的摘要] {summary}"},
        *recent
    ]
```

**策略三：Token 计数截断**

按 token 数精确控制。

```python
def truncate_by_tokens(messages, max_tokens=4000, tokenizer=None):
    """按 token 数截断，保留 System Prompt 和最近的消息"""
    system = [m for m in messages if m["role"] == "system"]
    non_system = [m for m in messages if m["role"] != "system"]

    total = count_tokens(system)
    kept = []

    for msg in reversed(non_system):
        msg_tokens = count_tokens([msg])
        if total + msg_tokens > max_tokens:
            break
        kept.insert(0, msg)
        total += msg_tokens

    return system + kept
```

**策略四：重要性评分**

LLM 判断每条消息的重要性，保留重要的。

```python
async def importance_based_selection(messages, max_tokens=4000):
    """让 LLM 评估每条消息的重要性"""
    scored = []
    for i, msg in enumerate(messages):
        score = await llm.ainvoke(f"""
        请为以下对话消息的重要性打分（1-10）：
        {msg['content']}

        考虑：是否包含关键信息、决策、用户偏好等。
        只输出分数。
        """)
        scored.append((int(score.strip()), i, msg))

    # 按重要性排序，取最重要的
    scored.sort(key=lambda x: -x[0])
    selected = []
    total = 0
    for score, idx, msg in scored:
        msg_tokens = count_tokens([msg])
        if total + msg_tokens > max_tokens:
            continue
        selected.append((idx, msg))
        total += msg_tokens

    # 恢复原始顺序
    selected.sort(key=lambda x: x[0])
    return [msg for _, msg in selected]
```

## 长期记忆（Long-term Memory）

跨会话的持久化记忆。

### 基于向量数据库

```python
from datetime import datetime
import chromadb

class LongTermMemory:
    def __init__(self, collection_name="agent_memory"):
        self.client = chromadb.PersistentClient(path="./memory_db")
        self.collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}
        )

    def store(self, content: str, metadata: dict = None):
        """存储一条记忆"""
        meta = metadata or {}
        meta["timestamp"] = datetime.now().isoformat()

        self.collection.add(
            documents=[content],
            metadatas=[meta],
            ids=[f"mem_{datetime.now().timestamp()}"]
        )

    def recall(self, query: str, n_results=5) -> list[str]:
        """回忆相关记忆"""
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results
        )
        return results["documents"][0]

    def forget(self, content_substring: str):
        """遗忘包含特定内容的记忆"""
        results = self.collection.get(
            where_document={"$contains": content_substring}
        )
        if results["ids"]:
            self.collection.delete(ids=results["ids"])
```

### 自动提取和存储

不是所有对话都值得记住，需要筛选。

```python
class MemoryManager:
    def __init__(self, memory: LongTermMemory):
        self.memory = memory

    async def process_conversation(self, messages: list):
        """对话结束后，提取值得记住的信息"""
        extraction_prompt = f"""
        从以下对话中，提取值得长期记住的信息。

        记忆类型：
        - 用户偏好（喜欢/不喜欢什么）
        - 用户信息（姓名、角色、公司等）
        - 重要决策（做了什么决定）
        - 关键事实（重要的数据和结论）

        对话内容：
        {format_messages(messages)}

        输出 JSON 数组，每条记忆包含：
        - type: 类型
        - content: 内容
        - importance: 重要性 1-10
        """

        result = await llm.ainvoke(extraction_prompt)
        memories = json.loads(result)

        for mem in memories:
            if mem["importance"] >= 5:  # 只存重要的
                self.memory.store(
                    content=mem["content"],
                    metadata={"type": mem["type"]}
                )
```

### 检索并注入上下文

```python
async def chat_with_memory(user_id: str, user_message: str):
    # 1. 回忆相关长期记忆
    relevant_memories = memory.recall(user_message, n_results=3)

    # 2. 构建带记忆的 Prompt
    memory_context = ""
    if relevant_memories:
        memory_context = "关于这个用户的记忆：\n"
        for mem in relevant_memories:
            memory_context += f"- {mem}\n"

    system_prompt = f"""你是一个有帮助的助手。
{memory_context}
请参考以上记忆来回答用户的问题。"""

    # 3. 正常对话
    response = await llm.ainvoke(system=system_prompt, messages=...)
    return response
```

## 情景记忆（Episodic Memory）

记录具体的经历和事件，带有时间线。

```python
class EpisodicMemory:
    def __init__(self):
        self.episodes = []

    def record_episode(self, event: str, context: dict = None):
        """记录一个事件"""
        self.episodes.append({
            "timestamp": datetime.now().isoformat(),
            "event": event,
            "context": context or {},
            "outcome": None,  # 后续可以更新
        })

    def update_outcome(self, index: int, outcome: str):
        """更新事件的结果"""
        if 0 <= index < len(self.episodes):
            self.episodes[index]["outcome"] = outcome

    def recall_episodes(self, query: str, n=5):
        """回忆相关经历"""
        # 用向量检索找最相关的经历
        return vector_db.similarity_search(query, n)

    def get_timeline(self):
        """获取时间线"""
        for ep in self.episodes:
            print(f"[{ep['timestamp']}] {ep['event']}")
            if ep.get("outcome"):
                print(f"  → 结果: {ep['outcome']}")

# 使用
episodic = EpisodicMemory()
episodic.record_episode("用户报告了搜索功能 bug", {"severity": "high"})
episodic.record_episode("修复了搜索 bug，原因是索引过期")
```

**适用场景：** Agent 需要从过去的经历中学习（哪些方法有效、哪些错误犯过）。

## 语义记忆（Semantic Memory）

结构化的知识存储，类似人类的知识体系。

```python
class SemanticMemory:
    """基于知识图谱的语义记忆"""

    def __init__(self):
        self.knowledge = {}  # 简化实现，生产用 Neo4j

    def add_fact(self, subject: str, relation: str, obj: str):
        """添加一条知识（三元组）"""
        if subject not in self.knowledge:
            self.knowledge[subject] = []
        self.knowledge[subject].append({"relation": relation, "object": obj})

    def query(self, subject: str) -> list:
        """查询关于某个实体的知识"""
        return self.knowledge.get(subject, [])

    def related(self, subject: str, relation: str) -> list:
        """查询特定关系"""
        facts = self.knowledge.get(subject, [])
        return [f["object"] for f in facts if f["relation"] == relation]

# 使用
semantic = SemanticMemory()
semantic.add_fact("Python", "is_a", "编程语言")
semantic.add_fact("Python", "created_by", "Guido van Rossum")
semantic.add_fact("Python", "used_for", "Web开发")
semantic.add_fact("Python", "used_for", "AI/ML")
semantic.add_fact("Python", "used_for", "数据分析")

# 查询
print(semantic.related("Python", "used_for"))
# → ["Web开发", "AI/ML", "数据分析"]
```

## 完整记忆系统

把所有类型整合在一起。

```python
class AgentMemorySystem:
    def __init__(self):
        self.working = WorkingMemory()       # 当前任务状态
        self.short_term = ShortTermMemory()   # 当前对话
        self.long_term = LongTermMemory()     # 跨会话记忆
        self.episodic = EpisodicMemory()      # 经历
        self.semantic = SemanticMemory()       # 知识

    def build_context(self, user_message: str) -> str:
        """为当前对话构建完整的记忆上下文"""
        context_parts = []

        # 1. 工作记忆
        if self.working.state:
            context_parts.append(f"当前任务状态：{self.working.get_context()}")

        # 2. 相关长期记忆
        memories = self.long_term.recall(user_message, n_results=3)
        if memories:
            context_parts.append("相关记忆：\n" + "\n".join(f"- {m}" for m in memories))

        # 3. 相关经历
        episodes = self.episodic.recall_episodes(user_message, n=2)
        if episodes:
            context_parts.append("相关经历：\n" + "\n".join(f"- {e}" for e in episodes))

        return "\n\n".join(context_parts)
```

## 最佳实践

| 实践 | 说明 |
|------|------|
| 分层存储 | 不同类型记忆用不同存储，按需查询 |
| 定期清理 | 长期记忆要定期整理，过时的删除 |
| 重要性过滤 | 不是所有信息都值得记住 |
| 隐私保护 | 敏感信息不入记忆，或加密存储 |
| Token 预算 | 给记忆预留 token 预算，不要占满上下文 |
| 记忆压缩 | 长期记忆定期合并和摘要 |
