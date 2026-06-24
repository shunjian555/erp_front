<template>
  <div class="base-empty">
    <el-empty :description="t('common.noData')" :image-size="100" />
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<style lang="scss" scoped>
.base-empty {
  padding: 40px 0;
}
</style>
