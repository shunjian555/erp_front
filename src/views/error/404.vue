<template>
  <div class="error-page">
    <div class="error-content">
      <h1 class="error-code">404</h1>
      <p class="error-desc">抱歉，您访问的页面不存在</p>
      <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
      <el-button @click="$router.back()">返回上页</el-button>
    </div>
  </div>
</template>

<script setup></script>

<style lang="scss" scoped>
.error-page {
  display: flex; justify-content: center; align-items: center;
  height: 100vh; background: #f5f7fa;
}
.error-content { text-align: center; }
.error-code {
  font-size: 120px; font-weight: 700; color: #409EFF;
  line-height: 1; margin-bottom: 16px;
  text-shadow: 2px 2px 8px rgba(64,158,255,.3);
}
.error-desc {
  font-size: 18px; color: #606266; margin-bottom: 32px;
}
</style>
