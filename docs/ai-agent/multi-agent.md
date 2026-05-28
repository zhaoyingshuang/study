# Multi-Agent（多智能体协作）

当单个 Agent 能力不够时，让多个 Agent 协同工作可以解决更复杂的问题。

## 为什么需要 Multi-Agent？

| 场景 | 单 Agent 的问题 | Multi-Agent 的优势 |
|------|-----------------|-------------------|
| 复杂任务 | 一个 Agent 承担太多角色，容易混乱 | 每个 Agent 专注一件事，职责清晰 |
| 长任务 | 上下文过长，容易遗忘 | 不同阶段交给不同 Agent |
| 多视角 | 单一视角容易遗漏 | 多个 Agent 从不同角度分析 |
| 质量控制 | 自己检查自己，容易忽略问题 | 专门的审查 Agent 独立检查 |

## 常见协作模式

### 模式一：流水线（Pipeline）

任务按顺序经过多个 Agent，每个 Agent 负责一个环节。

```
用户需求
   ↓
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ 需求分析 │ → │ 架构设计 │ → │ 代码生成 │ → │ 代码审查 │
│ Agent   │    │ Agent   │    │ Agent   │    │ Agent   │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
                                                  ↓
                                             最终输出
```

适用场景：任务有明确的阶段划分。

### 模式二：协作讨论（Discussion）

多个 Agent 围绕同一个问题讨论，互相补充和纠正。

```
        ┌─────────────┐
        │  主持人 Agent │
        └──────┬──────┘
               ↓
    ┌──────────┼──────────┐
    ↓          ↓          ↓
┌───────┐ ┌───────┐ ┌───────┐
│ 专家A │ │ 专家B │ │ 专家C │
│ 前端   │ │ 后端   │ │ 运维   │
└───┬───┘ └───┬───┘ └───┬───┘
    │         │         │
    └─────────┼─────────┘
              ↓
        汇总输出
```

适用场景：需要多领域专家意见的场景。

### 模式三：分层（Hierarchical）

一个「管理者 Agent」负责分配任务，「执行 Agent」负责具体工作。

```
用户
 ↓
┌─────────────┐
│  管理者 Agent │ ← 理解需求、分配任务、汇总结果
└──────┬──────┘
       ↓
  ┌────┼────┐
  ↓    ↓    ↓
┌───┐┌───┐┌───┐
│ A ││ B ││ C │  ← 执行具体子任务
└───┘└───┘└───┘
```

适用场景：任务需要拆解和协调。

### 模式四：辩论（Debate）

Agent 之间持有不同立场，通过辩论找到最佳方案。

```
┌──────────┐        ┌──────────┐
│ 正方 Agent │ ←辩论→ │ 反方 Agent │
└─────┬────┘        └────┬─────┘
      │                  │
      └────────┬─────────┘
               ↓
        ┌──────────┐
        │ 评委 Agent │ ← 综合双方观点，做出最终决策
        └──────────┘
```

适用场景：需要权衡利弊的决策场景。

## 框架实现

### CrewAI — 多 Agent 协作

```python
from crewai import Agent, Task, Crew, Process
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o")

# 定义 Agent
researcher = Agent(
    role="技术研究员",
    goal="深入研究给定的技术主题，收集全面的信息",
    backstory="你是一位经验丰富的技术研究员，擅长快速理解新技术并找到关键信息",
    llm=llm,
    verbose=True
)

writer = Agent(
    role="技术写作者",
    goal="将研究结果整理成清晰易懂的技术文章",
    backstory="你是一位技术博客写作者，擅长把复杂的概念讲得简单易懂",
    llm=llm,
    verbose=True
)

reviewer = Agent(
    role="技术审核员",
    goal="审核文章的准确性和可读性",
    backstory="你是一位严格的技术审核员，确保内容的准确性",
    llm=llm,
    verbose=True
)

# 定义任务
research_task = Task(
    description="研究 {topic} 的核心技术概念、应用场景和最新进展",
    agent=researcher,
    expected_output="一份结构化的研究报告，包含核心概念、应用场景、优缺点分析"
)

write_task = Task(
    description="基于研究报告，撰写一篇面向开发者的技术文章",
    agent=writer,
    expected_output="一篇结构清晰、通俗易懂的技术文章，2000字左右"
)

review_task = Task(
    description="审核文章的技术准确性和可读性，提出修改建议",
    agent=reviewer,
    expected_output="审核意见和修改后的最终版本"
)

# 组建团队
crew = Crew(
    agents=[researcher, writer, reviewer],
    tasks=[research_task, write_task, review_task],
    process=Process.sequential  # 按顺序执行
)

# 运行
result = crew.kickoff(inputs={"topic": "RAG 技术"})
print(result)
```

