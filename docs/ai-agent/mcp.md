# MCP 协议（Model Context Protocol）

MCP 是 Anthropic 于 2024 年 11 月推出的开放协议，为 LLM 提供了一种**标准化的方式连接外部数据源和工具**。

## 为什么需要 MCP？

没有 MCP 之前，每个 LLM 应用要连接不同的工具，需要写大量集成代码：

```
你的应用 → 专门适配 GitHub
你的应用 → 专门适配数据库
你的应用 → 专门适配文件系统
你的应用 → 专门适配 Slack
... 每个工具都要写一套
```

有了 MCP：

```
你的应用 → MCP 协议 → GitHub MCP Server
                    → 数据库 MCP Server
                    → 文件系统 MCP Server
                    → Slack MCP Server
... 一套协议连接所有工具
```

类比：**MCP 就是 AI 领域的 USB 接口**——统一标准，即插即用。

## 核心概念

### 架构

```
┌─────────────┐     MCP 协议      ┌─────────────┐
│   MCP Host  │ ←───────────────→ │ MCP Server  │
│  (LLM 应用) │    JSON-RPC       │  (工具提供者) │
│  Claude/    │                   │  GitHub/     │
│  Cursor 等  │                   │  DB/File 等  │
└─────────────┘                   └─────────────┘
```

### 三个角色

| 角色 | 说明 | 示例 |
|------|------|------|
| **Host（宿主）** | 发起连接的 LLM 应用 | Claude Desktop、Cursor、IDE 插件 |
| **Client（客户端）** | Host 内部的协议客户端，与 Server 保持 1:1 连接 | Host 内置 |
| **Server（服务端）** | 提供工具和数据的服务 | GitHub MCP Server、数据库 MCP Server |

### Server 提供三种能力

1. **Tools（工具）** — LLM 可以调用的函数（如搜索代码、查询数据库）
2. **Resources（资源）** — LLM 可以读取的数据（如文件内容、API 响应）
3. **Prompts（提示模板）** — 预定义的提示模板（如代码审查模板）

## 传输方式

### Stdio（本地通信）

Server 作为子进程运行，通过标准输入/输出通信。

```json
// Claude Desktop 配置示例
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/dir"]
    }
  }
}
```

### SSE（远程通信）

通过 HTTP + Server-Sent Events 通信，适合远程服务。

```
Client → HTTP POST → Server（发送请求）
Server → SSE 流 → Client（返回结果）
```

## 开发 MCP Server

### TypeScript 实现

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// 创建 Server
const server = new McpServer({
  name: "my-tools",
  version: "1.0.0",
});

// 注册工具
server.tool(
  "get_weather",
  "获取指定城市的天气",
  { city: z.string().describe("城市名称") },
  async ({ city }) => {
    const weather = await fetchWeather(city);
    return {
      content: [{ type: "text", text: JSON.stringify(weather) }],
    };
  }
);

server.tool(
  "search_docs",
  "搜索内部文档",
  { query: z.string().describe("搜索关键词"), limit: z.number().optional() },
  async ({ query, limit = 5 }) => {
    const results = await searchDocuments(query, limit);
    return {
      content: [{ type: "text", text: JSON.stringify(results) }],
    };
  }
);

// 注册资源
server.resource(
  "config",
  "config://app",
  async (uri) => ({
    contents: [{ uri: uri.href, text: JSON.stringify(appConfig) }],
  })
);

// 启动
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Python 实现

```python
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("my-tools")

@mcp.tool()
def get_weather(city: str) -> str:
    """获取指定城市的天气"""
    weather = fetch_weather(city)
    return json.dumps(weather)

@mcp.tool()
def search_docs(query: str, limit: int = 5) -> str:
    """搜索内部文档"""
    results = search_documents(query, limit)
    return json.dumps(results)

@mcp.resource("config://app")
def get_config() -> str:
    """获取应用配置"""
    return json.dumps(app_config)
```

## 现成 MCP Server

### 官方 Server

| Server | 功能 |
|--------|------|
| `@modelcontextprotocol/server-filesystem` | 文件系统读写 |
| `@modelcontextprotocol/server-github` | GitHub API（PR、Issue、代码搜索） |
| `@modelcontextprotocol/server-postgres` | PostgreSQL 数据库查询 |
| `@modelcontextprotocol/server-sqlite` | SQLite 数据库 |
| `@modelcontextprotocol/server-brave-search` | Brave 搜索引擎 |
| `@modelcontextprotocol/server-google-maps` | Google Maps |
| `@modelcontextprotocol/server-slack` | Slack 消息和频道 |
| `@modelcontextprotocol/server-puppeteer` | 浏览器自动化 |

### 社区 Server

| Server | 功能 |
|--------|------|
| `mcp-server-fetch` | 网页抓取 |
| `mcp-server-redis` | Redis 操作 |
| `mcp-server-llamaindex` | LlamaIndex RAG |
| `mcp-server-chroma` | Chroma 向量数据库 |

## 在 Claude Desktop 中使用

编辑 `~/Library/Application Support/Claude/claude_desktop_config.json`：

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/you/projects"
      ]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token"
      ]
    },
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://localhost/mydb"
      ]
    }
  }
}
```

配置后重启 Claude Desktop，即可在对话中使用这些工具。

## MCP vs 传统 Function Calling

| 维度 | Function Calling | MCP |
|------|-----------------|-----|
| 集成方式 | 每个工具手写代码 | 标准协议，即插即用 |
| 可复用性 | 绑定特定应用 | 跨应用通用 |
| 工具发现 | 手动管理 | 自动发现 |
| 生态 | 各自为政 | 统一生态 |
| 适用场景 | 简单工具、快速原型 | 多工具、生产系统 |

**建议：** 如果只是简单用几个工具，Function Calling 够用。如果工具多、需要复用、或者想用现成的社区工具，MCP 是更好的选择。

## MCP 开发资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [MCP 规范](https://spec.modelcontextprotocol.io/)
- [MCP Server 仓库](https://github.com/modelcontextprotocol/servers)
- [MCP Python SDK](https://github.com/modelcontextprotocol/python-sdk)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
