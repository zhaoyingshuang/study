# AIGC（AI 生成内容）

AIGC（AI-Generated Content）是利用 AI 自动生成文本、图片、音频、视频等内容的技术，是 Agent 能力的重要扩展。

## 什么是 AIGC？

```
传统内容创作：人 → 创作 → 内容
AIGC：人 → 提示词 → AI → 内容
```

## 内容类型

### 文本生成

最成熟的 AIGC 方向。

| 应用 | 说明 | 代表产品 |
|------|------|----------|
| 文章写作 | 博客、报告、营销文案 | ChatGPT、Claude |
| 代码生成 | 编写、补全、解释代码 | GitHub Copilot、Claude Code |
| 翻译 | 多语言互译 | DeepL、GPT-4 |
| 对话 | 客服、教育、陪伴 | ChatGPT、Character.ai |

### 图像生成

用文字描述生成图片。

| 模型 | 厂商 | 特点 |
|------|------|------|
| DALL-E 3 | OpenAI | 与 GPT-4 集成，理解力强 |
| Midjourney | Midjourney | 艺术风格突出，社区活跃 |
| Stable Diffusion | Stability AI | 开源，可本地部署 |
| Flux | Black Forest Labs | 开源，质量高 |
| 文心一格 | 百度 | 中文理解好 |

**基础用法（DALL-E）：**

```python
from openai import OpenAI

client = OpenAI()

response = client.images.generate(
    model="dall-e-3",
    prompt="一只戴着眼镜的猫在编程，卡通风格",
    size="1024x1024",
    quality="standard",
    n=1
)

image_url = response.data[0].url
```

**本地生成（Stable Diffusion）：**

```python
from diffusers import StableDiffusionPipeline

pipe = StableDiffusionPipeline.from_pretrained("runwayml/stable-diffusion-v1-5")
pipe.to("cuda")

image = pipe("a cat programming with glasses, cartoon style").images[0]
image.save("output.png")
```

### 音频生成

| 应用 | 说明 | 代表产品 |
|------|------|----------|
| 语音合成 (TTS) | 文字转语音 | ElevenLabs、Azure TTS |
| 语音克隆 | 模仿特定人声 | ElevenLabs |
| 音乐生成 | AI 作曲 | Suno、Udio |
| 音效生成 | 生成音效 | Stable Audio |

### 视频生成

| 模型 | 厂商 | 特点 |
|------|------|------|
| Sora | OpenAI | 长视频，物理世界理解强 |
| Kling | 快手 | 国产，效果好 |
| Vidu | 生数科技 | 国产 |
| Pika | Pika Labs | 易用 |
| Runway Gen-3 | Runway | 专业视频生成 |

## Agent + AIGC

AIGC 能力可以作为 Agent 的工具，拓展 Agent 的输出形式。

```
用户需求 → Agent
  ├── 文本生成 → 直接用 LLM
  ├── 图片生成 → 调用 DALL-E / SD
  ├── 语音合成 → 调用 TTS API
  └── 视频生成 → 调用视频生成 API
```

### 多模态内容生成 Agent

```python
class ContentAgent:
    """多模态内容生成 Agent"""

    async def generate_article_with_images(self, topic: str):
        # 1. 生成文章大纲
        outline = await self.llm.invoke(f"为 '{topic}' 生成文章大纲")

        # 2. 生成文章正文
        article = await self.llm.invoke(f"基于以下大纲写文章：{outline}")

        # 3. 为每个章节生成配图
        sections = parse_sections(article)
        for section in sections:
            image_prompt = await self.llm.invoke(
                f"为以下内容生成配图描述：{section[:100]}"
            )
            image_url = await self.generate_image(image_prompt)
            section["image"] = image_url

        return {"article": article, "sections": sections}

    async def generate_image(self, prompt: str) -> str:
        response = await self.openai_client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            n=1
        )
        return response.data[0].url
```

### 营销内容 Agent

```python
class MarketingAgent:
    """一键生成营销物料"""

    async def create_campaign(self, product: str, style: str):
        tasks = {
            "slogan": self.generate_slogan(product, style),
            "copy": self.generate_copy(product, style),
            "image": self.generate_image(product, style),
            "video_script": self.generate_video_script(product, style),
            "social_posts": self.generate_social_posts(product, style),
        }

        results = {}
        for name, task in tasks.items():
            results[name] = await task

        return results
```

## Prompt 技巧

### 图片生成 Prompt

```
好的图片 Prompt 结构：
[主体] + [动作/场景] + [风格] + [光照/色调] + [构图]

示例：
一只猫坐在书桌前编程（主体+动作）
赛博朋克风格（风格）
霓虹灯照明，蓝色和紫色色调（光照）
正面特写镜头（构图）
```

### 视频 Prompt

```
好的视频 Prompt：
[场景描述] + [镜头运动] + [时间跨度] + [风格]

示例：
城市街道上，镜头从地面缓慢上升到鸟瞰视角，
时间从日出到日落，电影质感
```

## 开源工具

| 工具 | 用途 | 地址 |
|------|------|------|
| Stable Diffusion WebUI | 图片生成界面 | github.com/AUTOMATIC1111/stable-diffusion-webui |
| ComfyUI | 节点式图片生成 | github.com/comfyanonymous/ComfyUI |
| Fooocus | 简化版 SD | github.com/lllyasviel/Fooocus |
| Whisper | 语音转文字 | github.com/openai/whisper |
| Bark | 文字转语音 | github.com/suno-ai/bark |
| Coqui TTS | 开源 TTS | github.com/coqui-ai/TTS |

## 版权与伦理

| 问题 | 说明 |
|------|------|
| 版权归属 | AI 生成的图片/文字的版权归属尚无定论 |
| 深度伪造 | 用 AI 生成虚假人物图片/视频有法律风险 |
| 训练数据 | 模型训练数据是否侵权仍有争议 |
| 水印 | 部分平台要求标注 AI 生成内容 |

**建议：**
- 商业使用前确认模型的授权协议
- AI 生成内容标注"由 AI 辅助生成"
- 不用 AI 生成涉及真实人物的内容
