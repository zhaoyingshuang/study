# 小模型与端侧 Agent

不是所有 Agent 都需要调用云端大模型。用小模型在本地运行 Agent，有成本低、延迟低、隐私好等优势。

## 为什么关注小模型？

| 优势 | 说明 |
|------|------|
| **成本** | 本地运行免费，无 API 费用 |
| **延迟** | 没有网络请求，响应更快 |
| **隐私** | 数据不出设备 |
| **离线** | 不依赖网络，随时可用 |
| **可控** | 完全掌控模型行为 |

| 劣势 | 说明 |
|------|------|
| **能力弱** | 推理和生成质量不如大模型 |
| **工具调用** | Function Calling 能力较弱 |
| **上下文短** | 支持的上下文长度有限 |
| **硬件要求** | 需要一定的 GPU/内存 |

## 可用的小模型

### 模型对比

| 模型 | 参数量 | 内存需求 | 特点 |
|------|--------|----------|------|
| Qwen2.5-7B | 7B | ~8GB | 中文好，工具调用能力不错 |
| Qwen2.5-3B | 3B | ~4GB | 更轻量，适合简单任务 |
| Llama-3.1-8B | 8B | ~8GB | Meta 出品，英文好 |
| Mistral-7B | 7B | ~8GB | 效率高，推理快 |
| GLM-4-9B | 9B | ~10GB | 智谱出品，中文好 |
| Phi-3-mini | 3.8B | ~4GB | 微软出品，推理能力强 |
| DeepSeek-R1-Distill-7B | 7B | ~8GB | 推理能力突出 |

### 选型建议

| 场景 | 推荐模型 | 原因 |
|------|----------|------|
| 中文 Agent | Qwen2.5-7B | 中文能力最好 |
| 英文 Agent | Llama-3.1-8B | 综合能力强 |
| 资源受限 | Phi-3-mini / Qwen2.5-3B | 内存需求低 |
| 推理任务 | DeepSeek-R1-Distill-7B | 推理能力好 |
| 端侧/手机 | Qwen2.5-1.5B / Phi-3-mini | 超轻量 |

## 本地运行

### Ollama

最简单的本地模型运行工具。

```bash
# 安装
curl -fsSL https://ollama.com/install.sh | sh

# 下载模型
ollama pull qwen2.5:7b
ollama pull llama3.1:8b

# 命令行对话
ollama run qwen2.5:7b

# 启动 API 服务（默认 http://localhost:11434）
ollama serve
```

### API 调用

Ollama 兼容 OpenAI API 格式：

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:11434/v1",
    api_key="ollama"  # 任意值
)

