# 具身智能（Embodied AI）

具身智能是让 AI 拥有"身体"，能够在物理世界中感知和行动的智能系统。

## 什么是具身智能？

```
传统 AI：数字世界中的智能
  输入文本/图片 → AI 处理 → 输出文本/图片

具身智能：物理世界中的智能
  传感器（视觉/触觉/语音）→ AI 决策 → 执行器（机械臂/轮子/语音）
```

核心思想：**智能不只是"思考"，还需要通过"身体"与环境交互来获得真正的智能。**

## 核心组成

```
┌──────────────────────────────────┐
│          具身智能系统              │
│                                   │
│  感知层                           │
│  ├── 视觉（摄像头/深度传感器）     │
│  ├── 触觉（力传感器/皮肤传感器）   │
│  ├── 听觉（麦克风阵列）           │
│  └── 本体感觉（关节角度/姿态）     │
│                                   │
│  决策层                           │
│  ├── 大模型（理解指令和场景）      │
│  ├── 规划（任务分解和路径规划）    │
│  └── 控制（运动控制策略）          │
│                                   │
│  执行层                           │
│  ├── 运动控制（关节/轮子）        │
│  ├── 操作控制（机械臂/夹爪）      │
│  └── 语音输出（扬声器）           │
└──────────────────────────────────┘
```

## 主要形态

### 人形机器人

| 项目 | 公司 | 特点 |
|------|------|------|
| Optimus | Tesla | 马斯克主导，量产目标 |
| Atlas | Boston Dynamics | 运动能力最强 |
| Figure 01/02 | Figure AI | 接入 OpenAI，理解力强 |
| 1X Neo | 1X Technologies | 家用场景 |
| Unitree H1/G1 | 宇树科技 | 国产，性价比高 |
| CyberOne | 小米 | 国产 |

### 非人形机器人

| 类型 | 说明 | 示例 |
|------|------|------|
| 机械臂 | 工业操作 | 焊接、装配、分拣 |
| 无人车 | 自动驾驶 | Tesla FSD、Waymo |
| 无人机 | 空中作业 | 大疆、Skydio |
| 四足机器人 | 复杂地形 | 宇树 Go2、Spot |

## 核心技术

### 1. 视觉-语言-动作模型（VLA）

将视觉理解、语言理解和动作控制统一到一个模型中。

```
用户指令："把桌上的红色杯子拿给我"
    ↓
视觉感知：识别桌上的物体和位置
    ↓
语言理解：理解"红色杯子"和"拿给我"
    ↓
动作规划：生成机械臂的运动轨迹
    ↓
执行控制：驱动机械臂抓取并递送
```

### 2. 仿真到现实（Sim-to-Real）

先在仿真环境中训练，再迁移到真实世界。

```
仿真环境训练（快速、安全、低成本）
    ↓
迁移学习
    ↓
真实世界微调（少量真实数据）
    ↓
部署运行
```

**仿真平台：**
- NVIDIA Isaac Sim
- MuJoCo
- Gazebo
- Habitat (Meta)

### 3. 强化学习

通过试错学习最优策略。

```
状态 → 模型决策 → 动作 → 奖励反馈 → 更新策略
```

应用：行走、抓取、导航、操作。

### 4. LLM 作为机器人大脑

用 LLM 做高层决策，传统控制做低层执行。

```python
class EmbodiedAgent:
    def __init__(self):
        self.llm = LLM()          # 高层决策
        self.controller = Robot()  # 低层控制

    async def execute(self, instruction: str):
        # LLM 理解指令并规划
        plan = await self.llm.plan(instruction)

        for step in plan:
            if step.type == "observe":
                observation = self.controller.get_observation()
                await self.llm.update_context(observation)

            elif step.type == "move_to":
                self.controller.move_to(step.target)

            elif step.type == "grasp":
                self.controller.grasp(step.object)

            elif step.type == "speak":
                self.controller.speak(step.text)
```

## 应用场景

| 场景 | 说明 |
|------|------|
| 工业制造 | 装配、质检、搬运 |
| 家庭服务 | 做饭、清洁、陪伴老人 |
| 医疗康复 | 辅助行走、康复训练 |
| 仓储物流 | 分拣、搬运、盘点 |
| 农业 | 采摘、除草、巡检 |
| 危险作业 | 火灾救援、核辐射检测 |
| 自动驾驶 | 感知-决策-控制闭环 |

## 与 Agent 的关系

具身智能是 Agent 的一个重要分支——**在物理世界中的 Agent**。

```
数字 Agent：在软件世界中行动（搜索、API调用、代码执行）
具身 Agent：在物理世界中行动（移动、抓取、操作）
```

共同的核心理念：
- 感知 → 决策 → 行动 的循环
- 工具使用（数字工具 vs 物理工具）
- 多模态理解（文本+图片+语音）
- 任务规划和拆解

## 发展趋势

- **通用性**：从单一任务走向通用操作
- **成本下降**：硬件成本持续降低
- **数据飞轮**：更多部署 → 更多数据 → 更强能力
- **安全性**：人机协作的安全标准
- **法规**：机器人相关的法律法规完善

## 学习资源

- [RT-2: Vision-Language-Action Models](https://robotics.googleblog.com/2023/07/rt-2-new-model-translates-vision.html) — Google 的 VLA 模型
- [SayCan](https://say-can.github.io/) — Google 的语言条件机器人控制
- [VoxPoser](https://voxposer.github.io/) — 用 LLM 做 3D 空间推理
- [NVIDIA Isaac](https://developer.nvidia.com/isaac-sim) — 机器人仿真平台
- [Open X-Embodiment](https://robotics-transformer-x.github.io/) — 开放式具身智能数据集
