# 多模态 Agent

多模态 Agent 能处理文本、图像、音频、视频等多种信息形式，大幅拓展了 Agent 的应用场景。

## 什么是多模态？

```
单模态 Agent：只能处理文本
  文本输入 → LLM → 文本输出

多模态 Agent：处理多种信息
  文本 + 图片 + 语音 → 多模态 LLM → 文本/图片/语音
```

## 主流多模态模型

| 模型 | 支持的输入 | 支持的输出 | 特点 |
|------|-----------|-----------|------|
| GPT-4o | 文本、图片、音频、视频 | 文本、音频 | 全模态，实时语音 |
| Claude Sonnet/Opus | 文本、图片 | 文本 | 图片理解能力强 |
| Gemini 2.0 | 文本、图片、音频、视频 | 文本、图片 | Google 出品，长视频理解 |
| Qwen-VL | 文本、图片 | 文本 | 中文图像理解好 |
| GLM-4V | 文本、图片 | 文本 | 国产，图文理解 |

## 图像理解

### 基本图片分析

```python
import anthropic

client = anthropic.Anthropic()

# 分析图片
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": "image/jpeg",
                        "data": base64_image_data
                    }
                },
                {
                    "type": "text",
                    "text": "描述这张图片的内容，列出所有你能看到的物品。"
                }
            ]
        }
    ]
)
```

### 图片 URL 方式

```python
response = client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": [
                {
                    "type": "image",
                    "source": {
                        "type": "url",
                        "url": "https://example.com/photo.jpg"
                    }
                },
                {
                    "type": "text",
                    "text": "这是什么地方？"
                }
            ]
        }
    ]
)
```

### Agent 场景：截图分析

```python
@tool
def analyze_screenshot(image_path: str, question: str) -> str:
    """分析截图内容"""
    with open(image_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode()

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {
                    "type": "base64",
                    "media_type": "image/png",
                    "data": image_data
                }},
                {"type": "text", "text": question}
            ]
        }]
    )
    return response.content[0].text

# Agent 使用
result = analyze_screenshot("bug_screenshot.png",
    "这个页面有什么UI问题？请列出所有bug。")
```

### Agent 场景：文档 OCR

```python
@tool
def extract_text_from_image(image_path: str) -> str:
    """从图片中提取文字（OCR）"""
    with open(image_path, "rb") as f:
        image_data = base64.b64encode(f.read()).decode()

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image", "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": image_data
                }},
                {"type": "text", "text": "请提取图片中的所有文字，保持原始格式。"}
            ]
        }]
    )
    return response.content[0].text
```

## 语音处理

### 语音输入（Speech-to-Text）

```python
from openai import OpenAI

client = OpenAI()

# 音频转文字
with open("user_audio.mp3", "rb") as audio_file:
    transcript = client.audio.transcriptions.create(
        model="whisper-1",
        file=audio_file,
        language="zh"
    )
    print(transcript.text)
```

### 语音输出（Text-to-Speech）

```python
# 文字转语音
response = client.audio.speech.create(
    model="tts-1",
    voice="alloy",
    input="你好，我是你的AI助手。"
)

with open("output.mp3", "wb") as f:
    f.write(response.content)
```

### 实时语音 Agent

```python
import asyncio

class VoiceAgent:
    def __init__(self):
        self.llm_client = OpenAI()

    async def process_voice_input(self, audio_path: str):
        # 1. 语音转文字
        text = await self.speech_to_text(audio_path)

        # 2. LLM 处理
        response = await self.llm_client.chat.completions.create(
            model="gpt-4o-audio-preview",
            messages=[{"role": "user", "content": text}]
        )
        answer = response.choices[0].message.content

        # 3. 文字转语音
        audio_response = await self.text_to_speech(answer)

        return {"text": answer, "audio": audio_response}

    async def speech_to_text(self, audio_path: str) -> str:
        with open(audio_path, "rb") as f:
            result = await asyncio.to_thread(
                self.llm_client.audio.transcriptions.create,
                model="whisper-1", file=f
            )
        return result.text

    async def text_to_speech(self, text: str) -> bytes:
        result = await asyncio.to_thread(
            self.llm_client.audio.speech.create,
            model="tts-1", voice="alloy", input=text
        )
        return result.content
```

