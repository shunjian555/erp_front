<template>
  <div class="page-container">
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增规则</el-button>
        <el-button :icon="VideoPlay" @click="handleTest">测试运行</el-button>
      </div>
    </div>
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : 'info'">{{ row.status === 1 ? '启用' : '停用' }}</BaseStatusTag></template>
      <template #priority="{ row }"><el-tag :type="priorityMap[row.priority]?.type || ''" size="small">{{ priorityMap[row.priority]?.label || row.priority }}</el-tag></template>
      <template #operation="{ row }">
        <el-button v-for="action in getActions(row).slice(0, 3)" :key="action.key" :type="action.type" link size="small" @click="action.handler(row)">{{ action.label }}</el-button>
        <el-dropdown v-if="getActions(row).length > 3" trigger="click" @command="(cmd) => handleCommand(cmd, row)">
          <el-button type="primary" link size="small">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown><el-dropdown-menu><el-dropdown-item v-for="action in getActions(row).slice(3)" :key="action.key" :command="action.key">{{ action.label }}</el-dropdown-item></el-dropdown-menu></template>
        </el-dropdown>
      </template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="650px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, VideoPlay, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'
const priorityMap = { high: { label: '高', type: 'danger' }, medium: { label: '中', type: 'warning' }, low: { label: '低', type: 'info' } }
const searchItems = [{ prop: 'name', label: '规则名称', type: 'input' }]
const columns = [{ prop: 'name', label: '规则名称', minWidth: 180 }, { prop: 'metric', label: '监控指标', width: 140 }, { prop: 'condition', label: '触发条件', width: 200 }, { prop: 'threshold', label: '阈值', width: 100, align: 'right' }, { prop: 'notify', label: '通知方式', width: 130 }, { prop: 'priority', label: '级别', width: 80, slot: 'priority' }, { prop: 'status', label: '状态', width: 80, slot: 'status' }]
const formItems = [{ prop: 'name', label: '规则名称', type: 'input', span: 24 }, { prop: 'metric', label: '监控指标', type: 'select', options: [{ value: '销售额', label: '销售额' }, { value: '库存数量', label: '库存数量' }, { value: '毛利率', label: '毛利率' }, { value: '回款率', label: '回款率' }, { value: '订单数', label: '订单数' }], span: 12 }, { prop: 'condition', label: '条件', type: 'select', options: [{ value: '>', label: '大于' }, { value: '<', label: '小于' }, { value: '>=', label: '大于等于' }, { value: '<=', label: '小于等于' }, { value: '==', label: '等于' }], span: 6 }, { prop: 'threshold', label: '阈值', type: 'number', span: 6 }, { prop: 'notify', label: '通知方式', type: 'checkbox', options: [{ value: 'email', label: '邮件' }, { value: 'sms', label: '短信' }, { value: 'site', label: '站内' }], span: 12 }, { prop: 'priority', label: '级别', type: 'radio', options: [{ value: 'high', label: '高' }, { value: 'medium', label: '中' }, { value: 'low', label: '低' }], span: 12 }, { prop: 'subscribers', label: '订阅人', type: 'textarea', rows: 2, span: 24, placeholder: '多个订阅人用英文逗号分隔' }, { prop: 'status', label: '状态', type: 'radio', options: [{ value: 1, label: '启用' }, { value: 0, label: '停用' }], span: 24 }]
const formRules = { name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }] }
const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, name: '' })
const formData = reactive({ id: undefined, name: '', metric: '销售额', condition: '<', threshold: undefined, notify: ['email', 'site'], priority: 'medium', subscribers: '', status: 1 })
async function loadData() {
  loading.value = true
  try {
    const all = [
      { id: 1, name: '销售额低于预算告警', metric: '销售额', condition: '<', threshold: 1000000, notify: '邮件, 站内', priority: 'high', status: 1 },
      { id: 2, name: '库存低于安全库存', metric: '库存数量', condition: '<', threshold: 50, notify: '邮件, 短信', priority: 'high', status: 1 },
      { id: 3, name: '毛利率异常下降', metric: '毛利率', condition: '<', threshold: 20, notify: '邮件', priority: 'medium', status: 1 },
      { id: 4, name: '回款率低于标准', metric: '回款率', condition: '<', threshold: 80, notify: '邮件, 站内', priority: 'medium', status: 0 },
      { id: 5, name: '订单数超预期', metric: '订单数', condition: '>', threshold: 500, notify: '站内', priority: 'low', status: 1 }
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
function handleAdd() { dialogTitle.value = '新增预警规则'; Object.keys(formData).forEach(k => formData[k] = (k === 'metric' ? '销售额' : k === 'condition' ? '<' : k === 'priority' ? 'medium' : k === 'notify' ? ['email', 'site'] : k === 'status' ? 1 : '')); formData.id = undefined; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑预警规则'; Object.assign(formData, r); dialogVisible.value = true }
function handleTest() { ElMessage.success('正在测试规则...3 条规则已命中') }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除「${row.name}」?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
function getActions(row) {
  return [
    { key: 'edit', label: '编辑', type: 'primary', handler: handleEdit },
    { key: 'test', label: '测试', type: 'warning', handler: (r) => ElMessage.success(`规则「${r.name}」已测试`) },
    { key: 'toggle', label: row.status === 1 ? '停用' : '启用', type: 'success', handler: (r) => { r.status = r.status === 1 ? 0 : 1; ElMessage.success(r.status === 1 ? '已启用' : '已停用') } },
    { key: 'delete', label: '删除', type: 'danger', handler: handleDelete }
  ]
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>
<style lang="scss" scoped>.table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }</style>
