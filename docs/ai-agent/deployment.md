# 部署与生产化

将 Agent 从本地开发环境迁移到生产环境，需要考虑性能、成本、可靠性等问题。

## 部署架构

### 基础架构

```
                    ┌─────────┐
                    │ CDN/Nginx│
                    └────┬────┘
                         ↓
                    ┌─────────┐
                    │ API 网关 │ ← 认证、限流、路由
                    └────┬────┘
                         ↓
              ┌──────────┼──────────┐
              ↓          ↓          ↓
         ┌────────┐ ┌────────┐ ┌────────┐
         │Agent A │ │Agent B │ │Agent C │
         │服务实例│ │服务实例│ │服务实例│
         └───┬────┘ └───┬────┘ └───┬────┘
             └──────────┼──────────┘
                        ↓
              ┌─────────┼──────────┐
              ↓         ↓          ↓
         ┌────────┐ ┌────────┐ ┌─────────┐
         │ 向量DB │ │ 关系DB │ │ Redis   │
         │ Chroma │ │ PG     │ │ 缓存    │
         └────────┘ └────────┘ └─────────┘
```

### API 服务

用 FastAPI 将 Agent 包装成 API 服务。

```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uuid

app = FastAPI()

class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None

class ChatResponse(BaseModel):
    reply: str
    session_id: str
    tokens_used: int

# 会话管理
sessions = {}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    session_id = request.session_id or str(uuid.uuid4())

    # 获取或创建会话
    if session_id not in sessions:
        sessions[session_id] = []

    messages = sessions[session_id]
    messages.append({"role": "user", "content": request.message})

    # 调用 Agent
    try:
        result = await agent.run(messages)
        messages.append({"role": "assistant", "content": result.answer})

        return ChatResponse(
            reply=result.answer,
            session_id=session_id,
            tokens_used=result.total_tokens
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### 流式输出

LLM 生成较慢，流式输出提升用户体验。

```python
from fastapi.responses import StreamingResponse

@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    async def generate():
        async for chunk in agent.run_stream(request.message):
            yield f"data: {json.dumps({'text': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream"
    )
```

## Docker 容器化

### Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制代码
COPY . .

# 暴露端口
EXPOSE 8000

# 启动服务
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  agent-api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/agent
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: agent
      POSTGRES_PASSWORD: postgres
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

## 成本控制

### Token 消耗分析

| 环节 | 典型消耗 | 优化方向 |
|------|----------|----------|
| System Prompt | 每次 500-2000 token | 精简 Prompt，使用缓存 |
| 工具定义 | 每次 300-1000 token | 按需加载工具 |
| 对话历史 | 递增 | 截断或摘要 |
| 工具结果 | 每次调用 100-500 token | 精简返回数据 |
| 输出 | 100-500 token | 控制输出长度 |

### 优化策略

**1. Prompt Caching**

Anthropic Claude 支持缓存 System Prompt，重复调用不重复计费。

```python
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    system=[
        {
            "type": "text",
            "text": long_system_prompt,
            "cache_control": {"type": "ephemeral"}  # 缓存标记
        }
    ],
    messages=messages,
    max_tokens=1024
)
```

**2. 对话历史压缩**

```python
def compress_history(messages, max_tokens=4000):
    total = count_tokens(messages)
    if total <= max_tokens:
        return messages

    # 保留 System Prompt + 最近 5 轮
    system = messages[0]
    recent = messages[-10:]

    # 对中间部分做摘要
    old = messages[1:-10]
    if old:
        summary = llm.invoke(f"请总结以下对话的关键信息：{old}")
        return [system, {"role": "system", "content": f"历史摘要：{summary}"}] + recent

    return [system] + recent
```

**3. 模型分层**

不同复杂度的任务用不同级别的模型。

```python
def get_model(task_complexity: str) -> str:
    if task_complexity == "simple":
        return "claude-haiku-4-5-20251001"    # 便宜快速
    elif task_complexity == "medium":
        return "claude-sonnet-4-20250514"     # 平衡
    else:
        return "claude-opus-4-20250514"       # 最强最贵
```

**4. 缓存常见问题**

```python
import hashlib
import redis

redis_client = redis.Redis()

def cached_agent_run(question: str):
    # 生成缓存 key
    cache_key = f"agent:{hashlib.md5(question.encode()).hexdigest()}"

    # 检查缓存
    cached = redis_client.get(cache_key)
    if cached:
        return json.loads(cached)

    # 调用 Agent
    result = agent.run(question)

    # 写入缓存，过期时间 1 小时
    redis_client.setex(cache_key, 3600, json.dumps(result))
    return result
```

## 限流与降级

### 限流

```python
from fastapi import FastAPI, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()

@app.post("/chat")
@limiter.limit("10/minute")  # 每分钟最多 10 次
async def chat(request: Request, body: ChatRequest):
    return await agent_run(body.message)
```

### 降级策略

```python
async def agent_run_safe(message: str):
    try:
        # 主 Agent
        return await primary_agent.run(message)
    except LLMRateLimitError:
        # 限流 → 用备用模型
        return await fallback_agent.run(message)
    except LLMTimeoutError:
        # 超时 → 返回缓存的常见回答
        return await cached_response(message)
    except Exception as e:
        # 其他错误 → 返回友好提示
        logger.error(f"Agent error: {e}")
        return "抱歉，服务暂时不可用，请稍后再试。"
```

### 熔断

```python
from circuitbreaker import circuit

@circuit(failure_threshold=5, recovery_timeout=60)
async def call_llm(prompt: str):
    response = await client.messages.create(...)
    return response
```

## 监控告警

### 关键监控项

| 监控项 | 告警阈值 |
|--------|----------|
| 错误率 | > 5% |
| 响应延迟 P99 | > 10s |
| Token 消耗 | 超预算 120% |
| 工具调用失败率 | > 10% |
| 队列积压 | > 100 请求 |

### 健康检查

```python
@app.get("/health")
async def health_check():
    checks = {
        "llm": await check_llm_connection(),
        "database": await check_database(),
        "vector_store": await check_vector_store(),
        "redis": await check_redis(),
    }

    all_healthy = all(checks.values())
    status_code = 200 if all_healthy else 503

    return JSONResponse(
        status_code=status_code,
        content={"status": "healthy" if all_healthy else "unhealthy", "checks": checks}
    )
```

## 生产 Checklist

- [ ] API 认证和授权
- [ ] 请求限流
- [ ] 降级和熔断策略
- [ ] 结构化日志
- [ ] 链路追踪
- [ ] 成本监控和预算告警
- [ ] 错误监控和告警
- [ ] 健康检查接口
- [ ] 数据库连接池
- [ ] 优雅关闭
- [ ] CI/CD 流水线
- [ ] 压力测试通过
- [ ] 安全审计通过