### AutoGen — 多 Agent 对话

```python
import autogen

# 配置 LLM
config_list = [{"model": "gpt-4o", "api_key": "your-key"}]

# 创建 Agent
planner = autogen.AssistantAgent(
    name="Planner",
    system_message="你是一个任务规划师。把用户的需求拆解为具体的子任务。",
    llm_config={"config_list": config_list}
)

coder = autogen.AssistantAgent(
    name="Coder",
    system_message="你是一个 Python 程序员。根据规划编写代码。",
    llm_config={"config_list": config_list}
)

reviewer = autogen.AssistantAgent(
    name="Reviewer",
    system_message="你是一个代码审查员。检查代码的正确性和质量。",
    llm_config={"config_list": config_list}
)

user = autogen.UserProxyAgent(
    name="User",
    human_input_mode="NEVER",
    max_consecutive_auto_reply=3
)

# 创建群聊
groupchat = autogen.GroupChat(
    agents=[user, planner, coder, reviewer],
    messages=[],
    max_round=10
)

manager = autogen.GroupChatManager(
    groupchat=groupchat,
    llm_config={"config_list": config_list}
)

# 启动对话
user.initiate_chat(
    manager,
    message="帮我写一个文本分类的 Python 脚本"
)
```

### LangGraph — 自定义流程

最灵活的方式，用图结构定义 Agent 之间的协作流程。

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
import operator

# 定义状态
class State(TypedDict):
    messages: Annotated[list, operator.add]
    current_agent: str

# 定义 Agent 节点
def researcher_node(state):
    # 研究员 Agent 的逻辑
    result = researcher_agent.run(state["messages"])
    return {"messages": [result], "current_agent": "writer"}

def writer_node(state):
    # 写作者 Agent 的逻辑
    result = writer_agent.run(state["messages"])
    return {"messages": [result], "current_agent": "reviewer"}

def reviewer_node(state):
    # 审核员 Agent 的逻辑
    result = reviewer_agent.run(state["messages"])
    return {"messages": [result], "current_agent": "end"}

# 构建图
graph = StateGraph(State)
graph.add_node("researcher", researcher_node)
graph.add_node("writer", writer_node)
graph.add_node("reviewer", reviewer_node)

graph.set_entry_point("researcher")
graph.add_edge("researcher", "writer")
graph.add_edge("writer", "reviewer")
graph.add_edge("reviewer", END)

app = graph.compile()
result = app.invoke({"messages": ["写一篇关于 RAG 的文章"]})
```

## 设计模式与最佳实践

### Agent 角色设计原则

1. **单一职责** — 每个 Agent 只做一件事
2. **明确边界** — 清晰定义每个 Agent 的输入输出
3. **避免重复** — Agent 之间不要有重叠的能力
4. **合理数量** — 2-5 个 Agent 通常就够，太多反而混乱

### 任务分配策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| 固定分配 | 预定义每个 Agent 的任务 | 流程明确 |
| 动态分配 | 管理者 Agent 根据情况分配 | 任务不确定 |
| 自由竞争 | Agent 自己认领任务 | 去中心化场景 |

### 通信设计

Agent 之间传递信息的方式：

```
共享状态 → 所有 Agent 读写同一个状态对象（推荐）
消息传递 → Agent 之间发消息
黑板模式 → 共享一个"黑板"，Agent 读写上面的信息
```

### 错误处理

```python
# 1. 设置最大轮次，防止无限循环
max_rounds = 15

# 2. Agent 输出校验
def validate_output(agent_output):
    if not agent_output or len(agent_output) < 10:
        return False
    return True

# 3. 降级策略
# 如果 Multi-Agent 失败，回退到单 Agent 模式
try:
    result = multi_agent_crew.kickoff()
except Exception:
    result = single_agent.run(task)
```

## 常见应用场景

| 场景 | Agent 分工 |
|------|-----------|
| 软件开发 | 产品经理 → 架构师 → 开发者 → 测试员 → 审查员 |
| 内容创作 | 研究员 → 写作者 → 编辑 → 校对 |
| 数据分析 | 数据采集 → 数据清洗 → 分析建模 → 报告生成 |
| 客服系统 | 意图识别 → 知识检索 → 方案生成 → 质量审核 |
| 安全审计 | 代码扫描 → 漏洞分析 → 修复建议 → 报告生成 |
