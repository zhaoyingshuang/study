<template>
  <div class="giscus-wrapper">
    <Giscus
      repo="zhaoyingshuang/study"
      repoId="R_kgDOSqGj2g"
      category="General"
      categoryId="DIC_kwDOSqGj2s4ClMCM"
      mapping="pathname"
      strict="0"
      reactionsEnabled="1"
      emitMetadata="0"
      inputPosition="top"
      theme="preferred_color_scheme"
      lang="zh-CN"
      loading="lazy"
    />
  </div>
</template>

<script setup>
import Giscus from '@giscus/vue'
</script>

<style>
.giscus-wrapper {
  margin-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 1.5rem;
}
</style>
