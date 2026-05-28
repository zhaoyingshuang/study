# Function Calling

Function Calling（函数调用/工具调用）是 Agent 从「聊天机器人」进化为「能做事的助手」的关键能力。

## 什么是 Function Calling？

LLM 本身只能生成文本。Function Calling 让 LLM 能够**表达使用外部工具的意图**，应用层执行工具后将结果返回给 LLM，完成闭环。

```
没有工具调用：
用户 → LLM → 文本回答（可能编造信息）

有工具调用：
用户 → LLM → "我需要查天气" → 调用天气API → 结果返回LLM → 基于真实数据回答
```

## 工作原理

### 完整生命周期

```
                  ┌──────────────┐
                  │   用户提问    │
                  └──────┬───────┘
                         ↓
                  ┌──────────────┐
                  │  LLM 推理    │
                  │  是否需要工具？│
                  └──┬───────┬───┘
                   否│       │是
                     ↓       ↓
              直接回答   输出函数调用请求
                         {
                           "name": "get_weather",
                           "arguments": {"city": "北京"}
                         }
                              ↓
                     ┌──────────────┐
                     │  应用层执行   │
                     │  实际函数调用  │
                     └──────┬───────┘
                            ↓
                     ┌──────────────┐
                     │  返回结果给LLM │
                     │  {"temp":28}  │
                     └──────┬───────┘
                            ↓
                     ┌──────────────┐
                     │  LLM 生成    │
                     │  最终回答     │
                     └──────────────┘
```

### 多轮工具调用

Agent 可能需要多次调用不同工具才能完成任务：

```
用户：帮我对比北京和上海今天的天气，看看哪里更适合户外运动。

第 1 轮：
  LLM → 调用 get_weather("北京")
  结果 → {"temp": 28, "condition": "晴", "humidity": 40}

第 2 轮：
  LLM → 调用 get_weather("上海")
  结果 → {"temp": 32, "condition": "多云", "humidity": 75}

第 3 轮：
  LLM → 综合分析两个城市的数据
  回答 → "北京更适合户外运动，气温28°C较舒适，
          湿度40%干爽。上海32°C且湿度75%，会比较闷热。"
```

## 定义工具

### Anthropic Claude 格式

```python
tools = [
    {
        "name": "get_weather",
        "description": "获取指定城市的当前天气信息",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "城市名称，如'北京'、'上海'、'广州'"
                },
                "unit": {
                    "type": "string",
                    "enum": ["celsius", "fahrenheit"],
                    "description": "温度单位，默认摄氏度"
                }
            },
            "required": ["city"]
        }
    },
    {
        "name": "search_web",
        "description": "搜索互联网，获取最新信息",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "搜索查询关键词"
                },
                "num_results": {
                    "type": "integer",
                    "description": "返回结果数量，默认5"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "run_code",
        "description": "执行Python代码并返回结果",
        "input_schema": {
            "type": "object",
            "properties": {
                "code": {
                    "type": "string",
                    "description": "要执行的Python代码"
                }
            },
            "required": ["code"]
        }
    }
]
```

### 工具定义的最佳实践

**description 很重要：**

```python
# ❌ 不好：描述太模糊
"description": "搜索"

# ✅ 好：描述清楚工具的能力和限制
"description": "搜索互联网获取最新信息。适用于需要实时数据、新闻、价格等场景。返回最相关的网页摘要。"
```

**参数描述要具体：**

```python
# ❌ 不好
"city": {"type": "string", "description": "城市"}

# ✅ 好
"city": {
    "type": "string",
    "description": "城市名称的中文全称，如'北京市'、'上海市'。不要使用缩写或英文。"
}
```

**使用 enum 约束取值：**

```python
"time_range": {
    "type": "string",
    "enum": ["today", "this_week", "this_month", "this_year"],
    "description": "时间范围"
}
```

## 完整代码示例

### 基础 Agent 循环

