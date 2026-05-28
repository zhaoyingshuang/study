# Agent 评估与测试

Agent 的行为具有不确定性，系统化的评估和测试是保证质量的关键。

## 为什么 Agent 测试很难？

| 挑战 | 说明 |
|------|------|
| 输出不确定 | 同一输入可能产生不同输出 |
| 工具调用链路长 | 一个环节出错就影响整体 |
| 难以断言结果 | 不能简单用 == 判断 |
| 成本高 | 每次测试都要调用 LLM |
| 覆盖面广 | Agent 的行为路径很多 |

## 评估框架

### 四层评估体系

```
第 1 层：组件测试 — 单个工具、单个 Prompt 是否正确
第 2 层：集成测试 — Agent 循环是否正常工作
第 3 层：端到端测试 — 完整任务流程是否达标
第 4 层：人工评估 — 最终用户体验是否合格
```

### 评估指标

| 维度 | 指标 | 说明 |
|------|------|------|
| **准确性** | Answer Correctness | 回答是否正确 |
| **相关性** | Answer Relevancy | 回答是否切题 |
| **忠实度** | Faithfulness | 是否基于事实（不是编造） |
| **完整性** | Completeness | 是否完整回答了问题 |
| **效率** | Tool Call Count | 调用了多少次工具 |
| **成本** | Token Usage | 消耗了多少 token |
| **延迟** | Latency | 响应时间 |
| **工具使用** | Tool Selection Accuracy | 是否选对了工具 |

## 测试方法

### 1. 单元测试

测试单个组件，不依赖 LLM。

```python
import pytest

# 测试工具是否正确执行
def test_weather_tool():
    result = get_weather("北京")
    assert "temperature" in result
    assert isinstance(result["temperature"], (int, float))

def test_calculator_tool():
    assert calculator("2 + 3") == "5"
    assert calculator("10 * 4") == "40"

# 测试 Prompt 模板
def test_prompt_rendering():
    template = PromptTemplate.from_file("system_prompt.txt")
    rendered = template.render(role="助手", language="中文")
    assert "助手" in rendered
    assert "中文" in rendered
```

### 2. Golden Path 测试

测试已知正确答案的场景。

```python
test_cases = [
    {
        "input": "北京今天天气怎么样？",
        "expected_tools": ["get_weather"],
        "expected_keywords": ["温度", "天气"],
    },
    {
        "input": "帮我算一下 (15 + 27) * 3",
        "expected_tools": ["calculator"],
        "expected_keywords": ["126"],
    },
    {
        "input": "你好",
        "expected_tools": [],  # 不需要调用工具
        "expected_keywords": ["你好"],
    },
]

@pytest.mark.parametrize("case", test_cases)
def test_golden_path(case):
    result = agent.run(case["input"])

    # 检查是否调用了预期的工具
    assert set(result.tool_calls) == set(case["expected_tools"])

    # 检查回答是否包含关键词
    for keyword in case["expected_keywords"]:
        assert keyword in result.answer
```

### 3. LLM-as-Judge

用另一个 LLM 来评估 Agent 的输出质量。

```python
from openai import OpenAI

judge = OpenAI()

def evaluate_answer(question: str, answer: str, reference: str = None) -> dict:
    prompt = f"""请评估以下回答的质量。

问题：{question}
回答：{answer}
"""
    if reference:
        prompt += f"\n参考答案：{reference}"

    prompt += """
请按以下维度打分（1-5分）：
1. 准确性：回答是否正确
2. 相关性：是否切题
3. 完整性：是否完整回答了问题
4. 清晰度：表达是否清晰

输出 JSON 格式。
"""

    response = judge.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )

    return json.loads(response.choices[0].message.content)
```

### 4. 对比测试（A/B 测试）

比较不同版本的 Agent 效果。

