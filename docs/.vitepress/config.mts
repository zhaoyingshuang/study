import { defineConfig } from 'vitepress'

export default defineConfig({
  base: '/study/',
  title: '技术学习笔记',
  description: 'AI 智能体研发 & 技术学习资料分享',
  lang: 'zh-CN',
  lastUpdated: true,
  sitemap: {
    hostname: 'https://zhaoyingshuang.github.io/study/',
  },
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/study/logo.svg' }],
  ],
  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      { text: 'AI 智能体', link: '/ai-agent/' },
      { text: 'FAQ', link: '/faq' },
      { text: '更新日志', link: '/changelog' },
    ],
    sidebar: {
      '/ai-agent/': [
        {
          text: '概述',
          items: [
            { text: 'AI 智能体开发', link: '/ai-agent/' },
            { text: 'Workflow vs Agent', link: '/ai-agent/workflow-vs-agent' },
            { text: 'Agent 设计模式', link: '/ai-agent/design-patterns' },
            { text: '术语表', link: '/ai-agent/glossary' },
          ],
        },
        {
          text: '基础',
          items: [
            { text: '基础概念', link: '/ai-agent/basics' },
            { text: 'Prompt Engineering', link: '/ai-agent/prompt-engineering' },
            { text: 'Function Calling', link: '/ai-agent/function-calling' },
            { text: '记忆系统详解', link: '/ai-agent/memory' },
          ],
        },
        {
          text: '核心技术',
          items: [
            { text: 'RAG 检索增强生成', link: '/ai-agent/rag' },
            { text: 'Agentic RAG', link: '/ai-agent/agentic-rag' },
            { text: 'Multi-Agent 多智能体', link: '/ai-agent/multi-agent' },
            { text: '多模态 Agent', link: '/ai-agent/multimodal' },
            { text: '知识图谱 + Agent', link: '/ai-agent/knowledge-graph' },
            { text: 'MCP 协议', link: '/ai-agent/mcp' },
            { text: 'A2A 协议', link: '/ai-agent/a2a' },
          ],
        },
        {
          text: '前沿方向',
          items: [
            { text: 'AIGC 生成内容', link: '/ai-agent/aigc' },
            { text: '具身智能', link: '/ai-agent/embodied-ai' },
            { text: 'AIOS AI 操作系统', link: '/ai-agent/aios' },
          ],
        },
        {
          text: '工程化',
          items: [
            { text: '技术栈总览', link: '/ai-agent/tech-stack' },
            { text: '国产模型适配', link: '/ai-agent/chinese-llm' },
            { text: '小模型与端侧 Agent', link: '/ai-agent/local-agent' },
            { text: '评估与测试', link: '/ai-agent/evaluation' },
            { text: '可观测性', link: '/ai-agent/observability' },
            { text: '部署与生产化', link: '/ai-agent/deployment' },
            { text: 'Agent 安全', link: '/ai-agent/security' },
          ],
        },
        {
          text: '实践',
          items: [
            { text: '实战项目', link: '/ai-agent/practice' },
            { text: 'AI Coding Agent', link: '/ai-agent/coding-agent' },
            { text: '开源项目源码解读', link: '/ai-agent/source-code-analysis' },
            { text: '行业应用案例', link: '/ai-agent/industry-applications' },
            { text: '踩坑记录', link: '/ai-agent/pitfalls' },
            { text: '面试专题', link: '/ai-agent/interview' },
            { text: '学习资源', link: '/ai-agent/resources' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/zhaoyingshuang/study' },
    ],
    footer: {
      message: '基于 CC BY-NC-SA 4.0 协议发布',
    },
    search: {
      provider: 'local',
    },
    lastUpdated: {
      text: '最后更新于',
    },
    outline: {
      label: '页面导航',
    },
    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },
  },
})