```python
import anthropic
import json

client = anthropic.Anthropic()

# 工具定义
tools = [
    {
        "name": "get_weather",
        "description": "获取指定城市的天气信息",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "城市名称"}
            },
            "required": ["city"]
        }
    }
]

# 工具实现
def get_weather(city: str) -> dict:
    """实际的天气API调用"""
    # 这里调用真实的天气API
    # 示例返回模拟数据
    weather_data = {
        "北京": {"temperature": 28, "condition": "晴", "humidity": 40},
        "上海": {"temperature": 32, "condition": "多云", "humidity": 75},
    }
    return weather_data.get(city, {"error": f"未找到城市: {city}"})

# 工具执行器
def execute_tool(name: str, arguments: dict):
    tool_map = {
        "get_weather": get_weather,
    }
    func = tool_map.get(name)
    if func:
        return func(**arguments)
    return {"error": f"未知工具: {name}"}

# Agent 主循环
def agent_run(user_message: str, max_turns: int = 10):
    messages = [{"role": "user", "content": user_message}]

    for _ in range(max_turns):
        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            system="你是一个有用的助手，可以使用工具帮助用户。用中文回复。",
            messages=messages,
            tools=tools,
            max_tokens=1024
        )

        # 收集 assistant 的回复
        messages.append({"role": "assistant", "content": response.content})

        # 检查是否需要调用工具
        if response.stop_reason == "tool_use":
            tool_results = []
            for block in response.content:
                if block.type == "tool_use":
                    print(f"调用工具: {block.name}({block.input})")
                    result = execute_tool(block.name, block.input)
                    tool_results.append({
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": json.dumps(result, ensure_ascii=False)
                    })

            messages.append({"role": "user", "content": tool_results})
        else:
            # 最终回答
            for block in response.content:
                if block.type == "text":
                    return block.text

    return "达到最大轮次限制"

# 运行
result = agent_run("北京今天天气怎么样？适合出门吗？")
print(result)
```

### LangChain 实现

```python
from langchain_openai import ChatOpenAI
from langchain.tools import tool
from langgraph.prebuilt import create_react_agent

# 定义工具
@tool
def get_weather(city: str) -> str:
    """获取指定城市的天气信息"""
    weather_data = {
        "北京": "晴，28°C，湿度40%",
        "上海": "多云，32°C，湿度75%",
    }
    return weather_data.get(city, f"未找到{city}的天气信息")

@tool
def search_web(query: str) -> str:
    """搜索互联网获取信息"""
    # 调用搜索API
    return f"搜索结果：关于'{query}'的最新信息..."

# 创建 Agent
model = ChatOpenAI(model="gpt-4o")
tools = [get_weather, search_web]
agent = create_react_agent(model, tools)

# 运行
result = agent.invoke({
    "messages": [{"role": "user", "content": "北京天气怎么样？"}]
})
```

## 并行工具调用

某些场景下，Agent 可以同时调用多个工具以提高效率。

```python
# 用户的提问可能涉及多个工具
# "北京和上海的天气怎么样？苹果公司的股价是多少？"
#
# LLM 可能一次返回多个工具调用：
# 1. get_weather("北京")
# 2. get_weather("上海")
# 3. get_stock_price("AAPL")
#
# 这三个调用之间没有依赖，可以并行执行
```

## 常见问题与解决方案

| 问题 | 原因 | 解决方案 |
|------|------|----------|
| LLM 不调用工具 | 工具描述不清楚，或 Prompt 没有引导 | 改善工具描述，在 System Prompt 中强调使用工具 |
| 调用错误的工具 | 工具之间描述相似，容易混淆 | 区分工具描述，增加更多细节 |
| 参数格式错误 | 参数描述不够明确 | 使用 enum 约束，给出参数示例 |
| 无限循环调用 | LLM 反复调用同一工具 | 设置最大轮次限制，在 Prompt 中限制调用次数 |
| 幻觉工具名 | LLM 编造不存在的工具 | 在 System Prompt 中列出可用工具，明确禁止编造 |

## 安全注意事项

```python
# 1. 验证工具参数
def execute_tool(name, arguments):
    # 白名单检查
    if name not in ALLOWED_TOOLS:
        return {"error": "工具不被允许"}

    # 参数校验
    schema = TOOLS_SCHEMA[name]
    validate(arguments, schema)  # JSON Schema 校验

    # 敏感操作确认
    if name in SENSITIVE_TOOLS:
        if not confirm_with_user(name, arguments):
            return {"error": "用户取消了操作"}

    return ALLOWED_TOOLS[name](**arguments)

# 2. 限制工具权限
# 代码执行工具应该沙箱化
# 数据库操作应该只读或限制影响范围
# 文件操作应该限制目录
```