```python
def ab_test(question: str, agent_a, agent_b, num_runs=5):
    results_a = [agent_a.run(question) for _ in range(num_runs)]
    results_b = [agent_b.run(question) for _ in range(num_runs)]

    # 用 LLM Judge 对比
    comparisons = []
    for a, b in zip(results_a, results_b):
        winner = llm_judge.compare(question, a, b)
        comparisons.append(winner)

    win_rate_a = sum(1 for c in comparisons if c == "A") / len(comparisons)
    win_rate_b = sum(1 for c in comparisons if c == "B") / len(comparisons)

    return {"A": win_rate_a, "B": win_rate_b, "tie": 1 - win_rate_a - win_rate_b}
```

## 评估工具

### Ragas

RAG 专项评估框架。

```python
from ragas import evaluate
from ragas.metrics import (
    faithfulness,
    answer_relevancy,
    context_precision,
    context_recall,
)
from datasets import Dataset

# 准备评估数据
eval_data = {
    "question": ["什么是RAG？", "RAG的流程是什么？"],
    "answer": [agent_answer_1, agent_answer_2],
    "contexts": [retrieved_docs_1, retrieved_docs_2],
    "ground_truth": ["参考答案1", "参考答案2"],
}

dataset = Dataset.from_dict(eval_data)
results = evaluate(
    dataset,
    metrics=[faithfulness, answer_relevancy, context_precision, context_recall]
)
print(results)
```

### LangSmith

LangChain 的可观测性平台，内置评估功能。

```python
from langsmith import Client

client = Client()

# 创建数据集
dataset = client.create_dataset("agent-eval")
client.create_examples(
    dataset_id=dataset.id,
    inputs=[
        {"question": "北京天气？"},
        {"question": "计算 2+3"},
    ],
    outputs=[
        {"answer": "北京今天晴，28°C"},
        {"answer": "5"},
    ]
)

# 运行评估
results = client.run_on_dataset(
    dataset_name="agent-eval",
    llm_or_chain_factory=agent,
    evaluation=eval_config
)
```

### Deepeval

全面的 LLM 评估框架。

```python
from deepeval import assert_test
from deepeval.metrics import AnswerRelevancyMetric, FaithfulnessMetric
from deepeval.test_case import LLMTestCase

def test_answer_quality():
    test_case = LLMTestCase(
        input="什么是 RAG？",
        actual_output=agent.run("什么是 RAG？"),
        expected_output="RAG 是检索增强生成...",
        retrieval_context=[retrieved_doc]
    )

    metrics = [
        AnswerRelevancyMetric(threshold=0.7),
        FaithfulnessMetric(threshold=0.7),
    ]

    assert_test(test_case, metrics)
```

## 测试数据集构建

### 收集真实用户问题

```python
# 从日志中提取真实用户问题
import json

logs = json.load(open("agent_logs.json"))
real_questions = [log["user_message"] for log in logs if log["source"] == "user"]

# 过滤和分类
categorized = {
    "简单问题": [],
    "工具调用": [],
    "多轮对话": [],
    "边界情况": [],
}
```

### 合成测试数据

```python
# 用 LLM 生成测试用例
def generate_test_cases(topic: str, count: int = 20):
    prompt = f"""请为以下场景生成 {count} 个测试问题：
    场景：{topic}

    要求：
    - 包含简单、中等、困难的问题
    - 包含边界情况
    - 包含需要调用工具的问题
    - 包含不需要工具的纯对话问题

    输出 JSON 数组格式。
    """
    return llm.generate(prompt)
```

## 持续评估

```
每次修改 Agent 后：
1. 运行自动化测试套件（快速反馈）
2. 运行 Golden Path 测试（核心功能）
3. 运行 LLM-as-Judge 评估（质量）
4. 对比上一版本结果（回归检测）
5. 定期人工抽检（最终把关）
```

## 最佳实践

1. **先建测试集，再改 Agent** — 有基准才能衡量改进
2. **混合使用多种方法** — 单元测试 + LLM Judge + 人工
3. **关注工具调用链路** — 不只看最终答案，还要看过程
4. **记录每次评估结果** — 方便追踪变化趋势
5. **控制评估成本** — 用小模型做 Judge，核心用例才用大模型
6. **测试边界情况** — 超长输入、空输入、恶意输入
