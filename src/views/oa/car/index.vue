<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">用车申请</el-button>
      </div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" circle @click="loadData" />
      </div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }">
        <el-tag :type="statusMap[row.status]?.type || 'info'" size="small">{{ row.status }}</el-tag>
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
        <el-form-item label="申请人" prop="applicant"><el-input v-model="formData.applicant" /></el-form-item>
        <el-form-item label="部门" prop="dept"><el-input v-model="formData.dept" /></el-form-item>
        <el-form-item label="用车类型" prop="carType">
          <el-select v-model="formData.carType" style="width: 100%">
            <el-option v-for="o in carTypes" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="用车时间" prop="useTime"><el-input v-model="formData.useTime" placeholder="例如 2025-06-23 09:00" /></el-form-item>
        <el-form-item label="返回时间" prop="returnTime"><el-input v-model="formData.returnTime" placeholder="例如 2025-06-23 18:00" /></el-form-item>
        <el-form-item label="目的地" prop="destination"><el-input v-model="formData.destination" /></el-form-item>
        <el-form-item label="乘车人数" prop="passengers"><el-input-number v-model="formData.passengers" :min="1" :max="50" style="width: 100%" /></el-form-item>
        <el-form-item label="用车事由" prop="reason"><el-input v-model="formData.reason" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialog">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 审批/派车弹窗 -->
    <el-dialog v-model="approveVisible" :title="approveTitle" width="500px" :close-on-click-modal="false">
      <el-form :model="approveForm" label-width="100px">
        <el-form-item label="申请人"><el-input :value="approveRow?.applicant" disabled /></el-form-item>
        <el-form-item label="用车类型"><el-input :value="approveRow?.carType" disabled /></el-form-item>
        <el-form-item label="目的地"><el-input :value="approveRow?.destination" disabled /></el-form-item>
        <el-form-item label="用车时间"><el-input :value="approveRow?.useTime" disabled /></el-form-item>
        <el-form-item v-if="approveForm.approved" label="车牌号" required>
          <el-input v-model="approveForm.carNo" placeholder="例如 京A12345" />
        </el-form-item>
        <el-form-item v-if="approveForm.approved" label="司机" required>
          <el-input v-model="approveForm.driver" placeholder="请输入司机姓名" />
        </el-form-item>
        <el-form-item v-if="approveForm.approved" label="联系电话">
          <el-input v-model="approveForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item v-if="!approveForm.approved" label="驳回原因" required>
          <el-input v-model="approveForm.comment" type="textarea" :rows="3" placeholder="请输入驳回原因" />
        </el-form-item>
        <el-form-item v-else label="备注">
          <el-input v-model="approveForm.comment" type="textarea" :rows="2" placeholder="可输入派车说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveVisible = false">取消</el-button>
        <el-button :type="approveForm.approved ? 'success' : 'danger'" :loading="approveLoading" @click="submitApprove">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情 -->
    <el-dialog v-model="viewVisible" title="用车申请详情" width="600px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="申请人">{{ viewRow.applicant }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ viewRow.dept }}</el-descriptions-item>
        <el-descriptions-item label="用车类型">{{ viewRow.carType }}</el-descriptions-item>
        <el-descriptions-item label="乘车人数">{{ viewRow.passengers }} 人</el-descriptions-item>
        <el-descriptions-item label="用车时间">{{ viewRow.useTime }}</el-descriptions-item>
        <el-descriptions-item label="返回时间">{{ viewRow.returnTime }}</el-descriptions-item>
        <el-descriptions-item label="目的地">{{ viewRow.destination }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ viewRow.status }}</el-descriptions-item>
        <el-descriptions-item label="用车事由" :span="2">{{ viewRow.reason }}</el-descriptions-item>
        <el-descriptions-item v-if="viewRow.carNo" label="车牌号">{{ viewRow.carNo }}</el-descriptions-item>
        <el-descriptions-item v-if="viewRow.driver" label="司机">{{ viewRow.driver }}</el-descriptions-item>
        <el-descriptions-item v-if="viewRow.driverPhone" label="司机电话" :span="2">{{ viewRow.driverPhone }}</el-descriptions-item>
        <el-descriptions-item v-if="viewRow.approver" label="审批人">{{ viewRow.approver }}</el-descriptions-item>
        <el-descriptions-item v-if="viewRow.approveTime" label="审批时间">{{ viewRow.approveTime }}</el-descriptions-item>
        <el-descriptions-item v-if="viewRow.approveComment" label="审批意见" :span="2">{{ viewRow.approveComment }}</el-descriptions-item>
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

const statusMap = { 0: { label: '待审批', type: 'warning' }, 1: { label: '已批准', type: 'success' }, 2: { label: '已驳回', type: 'danger' }, 3: { label: '已派出', type: 'primary' } }
const statusOptions = [{ value: 0, label: '待审批' }, { value: 1, label: '已批准' }, { value: 2, label: '已驳回' }, { value: 3, label: '已派出' }]
const carTypes = ['商务车', '轿车', '中巴', '大巴', '货车']