response = client.chat.completions.create(
    model="qwen2.5:7b",
    messages=[
        {"role": "system", "content": "你是一个有用的助手"},
        {"role": "user", "content": "你好"}
    ]
)
print(response.choices[0].message.content)
```

### Function Calling

```python
response = client.chat.completions.create(
    model="qwen2.5:7b",
    messages=messages,
    tools=[{
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "获取天气",
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

if response.choices[0].message.tool_calls:
    tool_call = response.choices[0].message.tool_calls[0]
    print(f"调用工具: {tool_call.function.name}")
    print(f"参数: {tool_call.function.arguments}")
```

### LangChain 集成

```python
from langchain_ollama import ChatOllama
from langchain.tools import tool
from langgraph.prebuilt import create_react_agent

# 本地模型
llm = ChatOllama(
    model="qwen2.5:7b",
    temperature=0,
    base_url="http://localhost:11434"
)

# 定义工具
@tool
def search_local_files(query: str) -> str:
    """搜索本地文件"""
    import subprocess
    result = subprocess.run(
        ["grep", "-r", query, "/path/to/docs"],
        capture_output=True, text=True
    )
    return result.stdout[:2000]

@tool
def run_python(code: str) -> str:
    """执行Python代码"""
    import subprocess
    result = subprocess.run(
        ["python3", "-c", code],
        capture_output=True, text=True, timeout=10
    )
    return result.stdout or result.stderr

# 创建本地 Agent
agent = create_react_agent(llm, [search_local_files, run_python])

result = agent.invoke({
    "messages": [{"role": "user", "content": "帮我搜索本地文档中关于API的内容"}]
})
```

## vLLM 高性能推理

生产环境需要更高的推理性能。

```bash
# 安装
pip install vllm

# 启动推理服务
python -m vllm.entrypoints.openai.api_server \
    --model Qwen/Qwen2.5-7B-Instruct \
    --host 0.0.0.0 \
    --port 8000 \
    --tensor-parallel-size 1
```

```python
# 调用（与 OpenAI API 兼容）
client = OpenAI(base_url="http://localhost:8000/v1", api_key="none")
response = client.chat.completions.create(
    model="Qwen/Qwen2.5-7B-Instruct",
    messages=[{"role": "user", "content": "你好"}]
)
```

## 量化技术

降低模型内存占用，在消费级硬件上运行。

### GGUF 格式

```bash
# 下载量化模型（4-bit 量化，内存减半）
ollama pull qwen2.5:7b-q4_K_M

# 对比
# 原始 7B 模型：~14GB 显存
# Q4 量化 7B：  ~5GB 显存
```

### 量化级别

| 量化 | 内存 | 质量 | 适用 |
|------|------|------|------|
| FP16（无量化） | 100% | 最好 | GPU 24GB+ |
| Q8 | ~50% | 很好 | GPU 12GB+ |
| Q5 | ~35% | 好 | GPU 8GB+ |
| Q4 | ~25% | 可接受 | GPU 6GB+ |
| Q2 | ~15% | 有损 | GPU 4GB |

**建议：** Q4_K_M 是性价比最好的量化级别。

## 端侧部署

### 手机端

```python
# MLX (Apple Silicon)
# Apple 设备上高效运行模型
import mlx.core as mx
from mlx_lm import load, generate

model, tokenizer = load("qwen/Qwen2.5-3B-Instruct-4bit")
response = generate(model, tokenizer, prompt="你好", max_tokens=200)
```

### 嵌入式设备

```
树莓派 5 (8GB) → 可以跑 Qwen2.5-1.5B Q4
Jetson Nano   → 可以跑 Qwen2.5-3B Q4
MacBook M2+   → 可以跑 Qwen2.5-7B Q4
```

## 混合架构

本地小模型 + 云端大模型，取长补短。

```python
class HybridAgent:
    def __init__(self):
        # 本地模型处理简单任务
        self.local_llm = ChatOllama(model="qwen2.5:7b")
        # 云端模型处理复杂任务
        self.cloud_llm = ChatOpenAI(model="gpt-4o")

    def classify_complexity(self, question: str) -> str:
        """判断任务复杂度"""
        simple_patterns = [
            "翻译", "总结", "格式化", "提取",
            "你好", "谢谢", "天气",
        ]
        for pattern in simple_patterns:
            if pattern in question:
                return "simple"
        return "complex"

    def run(self, question: str):
        complexity = self.classify_complexity(question)

        if complexity == "simple":
            # 本地处理，快速免费
            return self.local_llm.invoke(question)
        else:
            # 云端处理，能力更强
            return self.cloud_llm.invoke(question)
```

### 路由策略

```python
def route_request(question, has_tools=True, needs_reasoning=False):
    """智能路由"""
    score = 0

    if has_tools:
        score += 2  # 工具调用用大模型更稳
    if needs_reasoning:
        score += 2  # 复杂推理用大模型
    if len(question) > 500:
        score += 1  # 长文本倾向大模型

    # 简单判断
    if any(kw in question for kw in ["分析", "对比", "评估", "设计"]):
        score += 2

    if score >= 3:
        return "cloud"
    return "local"
```

## 最佳实践

1. **先试小模型** — 很多简单任务小模型就够了
2. **用 Ollama 起步** — 一行命令运行模型
3. **Q4 量化** — 消费级硬件的最佳选择
4. **混合架构** — 简单任务本地，复杂任务云端
5. **针对性优化 Prompt** — 小模型需要更明确的指令
6. **限制工具数量** — 小模型处理太多工具容易混乱
7. **测试工具调用能力** — 不是所有小模型都能可靠地做 Function Calling
