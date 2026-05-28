# 国产模型适配

国内开发者使用国产 LLM 开发 Agent，有成本、合规、网络等优势，但也有一些适配注意事项。

## 主流国产模型

### 模型对比

| 模型 | 厂商 | 上下文长度 | 特点 | 价格 |
|------|------|-----------|------|------|
| DeepSeek-V3 | DeepSeek | 128K | 性价比极高，推理能力强 | 很便宜 |
| GLM-4 | 智谱 AI | 128K | 中文能力强，工具调用稳定 | 中等 |
| Qwen-Max | 阿里云 | 32K | 中文理解好，生态完善 | 中等 |
| Qwen-Plus | 阿里云 | 128K | 性价比高 | 便宜 |
| ERNIE-4.0 | 百度 | 128K | 百度生态集成 | 中等 |
| Doubao-1.5-pro | 字节跳动 | 128K | 豆包系列，性价比高 | 便宜 |
| Moonshot-v1 | 月之暗面 | 128K | 长文本处理优秀 | 中等 |

### 选型建议

| 场景 | 推荐模型 | 原因 |
|------|----------|------|
| 成本敏感 | DeepSeek-V3 | 性价比最高 |
| 工具调用多 | GLM-4 / Qwen-Plus | Function Calling 稳定 |
| 中文理解要求高 | GLM-4 / Qwen-Max | 中文训练数据充分 |
| 长文档处理 | Moonshot-v1 | 长文本优化 |
| 私有化部署 | DeepSeek / Qwen 开源版 | 有开源权重 |

## API 调用适配

### 统一接口（OpenAI 兼容模式）

大多数国产模型都兼容 OpenAI API 格式，可以复用现有代码。

```python
from openai import OpenAI

# DeepSeek — 改 base_url 和 api_key
client = OpenAI(
    api_key="your-deepseek-key",
    base_url="https://api.deepseek.com"
)

# GLM — 同样兼容
client = OpenAI(
    api_key="your-zhipu-key",
    base_url="https://open.bigmodel.cn/api/paas/v4"
)

# Qwen
client = OpenAI(
    api_key="your-qwen-key",
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)

# 调用方式完全一样
response = client.chat.completions.create(
    model="deepseek-chat",  # 或 "glm-4", "qwen-plus"
    messages=[{"role": "user", "content": "你好"}]
)
```

### DeepSeek

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-key",
    base_url="https://api.deepseek.com"
)

# 普通对话
response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[
        {"role": "system", "content": "你是一个有用的助手"},
        {"role": "user", "content": "你好"}
    ]
)

# Function Calling
response = client.chat.completions.create(
    model="deepseek-chat",
    messages=messages,
    tools=[{
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "获取天气信息",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string"}
                },
                "required": ["city"]
            }
        }
    }]
)
```

### GLM-4（智谱）

```python
# 方式1：OpenAI 兼容模式（推荐）
from openai import OpenAI

client = OpenAI(
    api_key="your-key",
    base_url="https://open.bigmodel.cn/api/paas/v4"
)

response = client.chat.completions.create(
    model="glm-4",
    messages=messages,
    tools=tools  # 支持 Function Calling
)

# 方式2：官方 SDK
from zhipuai import ZhipuAI

client = ZhipuAI(api_key="your-key")
response = client.chat.completions.create(
    model="glm-4",
    messages=messages,
    tools=tools
)
```

### Qwen（通义千问）

```python
from openai import OpenAI

client = OpenAI(
    api_key="your-key",
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)

response = client.chat.completions.create(
    model="qwen-plus",
    messages=messages,
    tools=tools  # 支持 Function Calling
)
```

## LangChain 适配

### 使用 ChatOpenAI 包装

```python
from langchain_openai import ChatOpenAI

# DeepSeek
llm = ChatOpenAI(
    model="deepseek-chat",
    api_key="your-key",
    base_url="https://api.deepseek.com"
)

# GLM-4
llm = ChatOpenAI(
    model="glm-4",
    api_key="your-key",
    base_url="https://open.bigmodel.cn/api/paas/v4"
)

