# Workflow vs Agent

构建 LLM 应用时，最关键的架构决策：**用 Workflow（工作流）还是 Agent（智能体）？**

这个话题 Anthropic 官方有一篇很经典的指南：[Building effective agents](https://docs.anthropic.com/en/docs/build-with-claude/agent-patterns)，下面基于此整理。

## 核心区别

| 维度 | Workflow（工作流） | Agent（智能体） |
|------|-------------------|----------------|
| 流程 | 预定义的固定流程 | LLM 自主决定流程 |
| 灵活性 | 低，按设计执行 | 高，根据情况调整 |
| 可预测性 | 高，结果可控 | 低，可能有意外行为 |
| 调试难度 | 简单，流程透明 | 较难，行为不确定 |
| 适用场景 | 流程明确的任务 | 开放性、探索性任务 |
| 成本 | 可控 | 较难控制（LLM 调用次数不确定） |

**简单说：Workflow 是「按剧本走」，Agent 是「即兴发挥」。**

## 什么时候用 Workflow？

**判断标准：** 任务步骤明确、不需要 LLM 做路由决策。

### 常见 Workflow 模式

**1. Prompt Chaining（提示链）**

把任务拆成固定步骤，每步的输出作为下一步的输入。

```
用户输入 → LLM 提取关键信息 → LLM 生成摘要 → LLM 翻译 → 输出
```

适用：每步可以用不同的 Prompt/模型，中间可以加校验。

**2. Routing（路由）**

根据输入类型分发到不同的处理流程。

```
用户输入 → LLM 分类 → 售前客服分支
                    → 技术支持分支
                    → 投诉处理分支
```

适用：不同类型任务需要不同处理方式。

**3. Parallelization（并行）**

多个 LLM 同时处理同一输入，结果汇总。

```
用户输入 → LLM 代码审查 ──┐
        → LLM 安全审查 ──┼→ 汇总 → 输出
        → LLM 风格审查 ──┘
```

适用：需要多维度分析。

**4. Orchestrator-Worker（编排者-执行者）**

一个 LLM 负责拆解任务，多个 LLM 并行执行子任务。

```
用户输入 → 编排 LLM（拆解为3个子任务）
              ↓
          ┌───┼───┐
          ↓   ↓   ↓
         子1  子2  子3  ← LLM 分别执行
          ↓   ↓   ↓
          └───┼───┘
              ↓
         编排 LLM（合并结果）→ 输出
```

适用：任务可以拆解为独立子任务。

**5. Evaluator-Optimizer（评估-优化）**

一个 LLM 生成，另一个 LLM 评估反馈，循环优化。

```
用户输入 → LLM 生成初版 → LLM 评估
              ↑              ↓
              └──── 反馈 ←───┘
                           ↓（满意后）
                        最终输出
```

适用：有明确质量标准的任务（如翻译、写作）。

## 什么时候用 Agent？

**判断标准：** 任务开放、步骤不确定、需要根据中间结果做决策。

### Agent 适用场景

- **研究任务** — 不知道需要搜索多少次、查什么
- **开放式编程** — 不确定需要修改哪些文件
- **数据分析** — 需要根据数据发现决定下一步分析什么
- **复杂调试** — 需要根据报错信息动态调整排查方向

### Workflow 和 Agent 的混合使用

大多数生产系统是**两者结合**：

```
外部请求
   ↓
Workflow（路由 + 预处理）
   ↓
Agent（核心任务处理）
   ↓
Workflow（后处理 + 校验 + 输出）
```

**示例：智能客服系统**

```
用户消息
   ↓
[Workflow] 意图分类 → 简单问题走 FAQ 模板
                    → 复杂问题交给 Agent
                         ↓
                    [Agent] 自主使用工具查询
                         ↓
                    [Workflow] 质量检查 → 输出/转人工
```

## 决策树

```
任务步骤是否明确？
├── 是 → 用 Workflow
│        ├── 单步骤 → 直接 LLM 调用
│        ├── 多步骤串行 → Prompt Chaining
│        ├── 多步骤并行 → Parallelization
│        └── 需要分类 → Routing
│
└── 否 → 考虑 Agent
         ├── 是否允许 LLM 自主决策？
         │   ├── 是 → 用 Agent
         │   │       ├── 简单工具调用 → 基础 Agent
         │   │       └── 复杂多步 → ReAct Agent
         │   └── 否 → 用 Workflow 模拟
         │              └── Orchestrator-Worker
         │
         └── 部分明确，部分不明确 → 混合方案
```

## 最佳实践

1. **从 Workflow 开始** — 能用 Workflow 解决的不要用 Agent
2. **渐进式升级** — 先 Workflow，不够用再加 Agent
3. **控制 Agent 的自由度** — 限制工具数量、设置最大步数
4. **混合使用** — 外层 Workflow 控制流程，核心环节用 Agent
5. **充分测试** — Agent 的不确定行为需要更多测试覆盖
6. **监控成本** — Agent 的 LLM 调用次数不确定，要设置上限

## 参考

- [Building effective agents — Anthropic](https://docs.anthropic.com/en/docs/build-with-claude/agent-patterns)
- [Workflow vs Agent 讨论](https://www.anthropic.com/research/building-effective-agents)
