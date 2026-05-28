# Agent 设计模式

经过大量实践，社区总结出了一些经典的 Agent 设计模式。理解这些模式，能帮助你设计出更好的 Agent 系统。

## 模式总览

```
按复杂度递进：

1. Augmented LLM（增强型 LLM）
2. Prompt Chaining（提示链）
3. Routing（路由）
4. Parallelization（并行化）
5. Orchestrator-Worker（编排者-执行者）
6. Evaluator-Optimizer（评估-优化器）
7. ReAct Agent（推理-行动循环）
8. Multi-Agent（多智能体协作）
```

## 模式详解

### 1. Augmented LLM（增强型 LLM）

最基础的模式——给 LLM 加上工具和检索能力。

```
用户 → LLM + Tools + RAG → 回答
```

适用：简单问答、单步任务。

### 2. Prompt Chaining（提示链）

将复杂任务拆成多个步骤，每步由一个 LLM 调用处理。

```
步骤1            步骤2            步骤3
提取关键信息 → 生成大纲 →  撰写完整文章
```

**适用场景：**
- 任务有明确的阶段
- 每个阶段可以用不同的 Prompt 优化
- 中间需要人工检查点

**示例：报告生成**

```python
def generate_report(topic: str):
    # 步骤1：收集信息
    research = llm.invoke(f"研究 {topic} 的关键要点")

    # 步骤2：生成大纲
    outline = llm.invoke(f"基于以下信息生成报告大纲：{research}")

    # 步骤3：撰写正文
    report = llm.invoke(f"基于以下大纲撰写报告：{outline}")

    # 步骤4：格式化输出
    formatted = llm.invoke(f"将以下报告格式化为 Markdown：{report}")

    return formatted
```

**优化点：**
- 每个步骤可以独立调试和优化
- 可以在步骤之间加入校验逻辑
- 不同步骤可以用不同模型（省钱）

### 3. Routing（路由）

根据输入类型，分发到不同的处理流程。

```
        ┌→ 售前客服 Agent
输入 → 分类器 → 技术支持 Agent
        └→ 投诉处理 Agent
```

**适用场景：**
- 不同类型任务需要不同处理方式
- 需要专门的 Prompt 处理特定类型

**示例：客服路由**

```python
def route_customer_service(user_message: str):
    # 分类
    category = llm.invoke(f"""
    请分类以下用户消息的类别：
    A. 售前咨询（产品功能、价格）
    B. 技术支持（使用问题、故障）
    C. 投诉（不满、退款）
    D. 闲聊

    用户消息：{user_message}
    只回答字母。
    """)

    # 路由
    handlers = {
        "A": presales_handler,
        "B": tech_support_handler,
        "C": complaint_handler,
        "D": chitchat_handler,
    }

    handler = handlers.get(category.strip(), default_handler)
    return handler(user_message)
```

### 4. Parallelization（并行化）

多个 LLM 同时处理，结果汇总。

```
          ┌→ 审查安全性
输入 → 并行 → 审查性能  → 汇总
          └→ 审查风格
```

**适用场景：**
- 需要多维度分析
- 多个视角可以提高准确率（投票机制）

**两种变体：**

**分块并行：** 大任务切分成小块并行处理。

```python
import asyncio

async def summarize_long_document(document: str, chunk_size=2000):
    # 切分
    chunks = [document[i:i+chunk_size] for i in range(0, len(document), chunk_size)]

    # 并行摘要
    summaries = await asyncio.gather(*[
        llm.ainvoke(f"摘要以下内容：{chunk}")
        for chunk in chunks
    ])

    # 合并
    final = await llm.ainvoke(f"合并以下摘要为一个完整摘要：{summaries}")
    return final
```

**投票并行：** 多次生成，取最好的结果。

```python
async def generate_with_voting(prompt: str, n=3):
    results = await asyncio.gather(*[
        llm.ainvoke(prompt, temperature=0.7)
        for _ in range(n)
    ])

    # 用 LLM 选最好的
    best = await llm.ainvoke(f"从以下{n}个结果中选出最好的一个：\n" +
                             "\n---\n".join(results))
    return best
```

### 5. Orchestrator-Worker（编排者-执行者）

一个 LLM 负责规划，多个 LLM 执行子任务。

