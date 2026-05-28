# Agent 可观测性

Agent 的执行过程复杂且不确定，可观测性（Observability）是理解和调试 Agent 行为的关键能力。

## 为什么需要可观测性？

| 问题 | 没有可观测性 | 有可观测性 |
|------|-------------|-----------|
| Agent 回答错误 | 不知道哪一步出了问题 | 追踪每一步的输入输出 |
| 成本超标 | 不知道 token 花在哪 | 每次调用的 token 消耗一目了然 |
| 响应慢 | 不知道卡在哪 | 每个环节的延迟可视化 |
| 工具调用异常 | 只有报错信息 | 完整的工具调用链路 |
| 效果波动 | 不确定是哪个改动导致的 | 对比不同版本的运行轨迹 |

## 三大支柱

### 1. Tracing（链路追踪）

记录 Agent 执行的每一步。

```
用户提问："北京天气怎么样？"
  │
  ├─ [LLM 调用] 输入 → 输出（决定调用工具）
  │   Token: 150 in, 80 out | 耗时: 1.2s
  │
  ├─ [工具调用] get_weather(city="北京")
  │   耗时: 0.3s
  │
  ├─ [LLM 调用] 输入（工具结果）→ 输出（最终回答）
  │   Token: 200 in, 120 out | 耗时: 0.8s
  │
  └─ 总计: Token 550 | 耗时 2.3s | 工具调用 1 次
```

### 2. Logging（日志）

记录关键事件和状态变化。

```python
import logging

logger = logging.getLogger("agent")

def agent_run(user_message):
    logger.info(f"收到用户消息: {user_message}")

    # LLM 调用
    logger.debug(f"LLM 输入: {messages}")
    response = client.messages.create(...)
    logger.debug(f"LLM 输出: {response}")

    if response.stop_reason == "tool_use":
        for block in response.content:
            if block.type == "tool_use":
                logger.info(f"工具调用: {block.name}({block.input})")
                result = execute_tool(block.name, block.input)
                logger.info(f"工具结果: {result}")

    logger.info(f"最终回答: {final_answer}")
    return final_answer
```

### 3. Metrics（指标）

量化的性能数据。

| 指标 | 说明 |
|------|------|
| `agent.request.count` | 总请求数 |
| `agent.request.latency` | 响应延迟分布 |
| `agent.llm.tokens.total` | Token 总消耗 |
| `agent.tool.call.count` | 工具调用次数 |
| `agent.tool.call.latency` | 工具调用延迟 |
| `agent.error.rate` | 错误率 |
| `agent.cost.usd` | 单次请求成本 |

## 工具与平台

### LangSmith

LangChain 官方的可观测性平台。

```python
import os
os.environ["LANGSMITH_API_KEY"] = "your-key"
os.environ["LANGSMITH_TRACING"] = "true"
os.environ["LANGSMITH_PROJECT"] = "my-agent"

# 所有 LangChain 调用会自动追踪
from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQA

# 无需额外代码，自动记录每一步
chain = RetrievalQA.from_chain_type(...)
result = chain({"query": "hello"})
```

**功能：**
- 可视化 Agent 执行链路
- 每步的输入输出和延迟
- Token 消耗统计
- 版本对比
- 评估和标注
- 与 GitHub 集成

### LangFuse

开源的 LLM 可观测性平台，支持任意框架。

```python
from langfuse.decorators import observe

@observe()
def agent_run(user_message: str):
    # Langfuse 自动追踪这个函数
    response = llm.invoke(user_message)

    if needs_tool(response):
        tool_result = execute_tool(response.tool_call)
        final = llm.invoke(tool_result)
        return final

    return response

# 手动记录
from langfuse import Langfuse
langfuse = Langfuse()

trace = langfuse.trace(name="agent-run")
span = trace.span(name="llm-call", input={"message": user_input})
# ... 执行 LLM ...
span.end(output={"response": llm_output})
```

**优势：** 开源，可自部署，不绑定特定框架。

### Arize Phoenix

开源的 AI 可观测性工具，本地运行。

