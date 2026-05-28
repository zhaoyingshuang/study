# 开源项目源码解读

通过阅读优秀开源项目的源码和架构，可以深入理解 Agent 系统的设计思路。这里挑选了几个经典项目进行拆解。

## MetaGPT — 多 Agent 软件团队

### 项目简介

MetaGPT 模拟一个完整的软件开发团队：产品经理、架构师、工程师、QA，通过多 Agent 协作完成软件开发任务。

**GitHub：** https://github.com/geekan/MetaGPT

### 核心架构

```
用户输入需求
  ↓
┌──────────┐
│ ProductManager │ → 输出 PRD（产品需求文档）
└──────┬───┘
       ↓
┌──────────┐
│ Architect │ → 输出系统设计
└──────┬───┘
       ↓
┌──────────┐
│ Engineer  │ → 输出代码
└──────┬───┘
       ↓
┌──────────┐
│ QaEngineer │ → 输出测试报告
└──────────┘
```

### 关键设计

**1. 角色定义**

每个 Agent 有明确的角色、目标和约束：

```python
class ProductManager(Role):
    name: str = "Alice"
    profile: str = "Product Manager"

    async def _act(self) -> Message:
        # 接收需求，输出 PRD
        prompt = self._make_prompt(requirement)
        prd = await self.llm.aask(prompt)
        return Message(content=prd, role=self.profile)
```

**2. 消息传递**

Agent 之间通过消息通信：

```python
class Message:
    content: str           # 消息内容
    role: str              # 发送者角色
    cause_by: Type[Action] # 由什么动作产生
    sent_from: str         # 发送者
    send_to: str           # 接收者
```

**3. 动作抽象**

每个 Agent 的能力抽象为 Action：

```python
class Action:
    name: str = ""

    async def run(self, *args, **kwargs):
        raise NotImplementedError

class WritePRD(Action):
    name: str = "WritePRD"

    async def run(self, requirements: str) -> str:
        prompt = f"根据以下需求写 PRD：{requirements}"
        return await self.llm.aask(prompt)
```

**4. 环境调度**

Environment 负责管理所有 Agent 的生命周期和消息路由：

```python
class Environment:
    roles: dict[str, Role]

    async def run(self, message: Message):
        # 按拓扑顺序执行
        for role in self.roles.values():
            if role._watch(message.cause_by):
                await role._act()
```

### 学习要点

- **消息驱动架构** — Agent 之间通过消息解耦
- **标准化输出** — 每个角色输出结构化文档（PRD、设计文档、代码）
- **流水线模式** — 上游输出是下游输入

---

## Dify — LLM 应用开发平台

### 项目简介

Dify 是一个开源的 LLM 应用开发平台，提供可视化编排、RAG 管道、Agent 能力。

**GitHub：** https://github.com/langgenius/dify

### 技术栈

```
前端：React + Next.js
后端：Python + Flask
数据库：PostgreSQL + Redis
向量库：Weaviate / Qdrant / Chroma 等
部署：Docker Compose
```

### 核心架构

```
┌─────────────┐
│   Web UI    │ ← 可视化编排界面
└──────┬──────┘
       ↓
┌─────────────┐
│  API Layer  │ ← RESTful API
└──────┬──────┘
       ↓
┌─────────────────────────────────┐
│           Core Engine           │
│  ┌──────┐ ┌──────┐ ┌────────┐ │
│  │ Agent│ │ RAG  │ │ Workflow│ │
│  │Engine│ │Engine│ │ Engine │ │
│  └──────┘ └──────┘ └────────┘ │
│  ┌──────┐ ┌──────┐ ┌────────┐ │
│  │Model │ │Tool  │ │ Prompt │ │
│  │Manager│ │Manager│ │Manager│ │
│  └──────┘ └──────┘ └────────┘ │
└─────────────────────────────────┘
       ↓
┌─────────────────────────────────┐
│         Data Layer              │
│  PostgreSQL │ Redis │ Vector DB │
└─────────────────────────────────┘
```

### 关键模块

**1. 模型管理**

统一管理多家 LLM 提供商：

```python
class ModelProviderFactory:
    providers = {
        "openai": OpenAIProvider,
        "anthropic": AnthropicProvider,
        "zhipuai": ZhipuAIProvider,
    }

    def get_provider(self, provider_name: str):
        return self.providers[provider_name]()
```

**2. 工具管理**

统一管理内置和自定义工具：

```python
class ToolManager:
    built_in_tools = {
        "web_search": WebSearchTool,
        "weather": WeatherTool,
        "wikipedia": WikipediaTool,
    }

    def get_tool(self, tool_name: str):
        if tool_name in self.built_in_tools:
            return self.built_in_tools[tool_name]()
        return self.load_custom_tool(tool_name)
```