```
用户需求 → 编排者（规划3个子任务）
              ├→ Worker 1 → 结果1
              ├→ Worker 2 → 结果2
              └→ Worker 3 → 结果3
              ↓
           编排者（合成最终结果）
```

**适用场景：**
- 任务可以拆解为独立子任务
- 子任务之间互不依赖

**示例：代码审查**

```python
async def code_review(code: str):
    # 编排者：规划审查维度
    plan = await llm.ainvoke(f"""
    对以下代码进行审查，规划审查维度：
    {code}

    输出审查维度列表（JSON数组）。
    """)

    dimensions = json.loads(plan)

    # 并行执行各维度审查
    reviews = await asyncio.gather(*[
        llm.ainvoke(f"从'{dim}'角度审查以下代码：\n{code}")
        for dim in dimensions
    ])

    # 合成最终报告
    report = await llm.ainvoke(f"""
    综合以下审查意见，生成最终代码审查报告：
    {json.dumps(reviews, ensure_ascii=False)}
    """)

    return report
```

### 6. Evaluator-Optimizer（评估-优化）

生成 → 评估 → 反馈 → 改进的循环。

```
需求 → 生成初版 → 评估 → 反馈 → 修改 → 评估 → ... → 最终版
```

**适用场景：**
- 有明确质量标准
- 一次生成难以达标
- 需要反复打磨

**示例：翻译优化**

```python
def translate_with_refinement(text: str, max_rounds=3):
    translation = llm.invoke(f"将以下英文翻译为中文：{text}")

    for _ in range(max_rounds):
        # 评估
        evaluation = llm.invoke(f"""
        请评估以下翻译的质量，满分10分：

        原文：{text}
        翻译：{translation}

        评分标准：
        - 准确性（忠实原文）
        - 流畅性（中文表达自然）
        - 完整性（没有遗漏）

        输出格式：
        评分：X/10
        问题：[具体问题列表]
        建议：[改进建议]
        """)

        score = extract_score(evaluation)
        if score >= 8:
            break

        # 根据反馈改进
        translation = llm.invoke(f"""
        根据以下反馈改进翻译：

        当前翻译：{translation}
        评估反馈：{evaluation}

        请输出改进后的翻译。
        """)

    return translation
```

### 7. ReAct Agent（推理-行动循环）

Agent 经典模式——推理和行动交替进行。

```
问题 → 思考 → 行动（工具调用）→ 观察 → 思考 → 行动 → ... → 回答
```

**适用场景：**
- 任务步骤不确定
- 需要根据中间结果调整策略
- Agent 的核心模式

### 8. Multi-Agent（多智能体协作）

多个 Agent 各司其职，协同完成复杂任务。

```
用户 → 管理者 Agent
         ├→ 研究 Agent → 结果
         ├→ 写作 Agent → 结果
         └→ 审查 Agent → 结果
         ↓
       最终输出
```

## 模式选择指南

```
你的任务是什么？
│
├─ 单步任务 → Augmented LLM
│
├─ 多步任务，步骤确定
│   ├─ 串行依赖 → Prompt Chaining
│   ├─ 需要分类 → Routing
│   └─ 独立子任务 → Parallelization
│
├─ 多步任务，需要拆解 → Orchestrator-Worker
│
├─ 需要迭代优化 → Evaluator-Optimizer
│
├─ 步骤不确定，需要自主决策 → ReAct Agent
│
└─ 多角色协作 → Multi-Agent
```

## 组合使用

实际项目中，通常是多个模式组合：

```
客服系统 = Routing + ReAct + Evaluator-Optimizer
  ├── Routing：分类用户意图
  ├── ReAct Agent：处理具体问题
  └── Evaluator：检查回答质量

报告系统 = Prompt Chaining + Parallelization + Evaluator-Optimizer
  ├── Prompt Chaining：收集→大纲→撰写→排版
  ├── Parallelization：多个维度同时研究
  └── Evaluator-Optimizer：迭代优化报告质量
```

## 参考

- [Building effective agents — Anthropic](https://docs.anthropic.com/en/docs/build-with-claude/agent-patterns)
- [LangGraph Design Patterns](https://langchain-ai.github.io/langgraph/concepts/agentic_concepts/)
- [A Survey on Large Language Model based Autonomous Agents](https://arxiv.org/abs/2308.11432)
