<template>
  <div class="error-page">
    <div class="error-content">
      <h1 class="error-code">404</h1>
      <p class="error-desc">{{ t('error.notFound') }}</p>
      <el-button type="primary" @click="$router.push('/')">{{ t('error.backHome') }}</el-button>
      <el-button @click="$router.back()">{{ t('error.backPrev') }}</el-button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

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