**3. RAG 管道**

完整的文档处理和检索管道：

```python
class RAGPipeline:
    def process_document(self, file):
        # 加载 → 分块 → 清洗 → Embedding → 存储
        docs = self.loader.load(file)
        chunks = self.splitter.split(docs)
        embeddings = self.embedder.embed(chunks)
        self.vector_store.add(embeddings)

    def retrieve(self, query, top_k=3):
        return self.vector_store.search(query, top_k)
```

**4. Workflow 引擎**

可视化工作流编排：

```python
class WorkflowEngine:
    def run(self, workflow_config: dict, inputs: dict):
        # 解析节点
        nodes = self.parse_nodes(workflow_config)
        # 按依赖关系执行
        for node in topological_sort(nodes):
            inputs = node.execute(inputs)
        return inputs
```

### 学习要点

- **平台化思维** — 不只是做一个 Agent，而是做 Agent 开发平台
- **插件架构** — 模型、工具、数据源都是可插拔的
- **多租户设计** — 支持多用户、多应用
- **可视化编排** — 降低使用门槛

---

## OpenHands — AI 编程 Agent

### 项目简介

OpenHands（前身 OpenDevin）是一个 AI 编程 Agent，能自主完成编码任务。

**GitHub：** https://github.com/All-Hands-AI/OpenHands

### 核心架构

```
┌──────────┐
│  用户界面  │ ← Web IDE
└────┬─────┘
     ↓
┌──────────┐
│ Controller│ ← 任务调度
└────┬─────┘
     ↓
┌──────────┐     ┌──────────┐
│  Agent   │ ←─→ │ Sandbox  │
│  (LLM)   │     │ (Docker) │
└──────────┘     └──────────┘
```

### 关键设计

**1. 沙箱隔离**

代码执行在 Docker 容器中，安全隔离：

```python
class DockerSandbox:
    def execute(self, command: str) -> CommandResult:
        container = self.client.containers.run(
            image="openhands-sandbox",
            command=command,
            mem_limit="2g",
            network_mode="none",
            detach=True
        )
        result = container.wait()
        output = container.logs()
        container.remove()
        return CommandResult(output=output, exit_code=result["StatusCode"])
```

**2. 文件操作**

Agent 通过工具读写文件：

```python
class FileEditTool:
    def read(self, path: str) -> str:
        return self.sandbox.execute(f"cat {path}")

    def write(self, path: str, content: str):
        self.sandbox.execute(f"cat > {path} << 'EOF'\n{content}\nEOF")

    def edit(self, path: str, old: str, new: str):
        # 精确替换，而不是重写整个文件
        content = self.read(path)
        new_content = content.replace(old, new)
        self.write(path, new_content)
```

**3. Agent 循环**

```python
class CodeAgent:
    async def run(self, task: str):
        while True:
            # 获取上下文
            context = self.build_context()

            # LLM 决策
            action = await self.llm.decide(context, available_actions)

            # 执行动作
            if action.type == "run_command":
                result = self.sandbox.execute(action.command)
            elif action.type == "edit_file":
                result = self.file_tool.edit(action.path, action.old, action.new)
            elif action.type == "read_file":
                result = self.file_tool.read(action.path)
            elif action.type == "finish":
                return action.message

            # 记录到上下文
            self.history.append(ActionResult(action=action, result=result))
```

### 学习要点

- **沙箱化执行** — 安全地执行代码
- **精确文件编辑** — diff 式修改，不是重写
- **上下文窗口管理** — 项目文件可能很大，智能选择上下文
- **Action 抽象** — 将所有操作抽象为统一的 Action 接口

---

## 如何阅读源码

### 方法论

1. **先跑起来** — 先把项目跑起来，了解基本功能
2. **读文档** — 官方文档和架构设计文档
3. **找入口** — 从 main / app 入口开始，顺藤摸瓜
4. **画架构图** — 边读边画，理清模块关系
5. **调试验证** — 加 print / 断点，理解运行流程
6. **关注核心** — 不要陷入细节，先理解主干

### 推荐阅读顺序

```
MetaGPT：
  metagpt/roles/        → 角色定义
  metagpt/actions/      → 动作定义
  metagpt/environment/  → 环境调度
  metagpt/schema.py     → 数据结构

Dify：
  api/core/agent/       → Agent 引擎
  api/core/rag/         → RAG 管道
  api/core/model_runtime/ → 模型管理
  api/core/tools/       → 工具管理

OpenHands：
  agent/                → Agent 核心
  runtime/              → 沙箱运行时
  controller/           → 任务控制
```
