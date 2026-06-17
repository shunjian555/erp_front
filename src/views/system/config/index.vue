<template>
  <div class="page-container">
    <el-row :gutter="20">
      <el-col :span="14">
        <el-card shadow="never"><template #header><span>基本信息</span></template><el-form :model="configForm" label-width="120px" style="max-width: 560px">
          <el-form-item label="系统名称"><el-input v-model="configForm.systemName" placeholder="请输入系统名称" /></el-form-item>
          <el-form-item logo="系统Logo"><el-input v-model="configForm.logo" placeholder="请输入Logo地址" /></el-form-item>
          <el-form-item label="版本号"><el-input v-model="configForm.version" placeholder="请输入版本号" /></el-form-item>
          <el-form-item label="版权信息"><el-input v-model="configForm.copyright" type="textarea" :rows="2" placeholder="请输入版权信息" /></el-form-item>
          <el-form-item><el-button type="primary" @click="handleSaveConfig" :loading="saveLoading">保存配置</el-button></el-form-item>
        </el-form></el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="never"><template #header><span>系统参数</span></template><el-descriptions :column="1" border>
          <el-descriptions-item label="运行环境">{{ envInfo.env }}</el-descriptions-item>
          <el-descriptions-item label="Vue版本">{{ envInfo.vueVersion }}</el-descriptions-item>
          <el-descriptions-item label="Element版本">{{ envInfo.elementVersion }}</el-descriptions-item>
          <el-descriptions-item label="Node版本">{{ envInfo.nodeVersion }}</el-descriptions-item>
          <el-descriptions-item label="构建时间">{{ envInfo.buildTime }}</el-descriptions-item>
          <el-descriptions-item label="最后部署">{{ envInfo.deployTime }}</el-descriptions-item>
        </el-descriptions></el-card>
        <el-card shadow="never" style="margin-top: 16px"><template #header><span>缓存管理</span></template><div style="display: flex; gap: 12px; flex-wrap: wrap">
          <el-button @click="handleClearCache('session')">清除会话缓存</el-button>
          <el-button @click="handleClearCache('local')">清除本地缓存</el-button>
          <el-button type="danger" @click="handleClearCache('all')">清除全部缓存</el-button>
        </div></el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const saveLoading = ref(false)
const configForm = reactive({ systemName: 'Smart ERP 智慧管理系统', logo: '', version: 'V1.0.0', copyright: 'Copyright © 2024 Smart ERP All Rights Reserved.' })
const envInfo = { env: 'Production', vueVersion: '3.x', elementVersion: '2.x', nodeVersion: 'v18.x', buildTime: '2024-01-15 10:30:00', deployTime: '2024-01-15 11:00:00' }

async function handleSaveConfig() { saveLoading.value = true; try { await new Promise(r => setTimeout(r, 800)); ElMessage.success('配置保存成功') } finally { saveLoading.value = false } }
async function handleClearCache(type) {
  const map = { session: '会话缓存', local: '本地缓存', all: '全部缓存' }
  await ElMessageBox.confirm(`确定清除${map[type]}?`, '提示', { type: 'warning' })
  if (type === 'local' || type === 'all') localStorage.clear()
  if (type === 'session' || type === 'all') sessionStorage.clear()
  ElMessage.success(`${map[type]}已清除`)
}
</script>
