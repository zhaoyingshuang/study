# A2A 协议（Agent-to-Agent）

A2A 是 Google 于 2025 年推出的开放协议，解决**不同框架、不同平台的 Agent 之间如何协作通信**的问题。

## 为什么需要 A2A？

MCP 解决的是「Agent 连接工具」的问题。A2A 解决的是「Agent 连接 Agent」的问题。

```
MCP：Agent → 工具
A2A：Agent → Agent
```

现实场景中，不同团队、不同平台开发的 Agent 需要互相对话：

```
HR 系统的 Agent ←→ 财务系统的 Agent ←→ 项目管理系统的 Agent
   (Java 开发)        (Python 开发)        (TypeScript 开发)
```

没有 A2A：每对 Agent 之间要写专门的集成代码。
有了 A2A：所有 Agent 用统一协议通信。

## 核心概念

### 架构

```
┌──────────────┐    A2A 协议     ┌──────────────┐
│  Client Agent │ ←────────────→ │ Remote Agent │
│  (发起方)     │    HTTP/JSON    │  (服务方)     │
│              │                 │              │
│  发送任务     │                 │  处理任务     │
│  接收结果     │                 │  返回结果     │
└──────────────┘                 └──────────────┘
```

### 五个核心概念

| 概念 | 说明 |
|------|------|
| **Agent Card** | Agent 的「名片」，描述 Agent 的能力、认证方式、服务地址 |
| **A2A Server** | 接收其他 Agent 请求的 Agent（服务端角色） |
| **A2A Client** | 向其他 Agent 发送请求的 Agent（客户端角色） |
| **Task** | Agent 之间的交互单元，有生命周期 |
| **Message / Artifact** | Task 中的消息和产物 |

### Task 生命周期

```
Created → Working → Completed
                  → Failed
                  → Canceled
                  → Rejected
```

### 通信流程

```
1. Client 获取 Remote Agent 的 Agent Card（能力描述）
2. Client 发送 Task 请求
3. Remote Agent 处理 Task
4. 返回结果（Message 或 Artifact）
5. 支持 SSE 实时推送进度
```

## Agent Card

Agent 的「名片」，描述它能做什么：

```json
{
  "name": "Expense Report Agent",
  "description": "处理报销审批流程",
  "url": "https://expense-agent.example.com/a2a",
  "capabilities": {
    "streaming": true,
    "pushNotifications": true
  },
  "skills": [
    {
      "id": "process-expense",
      "name": "处理报销申请",
      "description": "审核和处理员工报销申请",
      "input": {
        "type": "object",
        "properties": {
          "amount": {"type": "number"},
          "category": {"type": "string"},
          "receipt": {"type": "string"}
        }
      }
    }
  ],
  "authentication": {
    "schemes": ["Bearer Token"]
  }
}
```

## 开发 A2A Agent

### Python 示例

```python
from a2a.server import A2AServer, TaskHandler
from a2a.types import Task, TaskStatus, Artifact

class ResearchAgent(A2AServer):
    """研究 Agent，接收研究任务并返回报告"""

    def get_agent_card(self):
        return {
            "name": "Research Agent",
            "description": "深度研究指定主题并生成报告",
            "url": "http://localhost:8000/a2a",
            "skills": [
                {
                    "id": "research",
                    "name": "主题研究",
                    "description": "对指定主题进行深度研究"
                }
            ]
        }

    async def handle_task(self, task: Task):
        # 从任务中提取用户消息
        user_message = task.messages[-1].content

        # 执行研究
        research_result = await self.do_research(user_message)

        # 返回结果
        return Artifact(
            text=research_result,
            name="research_report"
        )

# 启动服务
agent = ResearchAgent(host="0.0.0.0", port=8000)
agent.start()
```

### 客户端调用

```python
from a2a.client import A2AClient

# 连接远程 Agent
client = A2AClient("http://remote-agent:8000/a2a")

# 获取 Agent 能力
card = await client.get_agent_card()
print(f"Agent: {card.name}, Skills: {[s.name for s in card.skills]}")

# 发送任务
task = await client.send_task(
    message="请研究 RAG 技术的最新进展"
)

# 获取结果
result = await client.get_task_result(task.id)
print(result.artifact.text)
```

## A2A vs MCP

| 维度 | MCP | A2A |
|------|-----|-----|
| 解决问题 | Agent 连接工具 | Agent 连接 Agent |
| 通信方向 | Client → Server（单向） | 双向平等 |
| 协议 | JSON-RPC over Stdio/SSE | HTTP/JSON over REST |
| 发现机制 | 配置文件 | Agent Card 动态发现 |
| 适用场景 | 单 Agent 使用多个工具 | 多 Agent 跨系统协作 |

**它们是互补的：**

```
Agent A ←──A2A──→ Agent B ←──MCP──→ 数据库
   ↑                                工具
   │                                API
  MCP
   ↓
 搜索引擎
```

Agent 之间用 A2A 通信，每个 Agent 各自用 MCP 连接自己的工具。

## 实际应用场景

### 企业内部

```
员工助手 Agent
  ├─ A2A → HR Agent（请假、考勤查询）
  ├─ A2A → 财务 Agent（报销、预算查询）
  ├─ A2A → IT Agent（故障报修、权限申请）
  └─ A2A → 知识库 Agent（内部文档问答）
```

### 跨组织协作

```
公司 A 的采购 Agent ←──A2A──→ 公司 B 的销售 Agent
         ↓                           ↓
       审批流程                    库存查询
       合同生成                    报价生成
```

## 开发资源

- [A2A 官方文档](https://google.github.io/A2A/)
- [A2A GitHub](https://github.com/google/A2A)
- [A2A Python SDK](https://github.com/google/A2A/tree/main/samples/python)
- [A2A 示例](https://github.com/google/A2A/tree/main/samples)

## 总结

- **MCP** — Agent 连接工具的标准协议
- **A2A** — Agent 连接 Agent 的标准协议
- 两者互补，共同构成 Agent 互操作的基础设施
- 目前两个协议都在快速发展中，建议持续关注
