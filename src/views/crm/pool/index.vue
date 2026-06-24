<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('crmPool.addCustomer') }}</el-button>
        <el-button type="warning" :icon="Refresh" plain @click="handleClaim">{{ t('crmPool.batchClaim') }}</el-button>
      </div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" circle @click="loadData" />
      </div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="rows => selectedRows = rows" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #level="{ row }">
        <el-tag :type="row.level === 'A' ? 'danger' : row.level === 'B' ? 'warning' : 'info'" size="small">{{ row.level }}{{ t('crmPool.levelUnit') }}</el-tag>
      </template>
      <template #status="{ row }">
        <el-tag :type="row.status === t('crmPool.unassigned') ? 'danger' : 'success'" size="small">{{ row.status }}</el-tag>
      </template>
      <template #operation="{ row }">
        <el-button v-for="action in getActions(row).slice(0, 3)" :key="action.key" :type="action.type" link size="small" @click="action.handler(row)">{{ action.label }}</el-button>
        <el-dropdown v-if="getActions(row).length > 3" trigger="click" @command="(cmd) => handleCommand(cmd, row)">
          <el-button type="primary" link size="small">{{ t('common.moreActions') }}<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="action in getActions(row).slice(3)" :key="action.key" :command="action.key">{{ action.label }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </BaseTable>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false" @close="cancelDialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item :label="t('crm.customerName')" prop="name"><el-input v-model="formData.name" /></el-form-item>
        <el-form-item :label="t('crmPool.industry')" prop="industry">
          <el-select v-model="formData.industry" style="width: 100%">
            <el-option v-for="o in industryOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('crm.level')" prop="level">
          <el-select v-model="formData.level" style="width: 100%">
            <el-option v-for="o in levelOptions" :key="o" :value="o" :label="o + t('crmPool.levelUnit')" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('crmPool.source')" prop="source">
          <el-select v-model="formData.source" style="width: 100%">
            <el-option v-for="o in sourceOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('crm.contactName')" prop="contact"><el-input v-model="formData.contact" /></el-form-item>
        <el-form-item :label="t('crm.phone')" prop="phone"><el-input v-model="formData.phone" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialog">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewVisible" :title="t('crmPool.detail')" width="600px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item :label="t('crm.customerName')">{{ viewRow.name }}</el-descriptions-item>
        <el-descriptions-item :label="t('crmPool.industry')">{{ viewRow.industry }}</el-descriptions-item>
        <el-descriptions-item :label="t('crm.level')">{{ viewRow.level }}{{ t('crmPool.levelUnit') }}</el-descriptions-item>
        <el-descriptions-item :label="t('crmPool.source')">{{ viewRow.source }}</el-descriptions-item>
        <el-descriptions-item :label="t('crm.contactName')">{{ viewRow.contact }}</el-descriptions-item>
        <el-descriptions-item :label="t('crm.phone')">{{ viewRow.phone }}</el-descriptions-item>
        <el-descriptions-item :label="t('common.status')">{{ viewRow.status }}</el-descriptions-item>
        <el-descriptions-item :label="t('crmPool.enterTime')">{{ viewRow.createTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, ArrowDown } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'

const { t } = useI18n()

const searchItems = [
  { prop: 'name', label: t('crm.customerName'), type: 'input' },
  { prop: 'level', label: t('crm.level'), type: 'select', options: [
    { value: 'A', label: 'A' + t('crmPool.levelUnit') }, { value: 'B', label: 'B' + t('crmPool.levelUnit') },
    { value: 'C', label: 'C' + t('crmPool.levelUnit') }, { value: 'D', label: 'D' + t('crmPool.levelUnit') }
  ]}
]
const columns = [
  { prop: 'name', label: t('crm.customerName'), minWidth: 200 },
  { prop: 'industry', label: t('crmPool.industry'), width: 120 },
  { prop: 'level', label: t('crm.level'), width: 100, slot: 'level' },
  { prop: 'source', label: t('crmPool.source'), width: 120 },
  { prop: 'contact', label: t('crm.contactName'), width: 100 },
  { prop: 'phone', label: t('crm.phone'), width: 140 },
  { prop: 'status', label: t('common.status'), width: 100, slot: 'status' },
  { prop: 'createTime', label: t('crmPool.enterTime'), width: 170 }
]
const industryOptions = [t('crmPool.manufacturing'), t('crmPool.service'), t('crmPool.construction'), t('crmPool.it'), t('crmPool.finance'), t('crmPool.logistics'), t('crmPool.chemical'), t('crmPool.retail')]
const sourceOptions = [t('crmPool.exhibition'), t('crmPool.online'), t('crmPool.referral'), t('crmPool.coldVisit'), t('crmPool.telemarketing'), t('crmPool.advertising')]
const levelOptions = ['A', 'B', 'C', 'D']

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, name: '', level: '' })
const formData = reactive({ id: undefined, name: '', industry: t('crmPool.manufacturing'), level: 'C', source: t('crmPool.online'), contact: '', phone: '' })
const formRules = { name: [{ required: true, message: t('crm.customerName'), trigger: 'blur' }] }
const names = ['华阳机械', '正泰电气', '盛达物流', '永盛建材', '东升电子', '信达软件', '天源化工', '华鑫科技', '中创光电', '远东智能']
const industries = [t('crmPool.manufacturing'), t('crmPool.service'), t('crmPool.construction'), t('crmPool.it'), t('crmPool.finance'), t('crmPool.logistics'), t('crmPool.chemical'), t('crmPool.retail')]
const sources = [t('crmPool.exhibition'), t('crmPool.online'), t('crmPool.referral'), t('crmPool.coldVisit'), t('crmPool.telemarketing'), t('crmPool.advertising')]
const levels = ['A', 'B', 'C', 'D']