```python
import phoenix as px
from phoenix.trace.langchain import LangChainInstrumentor

# 启动本地 Phoenix 服务
session = px.launch_app()

# 自动追踪 LangChain 调用
LangChainInstrumentor().instrument()

# 运行 Agent
result = agent.run("hello")

# 打开 http://localhost:6006 查看追踪
print(f"查看追踪: {session.url}")
```

**优势：** 本地运行，无需云端，适合开发阶段。

### OpenTelemetry + LLM

标准化的可观测性方案。

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider

tracer = trace.get_tracer("agent")

def agent_run(user_message):
    with tracer.start_as_current_span("agent.run") as span:
        span.set_attribute("user.message", user_message)

        with tracer.start_as_current_span("llm.call") as llm_span:
            response = llm.invoke(user_message)
            llm_span.set_attribute("llm.tokens.input", response.usage.input_tokens)
            llm_span.set_attribute("llm.tokens.output", response.usage.output_tokens)

        return response
```

## 调试技巧

### 1. 打印完整链路

```python
def debug_agent_run(user_message):
    messages = [{"role": "user", "content": user_message}]
    step = 0

    while True:
        step += 1
        print(f"\n{'='*50}")
        print(f"Step {step}: 调用 LLM")
        print(f"  输入消息数: {len(messages)}")

        response = client.messages.create(...)

        print(f"  停止原因: {response.stop_reason}")
        print(f"  Token: {response.usage}")

        if response.stop_reason == "tool_use":
            for block in response.content:
                if block.type == "tool_use":
                    print(f"  工具调用: {block.name}")
                    print(f"  参数: {json.dumps(block.input, ensure_ascii=False)}")
                    result = execute_tool(block.name, block.input)
                    print(f"  工具结果: {result}")
        else:
            for block in response.content:
                if block.type == "text":
                    print(f"  最终回答: {block.text[:200]}")
            break
```

### 2. 记录轨迹回放

```python
import json
from datetime import datetime

class AgentRecorder:
    def __init__(self):
        self.traces = []

    def record(self, step_type, data):
        self.traces.append({
            "timestamp": datetime.now().isoformat(),
            "type": step_type,
            "data": data
        })

    def save(self, filepath):
        with open(filepath, "w") as f:
            json.dump(self.traces, f, ensure_ascii=False, indent=2)

    def replay(self, filepath):
        with open(filepath) as f:
            traces = json.load(f)
        for t in traces:
            print(f"[{t['timestamp']}] {t['type']}: {t['data']}")
```

### 3. 成本追踪

```python
class CostTracker:
    def __init__(self):
        self.costs = []
        # 价格表（每百万 token 的美元价格）
        self.prices = {
            "claude-sonnet-4-20250514": {"input": 3.0, "output": 15.0},
            "gpt-4o": {"input": 2.5, "output": 10.0},
        }

    def track(self, model, input_tokens, output_tokens):
        price = self.prices.get(model, {"input": 3.0, "output": 15.0})
        cost = (input_tokens * price["input"] + output_tokens * price["output"]) / 1_000_000
        self.costs.append({
            "model": model,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "cost_usd": cost
        })

    def summary(self):
        total_cost = sum(c["cost_usd"] for c in self.costs)
        total_input = sum(c["input_tokens"] for c in self.costs)
        total_output = sum(c["output_tokens"] for c in self.costs)
        return {
            "total_cost_usd": round(total_cost, 4),
            "total_input_tokens": total_input,
            "total_output_tokens": total_output,
            "llm_calls": len(self.costs)
        }
```

## 生产环境建议

1. **开发阶段** — 用 Arize Phoenix 本地调试
2. **上线初期** — 用 LangFuse 记录所有请求，分析问题
3. **稳定运行** — 切换到 LangSmith 或自建系统，采样记录
4. **持续优化** — 定期分析高成本、高延迟、低质量的请求

| 阶段 | 工具 | 成本 |
|------|------|------|
| 开发调试 | Phoenix（本地） | 免费 |
| 小规模上线 | LangFuse（自部署） | 免费 |
| 生产监控 | LangSmith / LangFuse Cloud | 按量付费 |
