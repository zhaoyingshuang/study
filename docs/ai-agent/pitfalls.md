# 踩坑记录

实际开发 AI Agent 过程中遇到的问题和解决方案，持续更新。

## 基础篇

### 坑1：Agent 不调用工具

**现象：** 明确定义了工具，但 Agent 就是不调用，直接给一个可能错误的文字回答。

**原因：**
- 工具的 `description` 写得太模糊
- System Prompt 没有引导使用工具
- Temperature 设置太高

**解决：**
```
1. 工具描述要具体，说清楚什么场景用这个工具
2. System Prompt 加："当需要获取实时信息或执行操作时，使用提供的工具"
3. Temperature 设为 0-0.3
```

---

### 坑2：Agent 调用了错误的工具

**现象：** 用户问天气，Agent 调用了搜索工具而不是天气工具。

**原因：** 多个工具的描述有重叠或歧义。

**解决：**
- 每个工具的描述要独特，强调各自的适用场景
- 搜索工具描述加"当其他工具不适用时"
- 减少不必要的工具数量

---

### 坑3：Agent 陷入无限循环

**现象：** Agent 反复调用同一个工具，或者来回切换两个工具。

**原因：**
- 工具返回的结果格式不对，LLM 无法理解
- Agent 没有判断"信息已经够了"的能力
- 缺少终止条件

**解决：**
```python
max_turns = 10
for i in range(max_turns):
    response = call_llm(...)
    if response.stop_reason != "tool_use":
        break
    # 检测重复调用
    if same_tool_called_3_times(response):
        break
```

---

## RAG 篇

### 坑4：检索出来的内容不相关

**现象：** 用户问 A，检索出来的都是 B 的内容。

**原因：**
- 分块太大，一个 chunk 包含多个话题
- Embedding 模型对中文支持不好
- 用户查询太模糊

**解决：**
```
1. 分块大小：中文 300-500 字符
2. 换 BGE 系列的中文 Embedding
3. 加查询改写：把用户模糊的问题改写为精确的查询
4. 降低 chunk_overlap 避免噪声
```

---

### 坑5：PDF 解析质量差

**现象：** 表格、图片、多栏排版解析出来是乱码。

**原因：** PyPDFLoader 只能提取纯文本，无法处理复杂排版。

**解决：**
- 表格多的 PDF：用 `pdfplumber` 或 `camelot`
- 扫描版 PDF：先用 OCR（PaddleOCR）再提取
- 复杂排版：用 `unstructured` 库
- 效果最好的方案：用多模态模型（如 GPT-4o）直接读图片

---

### 坑6：RAG 回答还是编造

**现象：** 明明接了 RAG，Agent 还是不基于检索结果回答，自己编。

**原因：**
- Prompt 没有强调"必须基于检索到的信息回答"
- 检索结果放得太远，模型没关注到
- 检索结果太少或完全不相关

**解决：**
```
System Prompt 加：
"你必须基于 <context> 标签中的参考信息来回答。
如果参考信息不足以回答问题，明确说'根据已有信息无法回答'。
不要编造参考信息中没有的内容。"
```

---

## 成本篇

### 坑7：Token 消耗远超预期

**现象：** 一个简单问答消耗了数万 token。

**原因：**
- 对话历史越来越长，没有管理
- 工具定义太长
- System Prompt 太冗长

**解决：**
```python
# 1. 管理对话历史
messages = messages[-20:]  # 只保留最近 10 轮

# 2. 按需传工具
relevant_tools = select_relevant_tools(user_message)
# 只传相关的 2-3 个工具，不要一次传 20 个

# 3. 精简 System Prompt
# 从 2000 token 压缩到 500 token
```

---

### 坑8：Prompt Caching 没生效

**现象：** 配置了缓存但没有节省 token。

**原因：**
- 缓存要求 System Prompt 完全不变（包括空格）
- 缓存有 TTL（5分钟），长时间不调用会过期
- 没有正确标记 `cache_control`

**解决：**
```python
system = [{
    "type": "text",
    "text": SYSTEM_PROMPT,  # 这个字符串必须每次完全相同
    "cache_control": {"type": "ephemeral"}
}]
```

---

## 多 Agent 篇

### 坑9：Multi-Agent 效果不如单 Agent

**现象：** 用了 CrewAI 搭了 3 个 Agent，效果反而不如直接用一个 Agent。

**原因：**
- 任务太简单，不需要多 Agent
- Agent 之间的信息传递有损耗
- Agent 角色定义不清晰

**解决：**
- 简单任务用单 Agent
- 多 Agent 只在任务确实需要多角色时使用
- 确保每个 Agent 有清晰的输入输出定义

---

### 坑10：Agent 之间传递了过多无关信息

**现象：** 下游 Agent 收到一大堆无关内容，影响输出质量。

**解决：**
- 每个 Agent 的输出应该是结构化的（如 JSON）
- 只传递下游 Agent 需要的信息
- 中间结果做摘要再传递

---

## 部署篇

### 坑11：生产环境响应太慢

**现象：** 本地开发还行，上线后响应要十几秒。

**原因：**
- 没有使用流式输出
- 工具调用是串行的，没有并行
- 向量数据库查询慢

**解决：**
```
1. 开启流式输出 SSE
2. 无依赖的工具调用并行执行
3. 向量数据库加索引优化
4. 加 Redis 缓存常见问题
5. 简单问题用小模型
```

---

### 坑12：并发请求导致限流

**现象：** 用户一多就 429 Too Many Requests。

**解决：**
```python
# 1. 请求队列 + 限流
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

# 2. 多 Key 轮询
api_keys = ["key1", "key2", "key3"]
current_key = api_keys[request_count % len(api_keys)]

# 3. 降级策略
# 限流时切换到备用模型或返回缓存结果
```

---

## 国产模型篇

### 坑13：国产模型 Function Calling 不稳定

**现象：** 同样的工具定义，有时能正确调用，有时输出格式错误。

**原因：** 部分国产模型的 Function Calling 能力还不够成熟。

**解决：**
```python
# 加重试 + 格式校验
def call_with_retry(messages, tools, max_retries=3):
    for i in range(max_retries):
        try:
            response = client.chat.completions.create(...)
            validate_tool_call(response)
            return response
        except FormatError:
            messages.append({"role": "system",
                "content": "请严格按照JSON格式输出工具调用"})
            continue
```

---

### 坑14：OpenAI 兼容模式有小差异

**现象：** 用 OpenAI SDK 调国产模型，某些参数不生效。

**解决：**
- 仔细阅读国产模型的兼容文档
- 不支持的参数不要传（如 logprobs）
- 温度参数范围可能不同
- max_tokens 某些模型叫 max_completion_tokens

---

## 持续更新中

遇到新的踩坑经验会持续补充到这里。欢迎提交你的踩坑记录。
