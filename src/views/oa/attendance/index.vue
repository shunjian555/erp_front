<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增打卡</el-button>
        <el-button :icon="Download" plain @click="handleExport">导出报表</el-button>
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
        <el-form-item label="员工姓名" prop="name"><el-input v-model="formData.name" /></el-form-item>
        <el-form-item label="部门" prop="dept"><el-input v-model="formData.dept" /></el-form-item>
        <el-form-item label="日期" prop="date"><el-input v-model="formData.date" placeholder="例如 2025-06-23" /></el-form-item>
        <el-form-item label="上班打卡" prop="clockIn"><el-input v-model="formData.clockIn" placeholder="例如 09:00" /></el-form-item>
        <el-form-item label="下班打卡" prop="clockOut"><el-input v-model="formData.clockOut" placeholder="例如 18:00" /></el-form-item>
        <el-form-item label="工时(小时)" prop="workHours"><el-input-number v-model="formData.workHours" :min="0" :max="24" :precision="1" style="width: 100%" /></el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option v-for="o in statusOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark"><el-input v-model="formData.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialog">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 详情 -->
    <el-dialog v-model="viewVisible" title="考勤详情" width="600px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="员工姓名">{{ viewRow.name }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ viewRow.dept }}</el-descriptions-item>
        <el-descriptions-item label="日期">{{ viewRow.date }}</el-descriptions-item>
        <el-descriptions-item label="上班打卡">{{ viewRow.clockIn }}</el-descriptions-item>
        <el-descriptions-item label="下班打卡">{{ viewRow.clockOut }}</el-descriptions-item>
        <el-descriptions-item label="工时">{{ viewRow.workHours }} 小时</el-descriptions-item>
        <el-descriptions-item label="状态">{{ viewRow.status }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ viewRow.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Download, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'

const statusMap = {
  '正常': { type: 'success' }, '迟到': { type: 'warning' }, '早退': { type: 'warning' },
  '旷工': { type: 'danger' }, '请假': { type: 'info' }
}
const statusOptions = ['正常', '迟到', '早退', '旷工', '请假']

const searchItems = [
  { prop: 'name', label: '员工姓名', type: 'input' },
  { prop: 'dept', label: '部门', type: 'input' },
  { prop: 'status', label: '考勤状态', type: 'select', options: statusOptions.map(v => ({ value: v, label: v })) }
]
const columns = [
  { prop: 'name', label: '员工姓名', width: 100 },
  { prop: 'dept', label: '部门', width: 120 },
  { prop: 'date', label: '日期', width: 120 },
  { prop: 'clockIn', label: '上班打卡', width: 100 },
  { prop: 'clockOut', label: '下班打卡', width: 100 },
  { prop: 'workHours', label: '工时(小时)', width: 110, align: 'right' },
  { prop: 'status', label: '状态', width: 100, slot: 'status' }
]
const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref('新增打卡'), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, name: '', dept: '', status: '' })
const formData = reactive({ id: undefined, name: '', dept: '', date: '', clockIn: '', clockOut: '', workHours: 8, status: '正常', remark: '' })
const formRules = { name: [{ required: true, message: '请输入员工姓名', trigger: 'blur' }], date: [{ required: true, message: '请输入日期', trigger: 'blur' }] }
const names = ['张伟', '李娜', '王强', '赵敏', '刘芳', '陈晨', '黄磊', '周杰', '吴昊', '孙梦']
const depts = ['研发部', '销售部', '市场部', '财务部', '人事部', '行政部', '生产部', '采购部']
const statuses = ['正常', '迟到', '早退', '旷工', '请假']

async function loadData() {
  loading.value = true
  try {
    const { name = '', dept = '', status = '', pageNum = 1, pageSize = 10 } = queryParams
    const all = Array.from({ length: 80 }, (_, i) => ({
      id: i + 1,
      name: names[i % names.length],
      dept: depts[i % depts.length],
      date: `2025-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      clockIn: i % 5 === 1 ? '09:30' : '09:00',
      clockOut: i % 5 === 2 ? '17:30' : '18:00',
      workHours: i % 5 === 1 ? 7.5 : (i % 5 === 2 ? 7.5 : 8),
      status: statuses[i % statuses.length],
      remark: i % 5 === 3 ? '无故未到' : (i % 5 === 4 ? '事假' : '')
    }))
    let filtered = all
    if (name) filtered = filtered.filter(x => x.name.includes(name))
    if (dept) filtered = filtered.filter(x => x.dept.includes(dept))
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
function handleAdd() { dialogTitle.value = '新增打卡'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.workHours = 8; formData.status = '正常'; dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = '编辑打卡'; Object.assign(formData, row); dialogVisible.value = true }
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
async function handleDelete(row) {
  await ElMessageBox.confirm(`确定删除「${row.name}」${row.date}的考勤记录?`, '提示', { type: 'warning' })
  ElMessage.success('删除成功')
  loadData()
}
function handleExport() { ElMessage.success('导出成功（演示）') }
function getActions(row) {
  return [
    { key: 'view', label: '查看', type: 'primary', handler: handleView },
    { key: 'edit', label: '编辑', type: 'primary', handler: handleEdit },
    { key: 'delete', label: '删除', type: 'danger', handler: handleDelete }
  ]
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>
