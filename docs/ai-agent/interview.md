# 面试专题

AI Agent 开发相关的常见面试题和回答思路。

## 基础概念

### Q1：什么是 AI Agent？和普通 LLM 对话有什么区别？

**参考回答：**

AI Agent 是能够自主感知环境、做出决策、执行动作的 AI 系统。和普通 LLM 对话的核心区别在于：

1. **自主性**：普通对话是被动回答，Agent 能自主规划任务步骤
2. **工具使用**：Agent 能调用外部 API、数据库、搜索引擎等工具
3. **循环执行**：Agent 是推理→行动→观察的循环，不只是单轮回答
4. **记忆**：Agent 有短期和长期记忆，能维持上下文

举例：用户问"北京天气"，普通 LLM 可能编造一个答案，而 Agent 会调用天气 API 获取真实数据再回答。

---

### Q2：什么是 Function Calling？它的工作原理是什么？

**参考回答：**

Function Calling 是让 LLM 能够调用外部工具的机制。工作流程：

1. 开发者定义工具的名称、描述和参数（JSON Schema）
2. LLM 根据用户问题判断是否需要调用工具
3. 如果需要，LLM 输出结构化的函数调用请求（函数名 + 参数）
4. 应用层执行实际函数，将结果返回给 LLM
5. LLM 根据结果生成最终回答

关键点：**LLM 本身不执行函数**，它只是输出调用意图，执行由应用层完成。这是一个常见的误解点。

---

### Q3：什么是 RAG？为什么需要它？

**参考回答：**

RAG（检索增强生成）是一种让 LLM 访问外部知识库的技术。需要它的原因：

1. **知识过时**：LLM 的训练数据有截止日期，无法获取最新信息
2. **缺乏私有数据**：LLM 不知道企业内部知识
3. **减少幻觉**：基于检索到的事实回答，降低编造概率
4. **成本更低**：不需要为每条知识微调模型

基本流程：文档分块 → Embedding 向量化 → 存入向量数据库 → 用户提问时检索相关片段 → 连同问题一起送给 LLM 生成回答。

---

## 架构设计

### Q4：Workflow 和 Agent 分别适合什么场景？

**参考回答：**

**Workflow 适合：**
- 任务步骤明确、可预定义
- 对可预测性要求高（如金融、医疗）
- 需要精确控制流程和成本
- 示例：客服路由、报告生成流水线

**Agent 适合：**
- 任务步骤不确定，需要根据中间结果做决策
- 开放性、探索性任务
- 示例：研究分析、编程、复杂调试

**实际项目中通常是混合使用**：外层 Workflow 控制流程，核心环节用 Agent。

---

### Q5：如何设计一个 Multi-Agent 系统？

**参考回答：**

设计步骤：

1. **明确任务需求** — 任务是否需要多角色协作？
2. **角色拆分** — 按单一职责原则拆分 Agent，每个 Agent 只做一件事
3. **选择协作模式** — 流水线 / 讨论 / 分层 / 辩论
4. **定义通信协议** — Agent 之间如何传递信息（共享状态 / 消息传递）
5. **错误处理** — 设置最大轮次、超时、降级策略

常见坑：
- Agent 太多反而混乱（建议 2-5 个）
- Agent 职责重叠导致重复工作
- 没有设置轮次限制导致无限循环

---

### Q6：如何处理 Agent 的记忆？

**参考回答：**

分层处理：

1. **短期记忆**（对话历史）— 滑动窗口保留最近 N 轮，超出的做摘要压缩
2. **长期记忆**（向量数据库）— 对话结束后提取关键信息存入向量库，下次对话时检索相关记忆注入上下文
3. **工作记忆**（任务状态）— 用变量/Scratchpad 存储当前任务的中间状态

核心挑战是 **token 预算管理**：记忆太多会超限，太少会丢失关键信息。常用策略是摘要压缩 + 重要性评分。

---

## 技术深入

### Q7：RAG 的检索效果不好，怎么优化？

**参考回答：**

按优先级排列：

1. **换 Embedding 模型** — 中文场景用 BGE 系列，效果提升最直接
2. **优化分块** — 调整 chunk_size（中文 300-500），使用语义分块而非固定切分
3. **查询改写** — 让 LLM 改写用户查询为更适合检索的形式
4. **换检索方式** — 从相似度检索改为 MMR（兼顾多样性）
5. **加 Reranking** — 多检索一些结果，用 Cross-Encoder 精排
6. **混合检索** — 结合向量检索和关键词检索
7. **Agentic RAG** — 让 Agent 自主决定检索策略，多次迭代检索