## 视频理解

### 视频帧分析

视频太大无法直接输入，需要先提取关键帧。

```python
import cv2

def extract_key_frames(video_path: str, interval_seconds=5) -> list[str]:
    """每隔 N 秒提取一帧"""
    cap = cv2.VideoCapture(video_path)
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    interval = fps * interval_seconds

    frames = []
    frame_count = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if frame_count % interval == 0:
            _, buffer = cv2.imencode(".jpg", frame)
            frame_b64 = base64.b64encode(buffer).decode()
            frames.append(frame_b64)

        frame_count += 1

    cap.release()
    return frames

# 分析视频
@tool
def analyze_video(video_path: str, question: str) -> str:
    """分析视频内容"""
    frames = extract_key_frames(video_path, interval_seconds=10)

    content = [{"type": "text", "text": f"以下是视频的关键帧截图。{question}"}]
    for frame in frames[:20]:  # 最多 20 帧
        content.append({
            "type": "image",
            "source": {"type": "base64", "media_type": "image/jpeg", "data": frame}
        })

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        messages=[{"role": "user", "content": content}]
    )
    return response.content[0].text
```

## 多模态 Agent 实战示例

### 产品图片分析 Agent

```python
class ProductImageAgent:
    """分析产品图片，生成描述和标签"""

    def analyze(self, image_path: str) -> dict:
        image_data = self.load_image(image_path)

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system="""你是一个产品分析助手。分析产品图片，输出以下信息：
            1. 产品名称和类型
            2. 颜色和尺寸（如果能判断）
            3. 主要特征（3-5个）
            4. 适用场景
            5. 搜索标签（10个）
            输出JSON格式。""",
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image", "source": {
                        "type": "base64", "media_type": "image/jpeg",
                        "data": image_data
                    }},
                    {"type": "text", "text": "请分析这个产品"}
                ]
            }]
        )

        return json.loads(response.content[0].text)
```

### UI 测试 Agent

```python
class UITestAgent:
    """通过截图做 UI 测试"""

    def check_ui(self, screenshot_path: str, design_spec: str) -> dict:
        image_data = self.load_image(screenshot_path)

        response = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image", "source": {
                        "type": "base64", "media_type": "image/png",
                        "data": image_data
                    }},
                    {"type": "text", "text": f"""
                    请检查这个页面的UI是否符合以下设计规范：
                    {design_spec}

                    检查项：
                    1. 布局是否正确
                    2. 字体大小和颜色是否匹配
                    3. 间距是否合理
                    4. 是否有遮挡或错位
                    5. 响应式是否正常

                    输出检查结果（JSON格式，包含通过/不通过和具体问题）。
                    """}
                ]
            }]
        )
        return json.loads(response.content[0].text)
```

## 成本与性能

| 模态 | 输入成本 | 延迟 | 注意事项 |
|------|----------|------|----------|
| 文本 | 基准 | 基准 | 最经济 |
| 图片 | 约文本的 1000-5000 token | +0.5-2s | 压缩图片可降低成本 |
| 音频 | 约文本的 2-5x | +1-3s | 先转文字更便宜 |
| 视频 | 取决于帧数 | +3-10s | 抽关键帧而非逐帧 |

### 降低成本

```python
from PIL import Image

def optimize_image(image_path: str, max_size=1024) -> str:
    """压缩图片降低成本"""
    img = Image.open(image_path)

    # 缩放
    img.thumbnail((max_size, max_size))

    # 压缩质量
    buffer = io.BytesIO()
    img.save(buffer, format="JPEG", quality=80)
    return base64.b64encode(buffer.getvalue()).decode()
```

## 最佳实践

1. **优先文字** — 能用文字解决的不用图片，能用图片的不用视频
2. **压缩图片** — 缩放到合理尺寸，降低 token 消耗
3. **抽关键帧** — 视频不要逐帧分析，按间隔抽样
4. **先转文字** — 语音先 STT 转文字，再处理，成本更低
5. **分步处理** — 复杂多模态任务拆成多步，每步处理一种模态
