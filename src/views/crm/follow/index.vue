<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">{{ t('crm.addFollowRecord') }}</el-button>
      </div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" circle @click="loadData" />
      </div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #method="{ row }">
        <el-tag :type="row.method === t('crmFollow.phone') ? 'success' : row.method === t('crmFollow.visit') ? 'warning' : 'info'" size="small">{{ row.method }}</el-tag>
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
        <el-form-item :label="t('crm.customerName')" prop="customer"><el-input v-model="formData.customer" /></el-form-item>
        <el-form-item :label="t('crm.contactName')" prop="contact"><el-input v-model="formData.contact" /></el-form-item>
        <el-form-item :label="t('crm.followType')" prop="method">
          <el-select v-model="formData.method" style="width: 100%">
            <el-option v-for="o in methodOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('crm.followContent')" prop="content"><el-input v-model="formData.content" type="textarea" :rows="3" /></el-form-item>
        <el-form-item :label="t('crmFollow.result')" prop="result">
          <el-select v-model="formData.result" style="width: 100%">
            <el-option v-for="o in resultOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item :label="t('crm.followTime')" prop="followTime"><el-input v-model="formData.followTime" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialog">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">{{ t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewVisible" :title="t('crmFollow.detail')" width="600px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item :label="t('crm.customerName')">{{ viewRow.customer }}</el-descriptions-item>
        <el-descriptions-item :label="t('crm.contactName')">{{ viewRow.contact }}</el-descriptions-item>
        <el-descriptions-item :label="t('crm.followType')">{{ viewRow.method }}</el-descriptions-item>
        <el-descriptions-item :label="t('crmFollow.result')">{{ viewRow.result }}</el-descriptions-item>
        <el-descriptions-item :label="t('crmFollow.follower')">{{ viewRow.follower }}</el-descriptions-item>
        <el-descriptions-item :label="t('crm.followTime')">{{ viewRow.followTime }}</el-descriptions-item>
        <el-descriptions-item :label="t('crm.followContent')" :span="2">{{ viewRow.content }}</el-descriptions-item>
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
  { prop: 'customer', label: t('crm.customerName'), type: 'input' },
  { prop: 'method', label: t('crm.followType'), type: 'select', options: [
    { value: 'phone', label: t('crmFollow.phone') }, { value: 'visit', label: t('crmFollow.visit') },
    { value: 'wechat', label: t('crmFollow.wechat') }, { value: 'email', label: t('crmFollow.email') }
  ]}
]
const columns = [
  { prop: 'customer', label: t('crm.customerName'), width: 180 },
  { prop: 'contact', label: t('crm.contactName'), width: 100 },
  { prop: 'method', label: t('crm.followType'), width: 100, slot: 'method' },
  { prop: 'content', label: t('crm.followContent'), minWidth: 240, showOverflowTooltip: true },
  { prop: 'result', label: t('crmFollow.result'), width: 120 },
  { prop: 'follower', label: t('crmFollow.follower'), width: 100 },
  { prop: 'followTime', label: t('crm.followTime'), width: 170 }
]
const methodOptions = [t('crmFollow.phone'), t('crmFollow.visit'), t('crmFollow.wechat'), t('crmFollow.email')]
const resultOptions = [t('crmFollow.interested'), t('crmFollow.quoted'), t('crmFollow.followUp'), t('crmFollow.dealDone'), t('crmFollow.noCooperation')]

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, customer: '', method: '' })
const formData = reactive({ id: undefined, customer: '', contact: '', method: t('crmFollow.phone'), content: '', result: t('crmFollow.followUp'), follower: '', followTime: '' })
const customers = ['华为技术有限公司', '小米科技', '比亚迪汽车', '宁德时代新能源', '海康威视', '京东方科技', '三一重工']
const contacts = ['张经理', '李总', '王主管', '赵助理', '陈先生', '刘女士']
const methodKeys = ['phone', 'visit', 'wechat', 'email']
const resultKeys = ['interested', 'quoted', 'followUp', 'dealDone', 'noCooperation']
const followers = ['张伟', '李娜', '王强', '赵敏']

async function loadData() {
  loading.value = true
  try {
    const { customer = '', method = '', pageNum = 1, pageSize = 10 } = queryParams
    const all = Array.from({ length: 56 }, (_, i) => ({
      id: i + 1,
      customer: customers[i % customers.length],
      contact: contacts[i % contacts.length],
      method: methodOptions[i % methodOptions.length],
      content: [t('crmFollow.content1'), t('crmFollow.content2'), t('crmFollow.content3'), t('crmFollow.content4'), t('crmFollow.content5'), t('crmFollow.content6')][i % 6],
      result: resultOptions[i % resultOptions.length],
      follower: followers[i % followers.length],
      followTime: `2025-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} ${String(i % 24).padStart(2, '0')}:00:00`
    }))
    let filtered = all
    if (customer) filtered = filtered.filter(x => x.customer.includes(customer))
    if (method) filtered = filtered.filter(x => x.method === method)
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = t('crm.addFollowRecord'); Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.method = t('crmFollow.phone'); formData.result = t('crmFollow.followUp'); dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = t('crm.editFollowRecord'); Object.assign(formData, row); dialogVisible.value = true }
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
async function handleDelete(row) {
  await ElMessageBox.confirm(t('crmFollow.confirmDelete', { customer: row.customer }), t('header.tips'), { type: 'warning' })
  ElMessage.success(t('common.success'))
  loadData()
}
function getActions(row) {
  return [
    { key: 'view', label: t('common.detail'), type: 'primary', handler: handleView },
    { key: 'edit', label: t('common.edit'), type: 'primary', handler: handleEdit },
    { key: 'delete', label: t('common.delete'), type: 'danger', handler: handleDelete }
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