---

### Q8：MCP 是什么？解决了什么问题？

**参考回答：**

MCP（Model Context Protocol）是 Anthropic 推出的开放协议，解决了 Agent 连接工具的标准化问题。

没有 MCP：每个应用连接不同工具要写专门的集成代码。
有了 MCP：一套协议连接所有工具，类似 USB 接口的统一标准。

核心概念：
- **Host**：发起连接的 LLM 应用（如 Claude Desktop）
- **Server**：提供工具的服务（如 GitHub MCP Server）
- **Client**：Host 内的协议客户端

MCP 解决工具连接（Agent → 工具），A2A 解决 Agent 连接（Agent → Agent），两者互补。

---

### Q9：如何评估 Agent 的效果？

**参考回答：**

四层评估体系：

1. **组件测试** — 单个工具、Prompt 是否正确（单元测试）
2. **集成测试** — Agent 循环是否正常（Golden Path 测试）
3. **端到端测试** — 完整任务是否达标（LLM-as-Judge）
4. **人工评估** — 最终用户体验（人工抽检）

关键指标：准确性、相关性、忠实度、工具调用正确率、Token 消耗、响应延迟。

工具：Ragas（RAG 评估）、LangSmith（全链路追踪）、Deepeval（综合评估）。

---

### Q10：如何保证 Agent 的安全性？

**参考回答：**

主要防御方向：

1. **Prompt 注入防御** — 输入过滤 + 外部数据标记为不可信 + System Prompt 安全规则
2. **工具安全** — 白名单机制 + 参数校验 + 敏感操作确认 + 沙箱执行
3. **数据保护** — 敏感数据脱敏 + 最小权限 + 审计日志
4. **输出控制** — 质量检查 + 事实性验证

最重要的是**分层防御**：不能只靠一层防御，要输入过滤、工具限制、输出检查多层配合。

---

## 编码实践

### Q11：手写一个简单的 Agent 循环

```python
import anthropic
import json

client = anthropic.Anthropic()
tools = [{"name": "calculator", "description": "计算数学表达式",
          "input_schema": {"type": "object", "properties":
            {"expr": {"type": "string"}}, "required": ["expr"]}}]

def calculator(expr):
    return str(eval(expr))

messages = [{"role": "user", "content": "算一下 (15+27)*3"}]

while True:
    resp = client.messages.create(model="claude-sonnet-4-20250514",
        max_tokens=1024, tools=tools, messages=messages)
    messages.append({"role": "assistant", "content": resp.content})

    if resp.stop_reason == "tool_use":
        for b in resp.content:
            if b.type == "tool_use":
                result = calculator(**b.input)
                messages.append({"role": "user", "content": [
                    {"type": "tool_result", "tool_use_id": b.id,
                     "content": result}]})
    else:
        print([b.text for b in resp.content if b.type == "text"][0])
        break
```

---

### Q12：如何优化 Agent 的成本？

1. **Prompt Caching** — 缓存不变的 System Prompt，重复调用不重复计费
2. **模型分层** — 简单任务用小模型（Haiku），复杂任务用大模型
3. **对话历史压缩** — 摘要早期对话，减少 token 消耗
4. **缓存常见问题** — Redis 缓存，相同问题直接返回
5. **限制工具数量** — 每次只传相关工具的定义
6. **混合架构** — 简单任务用本地小模型（免费），复杂任务才调云端

---

## 系统设计

### Q13：设计一个智能客服系统

**要点：**
- Routing 模式：意图分类 → 分发到不同处理分支
- RAG：接入产品知识库和 FAQ
- 工具：查询订单、查物流、创建工单
- 安全：敏感操作确认、数据脱敏
- 降级：简单问题用模板回答，复杂问题转人工
- 可观测性：全链路追踪、成本监控

### Q14：设计一个企业知识库问答系统

**要点：**
- 文档处理管道：多格式加载 → 分块 → Embedding → 向量存储
- Agentic RAG：查询改写 + 迭代检索 + 质量评估
- 权限控制：不同部门访问不同知识库
- 来源追溯：回答中标注出处
- 评估：用 Ragas 自动评估检索和回答质量
