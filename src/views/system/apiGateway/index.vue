<template>
  <div class="page-container">
    <el-alert title="第三方对接配置（API 网关）" type="info" :closable="false" show-icon style="margin-bottom: 16px">
      <template #default>统一管理外部系统接口的接入配置：API 密钥、Webhook、OAuth2 授权等。</template>
    </el-alert>
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增对接</el-button>
        <el-button :icon="Key" @click="handleGenKey">生成 API Key</el-button>
      </div>
    </div>
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #type="{ row }"><el-tag :type="typeMap[row.type]?.type || ''" size="small">{{ typeMap[row.type]?.label || row.type }}</el-tag></template>
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '已连接' : '已断开' }}</BaseStatusTag></template>
      <template #operation="{ row }">
        <el-button v-for="action in getActions(row).slice(0, 3)" :key="action.key" :type="action.type" link size="small" @click="action.handler(row)">{{ action.label }}</el-button>
        <el-dropdown v-if="getActions(row).length > 3" trigger="click" @command="(cmd) => handleCommand(cmd, row)">
          <el-button type="primary" link size="small">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown><el-dropdown-menu><el-dropdown-item v-for="action in getActions(row).slice(3)" :key="action.key" :command="action.key">{{ action.label }}</el-dropdown-item></el-dropdown-menu></template>
        </el-dropdown>
      </template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="650px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog">
      <el-form :model="formData" label-width="120px">
        <el-form-item label="对接名称" required><el-input v-model="formData.name" /></el-form-item>
        <el-form-item label="类型" required>
          <el-select v-model="formData.type" style="width: 100%">
            <el-option v-for="t in Object.entries(typeMap)" :key="t[0]" :value="t[0]" :label="t[1].label" />
          </el-select>
        </el-form-item>
        <el-form-item label="接入方"><el-input v-model="formData.party" placeholder="例: 钉钉 / 微信 / 京东" /></el-form-item>
        <el-form-item label="接口地址" required><el-input v-model="formData.endpoint" placeholder="https://api.example.com/v1" /></el-form-item>
        <el-form-item label="App ID"><el-input v-model="formData.appId" /></el-form-item>
        <el-form-item label="App Secret"><el-input v-model="formData.appSecret" show-password /></el-form-item>
        <el-form-item label="Token">
          <el-input v-model="formData.token" disabled><template #append><el-button @click="formData.token = 'tk_' + Date.now()">生成</el-button></template></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="formData.status">
            <el-radio :value="1">启用</el-radio><el-radio :value="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </BaseDialog>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Key, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'
const typeMap = {
  dingtalk: { label: '钉钉', type: 'primary' }, wechat: { label: '微信', type: 'success' },
  feishu: { label: '飞书', type: 'warning' }, jd: { label: '京东', type: 'danger' },
  taobao: { label: '淘宝', type: 'warning' }, oauth: { label: 'OAuth2', type: '' },
  webhook: { label: 'Webhook', type: 'info' }
}
const searchItems = [{ prop: 'name', label: '对接名称', type: 'input' }]
const columns = [{ prop: 'name', label: '对接名称', width: 180 }, { prop: 'type', label: '类型', width: 100, slot: 'type' }, { prop: 'party', label: '接入方', width: 120 }, { prop: 'endpoint', label: '接口地址', minWidth: 220, showOverflowTooltip: true }, { prop: 'appId', label: 'App ID', width: 160 }, { prop: 'status', label: '状态', width: 90, slot: 'status' }, { prop: 'lastCallTime', label: '最后调用', width: 170 }]
const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false)
const queryParams = reactive({ pageNum: 1, pageSize: 10, name: '' })
const formData = reactive({ id: undefined, name: '', type: 'dingtalk', party: '', endpoint: '', appId: '', appSecret: '', token: '', status: 1 })
async function loadData() {
  loading.value = true
  try {
    const all = [
      { id: 1, name: '钉钉消息推送', type: 'dingtalk', party: '钉钉', endpoint: 'https://oapi.dingtalk.com/robot/send', appId: 'dingxxxx', token: 'tk_1700000000', status: 1, lastCallTime: '2024-07-20 14:30:00' },
      { id: 2, name: '微信公众号', type: 'wechat', party: '微信', endpoint: 'https://api.weixin.qq.com/cgi-bin', appId: 'wx123456', token: 'tk_1700000001', status: 1, lastCallTime: '2024-07-20 12:00:00' },
      { id: 3, name: '飞书机器人', type: 'feishu', party: '飞书', endpoint: 'https://open.feishu.cn/open-apis/bot/v2/hook', appId: 'cli_xxx', token: '', status: 1, lastCallTime: '2024-07-19 10:00:00' },
      { id: 4, name: '京东开放平台', type: 'jd', party: '京东', endpoint: 'https://api.jd.com/routerjson', appId: 'jd_app_xxx', token: 'tk_1700000003', status: 0, lastCallTime: '2024-07-15 09:00:00' },
      { id: 5, name: '数据上报 Webhook', type: 'webhook', party: '内部 BI', endpoint: 'https://bi.internal.com/webhook', appId: '', token: 'tk_1700000004', status: 1, lastCallTime: '2024-07-20 15:00:00' }
    ]
    const { name = '', pageNum = 1, pageSize = 10 } = queryParams
    let filtered = all
    if (name) filtered = filtered.filter(x => x.name.includes(name))
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增对接'; formData.id = undefined; formData.name = ''; formData.type = 'dingtalk'; formData.party = ''; formData.endpoint = ''; formData.appId = ''; formData.appSecret = ''; formData.token = ''; formData.status = 1; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑对接'; Object.assign(formData, r); dialogVisible.value = true }
function handleTest(row) { ElMessage.success(`正在测试连接 ${row.name}...`) }
function handleGenKey() { ElMessage.success('已生成新 API Key: tk_' + Date.now()) }
async function handleSubmit() { if (!formData.name) return ElMessage.warning('请输入名称'); submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('保存成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('保存失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除「${row.name}」?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
function getActions(row) {
  return [
    { key: 'edit', label: '编辑', type: 'primary', handler: handleEdit },
    { key: 'test', label: '测试', type: 'success', handler: handleTest },
    { key: 'toggle', label: row.status === 1 ? '停用' : '启用', type: 'warning', handler: (r) => { r.status = r.status === 1 ? 0 : 1; ElMessage.success(r.status === 1 ? '已启用' : '已停用') } },
    { key: 'delete', label: '删除', type: 'danger', handler: handleDelete }
  ]
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>
<style lang="scss" scoped>.table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } }</style>
