# FAQ 常见问题

## 基础概念

### Q：Agent 和 Chatbot 有什么区别？

Chatbot 是被动回答问题，Agent 能主动规划、调用工具、根据反馈调整策略。关键区别是 Agent 有**自主行动能力**。

### Q：Agent 和 Workflow 有什么区别？

Workflow 是预定义的固定流程，Agent 是 LLM 自主决定流程。Workflow 可预测但死板，Agent 灵活但不可控。详见 [Workflow vs Agent](/ai-agent/workflow-vs-agent)。

### Q：学 Agent 开发需要什么基础？

- Python 基础（必须）
- API 调用经验（必须）
- LLM 基本概念（推荐）
- Web 开发经验（加分）

### Q：一定要用 LangChain 吗？

不是必须的。简单的 Agent 直接用 OpenAI / Anthropic SDK 就能实现。LangChain 提供了便利的抽象，但也增加了复杂度。建议先理解原理，再选择框架。

## 技术选型

### Q：用 Claude 还是 GPT？

| 维度 | Claude | GPT |
|------|--------|-----|
| 指令遵循 | 更好 | 好 |
| 长上下文 | 200K | 128K |
| 工具调用 | 好 | 好 |
| 中文 | 好 | 好 |
| 价格 | 中等 | 中等 |

两者差距不大，建议都试用后选择。实际项目中，混合使用也是常见做法。

### Q：向量数据库怎么选？

- **开发阶段：** Chroma（最简单）
- **数据量小：** FAISS（最快）
- **生产环境：** Milvus / Qdrant
- **已有 PostgreSQL：** pgvector
- **不想运维：** Pinecone

### Q：国产模型能做 Agent 吗？

可以。DeepSeek-V3、GLM-4、Qwen-Plus 都支持 Function Calling，可以开发 Agent。详见 [国产模型适配](/ai-agent/chinese-llm)。

## 开发问题

### Q：Agent 总是不调用工具怎么办？

1. 检查工具的 `description` 是否清晰
2. 在 System Prompt 中明确指示使用工具
3. 降低 temperature（0-0.3）
4. 确认模型是否支持 Function Calling

### Q：Agent 陷入无限循环怎么办？

1. 设置最大轮次限制（如 10 次）
2. 在 Prompt 中限制重复调用同一工具
3. 检测重复的 tool_call 并终止
4. 记录每轮状态，发现循环就中断

### Q：RAG 检索结果不相关怎么办？

1. 检查分块大小是否合适
2. 换更好的 Embedding 模型（中文用 BGE）
3. 尝试查询改写
4. 加 Reranking
5. 调整检索数量 k 和相似度阈值

### Q：Agent 回答出现幻觉怎么办？

1. 在 Prompt 中强调"基于事实回答，不确定的说不知道"
2. 使用 RAG 提供真实数据
3. 让 Agent 引用来源
4. 加 Evaluator 检查输出

### Q：成本太高怎么办？

1. 使用 Prompt Caching
2. 简单任务用小模型（Haiku / Mini）
3. 缓存常见问题
4. 控制对话历史长度
5. 考虑本地小模型处理简单任务

## 部署问题

### Q：Agent 可以私有化部署吗？

可以。方案：
1. 用开源模型（DeepSeek / Qwen）+ Ollama / vLLM 本地运行
2. 向量数据库自部署（Milvus / Chroma）
3. 应用层 Docker 部署

### Q：如何保证 Agent 的安全性？

- 对用户输入做过滤
- 工具白名单 + 参数校验
- 敏感操作需要确认
- 限制文件/网络访问权限
- 定期做红队测试

详见 [Agent 安全](/ai-agent/security)。

### Q：Agent 响应太慢怎么办？

1. 使用流式输出
2. 简单任务用小模型
3. 减少工具调用的数量
4. 优化 Prompt，减少 token 消耗
5. 使用 Prompt Caching

## 学习路径

### Q：从哪里开始学？

推荐顺序：
1. 先学会用 LLM API（Claude / GPT）
2. 理解 Function Calling
3. 手写一个简单的 Agent 循环
4. 学习 RAG
5. 尝试 Agent 框架（LangChain / LangGraph）
6. 做一个完整项目

### Q：有哪些好的学习资源？

详见 [学习资源](/ai-agent/resources) 页面，包含必读文章、视频课程和开源项目。

### Q：学多久能做出一个 Agent？

- 基础 Agent（能调工具）：1-2 周
- RAG Agent：2-3 周
- 完整项目（含部署）：1-2 个月