# Qwen
llm = ChatOpenAI(
    model="qwen-plus",
    api_key="your-key",
    base_url="https://dashscope.aliyuncs.com/compatible-mode/v1"
)

# 用法完全一样
from langchain.tools import tool
from langgraph.prebuilt import create_react_agent

@tool
def search(query: str) -> str:
    """搜索"""
    return f"搜索结果：{query}"

agent = create_react_agent(llm, [search])
result = agent.invoke({"messages": [{"role": "user", "content": "你好"}]})
```

### Embedding 适配

```python
from langchain_community.embeddings import DashScopeEmbeddings

# 阿里通义 Embedding
embeddings = DashScopeEmbeddings(
    model="text-embedding-v3",
    dashscope_api_key="your-key"
)

# 或用 HuggingFace 本地模型
from langchain_community.embeddings import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-large-zh-v1.5"
)
```

## 注意事项

### 1. Function Calling 兼容性

国产模型的 Function Calling 能力参差不齐：

| 模型 | Function Calling | 并行调用 | 稳定性 |
|------|-----------------|----------|--------|
| DeepSeek-V3 | 支持 | 支持 | 较好 |
| GLM-4 | 支持 | 支持 | 好 |
| Qwen-Plus | 支持 | 支持 | 好 |
| Qwen-Max | 支持 | 部分支持 | 一般 |

**建议：** 如果 Agent 重度依赖工具调用，优先选 GLM-4 或 Qwen-Plus。

### 2. 中文 Prompt 优化

```python
# 国产模型对中文 Prompt 更友好，可以直接用中文
system_prompt = """
你是一个智能客服助手。

你的职责：
1. 解答用户关于产品的问题
2. 处理退换货申请
3. 记录用户反馈

注意事项：
- 使用礼貌、专业的语气
- 如果不确定，不要编造信息
- 涉及退款的操作需要确认用户身份
"""
```

### 3. 上下文长度管理

```python
# 国产模型上下文通常 32K-128K
# 但实际可用长度取决于模型实现

# 建议：仍然做好上下文管理
def trim_messages(messages, max_tokens=30000):
    """保守估计，留出余量给输出"""
    total = estimate_tokens(messages)
    while total > max_tokens and len(messages) > 2:
        # 移除最早的非 system 消息
        messages.pop(1)
        total = estimate_tokens(messages)
    return messages
```

### 4. 错误处理

```python
import time
from openai import APIError, RateLimitError, APITimeoutError

def call_llm_with_retry(client, messages, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="deepseek-chat",
                messages=messages
            )
            return response
        except RateLimitError:
            wait = 2 ** attempt
            print(f"限流，等待 {wait}s...")
            time.sleep(wait)
        except APITimeoutError:
            print(f"超时，重试 {attempt + 1}/{max_retries}")
        except APIError as e:
            print(f"API 错误: {e}")
            if attempt == max_retries - 1:
                raise
            time.sleep(1)
    raise Exception("超过最大重试次数")
```

### 5. 网络与合规

- 国产模型 API 在国内访问稳定，无需代理
- 数据不出境，满足合规要求
- 部分行业（金融、医疗）可能要求使用国产模型

## 混合策略

最佳实践是混合使用国内外模型：

```python
class HybridLLM:
    def __init__(self):
        self.primary = OpenAI(base_url="https://api.deepseek.com", ...)
        self.fallback = OpenAI(base_url="https://api.openai.com", ...)  # 海外备用

    def chat(self, messages, **kwargs):
        try:
            return self.primary.chat.completions.create(messages=messages, **kwargs)
        except Exception:
            return self.fallback.chat.completions.create(messages=messages, **kwargs)

# 不同任务用不同模型
task_model_map = {
    "simple_qa": "deepseek-chat",      # 简单问答用便宜的
    "complex_reasoning": "glm-4",       # 复杂推理用能力强的
    "code_generation": "deepseek-chat", # 代码生成 DeepSeek 很强
    "safety_critical": "gpt-4o",        # 安全关键场景用 OpenAI
}
```