async function loadData() {
  loading.value = true
  try {
    const { name = '', level = '', pageNum = 1, pageSize = 10 } = queryParams
    const all = Array.from({ length: 45 }, (_, i) => ({
      id: i + 1,
      name: names[i % names.length] + '有限公司',
      industry: industries[i % industries.length],
      level: levels[i % levels.length],
      source: sources[i % sources.length],
      contact: ['张经理', '李总', '王主管', '赵助理', '陈先生', '刘女士'][i % 6],
      phone: `138${String(10000000 + i).slice(-8)}`,
      status: i % 3 === 0 ? t('crmPool.unassigned') : t('crmPool.claimable'),
      createTime: `2025-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 09:00:00`
    }))
    let filtered = all
    if (name) filtered = filtered.filter(x => x.name.includes(name))
    if (level) filtered = filtered.filter(x => x.level === level)
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = t('crmPool.addCustomer'); Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.industry = t('crmPool.manufacturing'); formData.level = 'C'; formData.source = t('crmPool.online'); dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = t('crm.editCustomer'); Object.assign(formData, row); dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('common.success')); dialogVisible.value = false; loadData() }
  catch { ElMessage.error(t('common.failed')) }
  finally { submitLoading.value = false }
}
async function handleClaimOne(row) {
  await ElMessageBox.confirm(t('crmPool.confirmClaim', { name: row.name }), t('header.tips'), { type: 'warning' })
  ElMessage.success(t('common.success'))
  loadData()
}
async function handleClaim() {
  if (!selectedRows.value.length) return ElMessage.warning(t('crmPool.selectCustomer'))
  await ElMessageBox.confirm(t('crmPool.confirmClaimBatch', { count: selectedRows.value.length }), t('header.tips'), { type: 'warning' })
  ElMessage.success(t('common.success'))
  loadData()
}
function getActions(row) {
  return [
    { key: 'view', label: t('common.detail'), type: 'primary', handler: handleView },
    { key: 'claim', label: t('crmPool.claim'), type: 'success', handler: handleClaimOne },
    { key: 'edit', label: t('common.edit'), type: 'primary', handler: handleEdit }
  ]
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base);
  .toolbar-left { display: flex; gap: 10px; }
  .toolbar-right { display: flex; gap: 8px; }
}
</style>
