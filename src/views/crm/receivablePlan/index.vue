<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增回款计划</el-button>
      </div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" circle @click="loadData" />
      </div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #amount="{ row }">{{ formatMoney(row.amount) }}</template>
      <template #status="{ row }">
        <el-tag :type="row.status === '已回款' ? 'success' : row.status === '逾期' ? 'danger' : row.status === '部分回款' ? 'warning' : 'info'" size="small">{{ row.status }}</el-tag>
      </template>
      <template #operation="{ row }">
        <el-button v-for="action in getActions(row).slice(0, 3)" :key="action.key" :type="action.type" link size="small" @click="action.handler(row)">{{ action.label }}</el-button>
        <el-dropdown v-if="getActions(row).length > 3" trigger="click" @command="(cmd) => handleCommand(cmd, row)">
          <el-button type="primary" link size="small">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item v-for="action in getActions(row).slice(3)" :key="action.key" :command="action.key">{{ action.label }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </BaseTable>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false" @close="cancelDialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item label="客户名称" prop="customer"><el-input v-model="formData.customer" /></el-form-item>
        <el-form-item label="关联合同" prop="contractNo"><el-input v-model="formData.contractNo" /></el-form-item>
        <el-form-item label="期次" prop="period"><el-input-number v-model="formData.period" :min="1" :max="20" style="width: 100%" /></el-form-item>
        <el-form-item label="回款金额" prop="amount"><el-input-number v-model="formData.amount" :min="0" :precision="2" style="width: 100%" /></el-form-item>
        <el-form-item label="计划回款日" prop="planDate"><el-input v-model="formData.planDate" placeholder="例如 2025-06-30" /></el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option v-for="o in statusOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="owner"><el-input v-model="formData.owner" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialog">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 登记回款弹窗 -->
    <el-dialog v-model="receiveVisible" title="登记回款" width="500px" @close="cancelReceive">
      <el-form ref="receiveRef" :model="receiveForm" :rules="receiveRules" label-width="100px">
        <el-form-item label="客户名称"><el-input :value="receiveRow?.customer" disabled /></el-form-item>
        <el-form-item label="回款金额" prop="paidAmount"><el-input-number v-model="receiveForm.paidAmount" :min="0" :precision="2" style="width: 100%" /></el-form-item>
        <el-form-item label="实收日期" prop="paidDate"><el-input v-model="receiveForm.paidDate" placeholder="例如 2025-06-23" /></el-form-item>
        <el-form-item label="回款方式" prop="paidMethod">
          <el-select v-model="receiveForm.paidMethod" style="width: 100%">
            <el-option v-for="o in paidMethods" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark"><el-input v-model="receiveForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelReceive">取消</el-button>
        <el-button type="primary" :loading="receiveLoading" @click="submitReceive">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情 -->
    <el-dialog v-model="viewVisible" title="回款计划详情" width="600px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="客户名称">{{ viewRow.customer }}</el-descriptions-item>
        <el-descriptions-item label="关联合同">{{ viewRow.contractNo }}</el-descriptions-item>
        <el-descriptions-item label="期次">第{{ viewRow.period }}期</el-descriptions-item>
        <el-descriptions-item label="回款金额">{{ formatMoney(viewRow.amount) }}</el-descriptions-item>
        <el-descriptions-item label="计划回款日">{{ viewRow.planDate }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ viewRow.status }}</el-descriptions-item>
        <el-descriptions-item label="负责人">{{ viewRow.owner }}</el-descriptions-item>
        <el-descriptions-item label="已回金额">{{ formatMoney(viewRow.paidAmount || 0) }}</el-descriptions-item>
        <el-descriptions-item v-if="viewRow.paidDate" label="实收日期">{{ viewRow.paidDate }}</el-descriptions-item>
        <el-descriptions-item v-if="viewRow.paidMethod" label="回款方式">{{ viewRow.paidMethod }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'

function formatMoney(v) { if (v === null || v === undefined || v === '') return '0.00'; return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

const searchItems = [
  { prop: 'customer', label: '客户名称', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: [
    { value: '待回款', label: '待回款' }, { value: '部分回款', label: '部分回款' },
    { value: '已回款', label: '已回款' }, { value: '逾期', label: '逾期' }
  ]}
]
const columns = [
  { prop: 'customer', label: '客户名称', minWidth: 180 },
  { prop: 'contractNo', label: '合同编号', width: 160 },
  { prop: 'period', label: '期次', width: 80, align: 'center' },
  { prop: 'amount', label: '回款金额', width: 130, slot: 'amount', align: 'right' },
  { prop: 'planDate', label: '计划回款日', width: 130 },
  { prop: 'paidAmount', label: '已回金额', width: 130, slot: 'amount', align: 'right' },
  { prop: 'status', label: '状态', width: 100, slot: 'status' },
  { prop: 'owner', label: '负责人', width: 100 }
]
const statusOptions = ['待回款', '部分回款', '已回款', '逾期']
const paidMethods = ['银行转账', '承兑汇票', '现金', '支付宝', '微信', '其他']

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref('新增回款计划'), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const receiveVisible = ref(false), receiveLoading = ref(false), receiveRef = ref(null), receiveRow = ref(null)
const receiveForm = reactive({ paidAmount: 0, paidDate: '', paidMethod: '银行转账', remark: '' })
const queryParams = reactive({ pageNum: 1, pageSize: 10, customer: '', status: '' })
const formData = reactive({ id: undefined, customer: '', contractNo: '', period: 1, amount: undefined, planDate: '', status: '待回款', owner: '' })
const formRules = { customer: [{ required: true, message: '请输入客户名称', trigger: 'blur' }], amount: [{ required: true, message: '请输入回款金额', trigger: 'blur' }] }
const receiveRules = { paidAmount: [{ required: true, message: '请输入回款金额', trigger: 'blur' }], paidDate: [{ required: true, message: '请输入实收日期', trigger: 'blur' }] }
const customers = ['华为技术有限公司', '小米科技', '比亚迪汽车', '宁德时代新能源', '海康威视', '京东方科技', '三一重工']
const owners = ['张伟', '李娜', '王强', '赵敏', '刘芳']
const statuses = ['待回款', '部分回款', '已回款', '逾期']

async function loadData() {
  loading.value = true
  try {
    const { customer = '', status = '', pageNum = 1, pageSize = 10 } = queryParams
    const all = Array.from({ length: 38 }, (_, i) => ({
      id: i + 1,
      customer: customers[i % customers.length],
      contractNo: `HT-2025-${String(i + 1).padStart(4, '0')}`,
      period: (i % 4) + 1,
      amount: 50000 + (i * 3000) % 200000,
      planDate: `2025-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      paidAmount: i % 3 === 0 ? 50000 + (i * 3000) % 200000 : (i % 3 === 1 ? Math.floor((50000 + (i * 3000) % 200000) / 2) : 0),
      status: statuses[i % statuses.length],
      owner: owners[i % owners.length],
      paidDate: i % 3 !== 2 ? `2025-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}` : '',
      paidMethod: i % 3 !== 2 ? ['银行转账', '承兑汇票', '支付宝'][i % 3] : ''
    }))
    let filtered = all
    if (customer) filtered = filtered.filter(x => x.customer.includes(customer))
    if (status) filtered = filtered.filter(x => x.status === status)
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增回款计划'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.period = 1; formData.status = '待回款'; dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = '编辑回款计划'; Object.assign(formData, row); dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('保存成功'); dialogVisible.value = false; loadData() }
  catch { ElMessage.error('保存失败') }
  finally { submitLoading.value = false }
}
function openReceive(row) {
  receiveRow.value = row
  Object.assign(receiveForm, { paidAmount: row.amount, paidDate: row.planDate, paidMethod: '银行转账', remark: '' })
  receiveVisible.value = true
}
function cancelReceive() { receiveVisible.value = false; receiveRef.value?.resetFields() }
async function submitReceive() {
  const valid = await receiveRef.value?.validate().catch(() => false)
  if (!valid) return
  receiveLoading.value = true
  try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('登记成功'); receiveVisible.value = false; loadData() }
  catch { ElMessage.error('登记失败') }
  finally { receiveLoading.value = false }
}
async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除「${row.customer}」第${row.period}期回款计划?`, '提示', { type: 'warning' })
  ElMessage.success('删除成功')
  loadData()
}
function getActions(row) {
  const actions = [
    { key: 'view', label: '查看', type: 'primary', handler: handleView },
    { key: 'edit', label: '编辑', type: 'primary', handler: handleEdit },
    { key: 'receive', label: '登记回款', type: 'success', handler: openReceive }
  ]
  if (row.status !== '已回款') {
    actions.push({ key: 'delete', label: '删除', type: 'danger', handler: handleDelete })
  }
  return actions
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>