const searchItems = [
  { prop: 'applicant', label: '申请人', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: statusOptions }
]
const columns = [
  { prop: 'applicant', label: '申请人', width: 100 },
  { prop: 'dept', label: '部门', width: 120 },
  { prop: 'carType', label: '用车类型', width: 100 },
  { prop: 'useTime', label: '用车时间', width: 160 },
  { prop: 'returnTime', label: '返回时间', width: 160 },
  { prop: 'destination', label: '目的地', width: 140 },
  { prop: 'passengers', label: '乘车人数', width: 100, align: 'center' },
  { prop: 'status', label: '状态', width: 100, slot: 'status' }
]
const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref('用车申请'), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const approveVisible = ref(false), approveLoading = ref(false), approveRow = ref(null), approveTitle = ref('')
const approveForm = reactive({ approved: true, comment: '', carNo: '', driver: '', phone: '' })
const queryParams = reactive({ pageNum: 1, pageSize: 10, applicant: '', status: '' })
const formData = reactive({ id: undefined, applicant: '', dept: '', carType: '商务车', useTime: '', returnTime: '', destination: '', passengers: 1, reason: '' })
const formRules = { applicant: [{ required: true, message: '请输入申请人', trigger: 'blur' }], useTime: [{ required: true, message: '请输入用车时间', trigger: 'blur' }] }
const names = ['张伟', '李娜', '王强', '赵敏', '刘芳', '陈晨', '黄磊', '周杰']
const depts = ['销售部', '市场部', '研发部', '采购部', '财务部', '行政部']
const destinations = ['机场', '客户A公司', '客户B工厂', '高铁站', '展览中心', '总部', '分公司']
const carTypeList = ['商务车', '轿车', '中巴', '大巴', '货车']
const drivers = ['王师傅', '李师傅', '张师傅', '刘师傅', '赵师傅']
const carNumbers = ['京A12345', '京B67890', '京C11111', '京D22222', '京E33333']

async function loadData() {
  loading.value = true
  try {
    const { applicant = '', status = '', pageNum = 1, pageSize = 10 } = queryParams
    const all = Array.from({ length: 30 }, (_, i) => {
      const stt = i % 4
      return {
        id: i + 1,
        applicant: names[i % names.length],
        dept: depts[i % depts.length],
        carType: carTypeList[i % carTypeList.length],
        useTime: `2025-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 09:00`,
        returnTime: `2025-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 18:00`,
        destination: destinations[i % destinations.length],
        passengers: ((i % 5) + 1),
        status: stt,
        reason: ['客户接待', '员工通勤', '货物运输', '参展', '外出会议'][i % 5],
        carNo: stt >= 1 ? carNumbers[i % carNumbers.length] : '',
        driver: stt >= 1 ? drivers[i % drivers.length] : '',
        driverPhone: stt >= 1 ? `138${String(10000000 + i).slice(-8)}` : '',
        approver: stt !== 0 ? '张总监' : '',
        approveTime: stt !== 0 ? `2025-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 14:00:00` : '',
        approveComment: stt === 2 ? '当天车辆紧张，请改期' : (stt === 1 ? '已安排司机' : (stt === 3 ? '准时出发' : ''))
      }
    })
    let filtered = all
    if (applicant) filtered = filtered.filter(x => x.applicant.includes(applicant))
    if (status !== '') filtered = filtered.filter(x => x.status === Number(status))
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '用车申请'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.carType = '商务车'; formData.passengers = 1; dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = '编辑用车申请'; Object.assign(formData, row); dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function openApprove(row, approved) {
  approveRow.value = row
  approveForm.approved = approved
  approveForm.comment = ''
  approveForm.carNo = ''
  approveForm.driver = ''
  approveForm.phone = ''
  approveTitle.value = approved ? '批准并派车' : '驳回申请'
  approveVisible.value = true
}
async function submitApprove() {
  if (!approveForm.approved) {
    if (!approveForm.comment.trim()) { ElMessage.warning('请填写驳回原因'); return }
  } else {
    if (!approveForm.carNo.trim() || !approveForm.driver.trim()) { ElMessage.warning('请填写车牌号和司机'); return }
  }
  approveLoading.value = true
  try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(approveForm.approved ? '已批准并派出车辆' : '已驳回'); approveVisible.value = false; loadData() }
  finally { approveLoading.value = false }
}
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitLoading.value = true
  try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('提交成功'); dialogVisible.value = false; loadData() }
  catch { ElMessage.error('提交失败') }
  finally { submitLoading.value = false }
}
async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除「${row.applicant}」的用车申请?`, '提示', { type: 'warning' })
  ElMessage.success('删除成功')
  loadData()
}
function getActions(row) {
  const actions = [{ key: 'view', label: '查看', type: 'primary', handler: handleView }]
  if (row.status === 0) {
    actions.push({ key: 'approve', label: '批准', type: 'success', handler: (r) => openApprove(r, true) })
    actions.push({ key: 'reject', label: '驳回', type: 'danger', handler: (r) => openApprove(r, false) })
    actions.push({ key: 'edit', label: '编辑', type: 'primary', handler: handleEdit })
  }
  actions.push({ key: 'delete', label: '删除', type: 'danger', handler: handleDelete })
  return actions
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>
