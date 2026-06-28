<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">{{ $t('oa.newAttendance') }}</el-button>
        <el-button :icon="Download" plain @click="handleExport">{{ $t('oa.exportReport') }}</el-button>
      </div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><el-tag :type="statusTagType(row.status)" size="small">{{ row.status }}</el-tag></template>
      <template #operation="{ row }">
        <el-button type="primary" link size="small" @click="handleView(row)">{{ $t('common.detail') }}</el-button>
        <el-button type="primary" link size="small" @click="handleEdit(row)">{{ $t('common.edit') }}</el-button>
        <el-button type="danger" link size="small" @click="handleDelete(row)">{{ $t('common.delete') }}</el-button>
      </template>
    </BaseTable>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false" @close="cancelDialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item :label="$t('oa.employeeName')" prop="name"><el-input v-model="formData.name" /></el-form-item>
        <el-form-item :label="$t('oa.department')" prop="dept"><el-input v-model="formData.dept" /></el-form-item>
        <el-form-item :label="$t('oa.date')" prop="date"><el-input v-model="formData.date" :placeholder="$t('oa.placeholderDate')" /></el-form-item>
        <el-form-item :label="$t('oa.clockIn')" prop="clockIn"><el-input v-model="formData.clockIn" :placeholder="$t('oa.placeholderTime')" /></el-form-item>
        <el-form-item :label="$t('oa.clockOut')" prop="clockOut"><el-input v-model="formData.clockOut" :placeholder="$t('oa.placeholderTimeEnd')" /></el-form-item>
        <el-form-item :label="$t('oa.workHours')" prop="workHours"><el-input-number v-model="formData.workHours" :min="0" :max="24" :precision="1" style="width: 100%" /></el-form-item>
        <el-form-item :label="$t('oa.attendanceStatus')" prop="status">
          <el-select v-model="formData.status" style="width: 100%">
            <el-option v-for="o in statusOptions" :key="o" :label="o" :value="o" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('oa.remark')" prop="remark"><el-input v-model="formData.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialog">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewVisible" :title="$t('oa.attendanceDetail')" width="600px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item :label="$t('oa.employeeName')">{{ viewRow.name }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.department')">{{ viewRow.dept }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.date')">{{ viewRow.date }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.clockIn')">{{ viewRow.clockIn }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.clockOut')">{{ viewRow.clockOut }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.workHours')">{{ viewRow.workHours }} {{ $t('oa.hoursUnit') }}</el-descriptions-item>
        <el-descriptions-item :label="$t('common.status')">{{ viewRow.status }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.remark')" :span="2">{{ viewRow.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Download } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const statusOptions = computed(() => [t('oa.statusNormal'), t('oa.statusLate'), t('oa.statusEarlyLeave'), t('oa.statusAbsent'), t('oa.statusOnLeave')])
function statusTagType(s) {
  const map = { [t('oa.statusNormal')]: 'success', [t('oa.statusLate')]: 'warning', [t('oa.statusEarlyLeave')]: 'warning', [t('oa.statusAbsent')]: 'danger', [t('oa.statusOnLeave')]: 'info' }
  return map[s] || 'info'
}
const searchItems = computed(() => [
  { prop: 'name', label: t('oa.employeeName'), type: 'input' },
  { prop: 'dept', label: t('oa.department'), type: 'input' },
  { prop: 'status', label: t('oa.attendanceStatus'), type: 'select', options: statusOptions.value.map(v => ({ value: v, label: v })) }
])
const columns = computed(() => [
  { prop: 'name', label: t('oa.employeeName'), width: 100 },
  { prop: 'dept', label: t('oa.department'), width: 120 },
  { prop: 'date', label: t('oa.date'), width: 120 },
  { prop: 'clockIn', label: t('oa.clockIn'), width: 100 },
  { prop: 'clockOut', label: t('oa.clockOut'), width: 100 },
  { prop: 'workHours', label: t('oa.workHours'), width: 110, align: 'right' },
  { prop: 'status', label: t('common.status'), width: 100, slot: 'status' }
])
const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, name: '', dept: '', status: '' })
const formData = reactive({ id: undefined, name: '', dept: '', date: '', clockIn: '', clockOut: '', workHours: 8, status: '', remark: '' })
const formRules = computed(() => ({ name: [{ required: true, message: t('oa.inputEmployeeName'), trigger: 'blur' }], date: [{ required: true, message: t('oa.inputDate'), trigger: 'blur' }] }))
const names = ['张伟', '李娜', '王强', '赵敏', '刘芳', '陈晨', '黄磊', '周杰', '吴昊', '孙梦']
const depts = ['研发部', '销售部', '市场部', '财务部', '人事部', '行政部', '生产部', '采购部']

async function loadData() {
  loading.value = true
  try {
    const allS = statusOptions.value
    const { name = '', dept = '', status = '', pageNum = 1, pageSize = 10 } = queryParams
    const all = Array.from({ length: 80 }, (_, i) => ({
      id: i + 1, name: names[i % names.length], dept: depts[i % depts.length],
      date: `2025-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      clockIn: i % 5 === 1 ? '09:30' : '09:00', clockOut: i % 5 === 2 ? '17:30' : '18:00',
      workHours: i % 5 === 1 ? 7.5 : (i % 5 === 2 ? 7.5 : 8),
      status: allS[i % allS.length], remark: i % 5 === 3 ? '无故未到' : (i % 5 === 4 ? t('oa.statusOnLeave') : '')
    }))
    let filtered = all
    if (name) filtered = filtered.filter(x => x.name.includes(name))
    if (dept) filtered = filtered.filter(x => x.dept.includes(dept))
    if (status) filtered = filtered.filter(x => x.status === status)
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize)); total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = t('oa.newAttendance'); Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.workHours = 8; formData.status = t('oa.statusNormal'); dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = t('oa.editAttendance'); Object.assign(formData, row); dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('oa.saveSuccess')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('oa.saveFailed')) } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(t('oa.deleteAttendanceConfirm', { name: row.name, date: row.date }), t('header.tips'), { type: 'warning' }); ElMessage.success(t('oa.deleteSuccess')); loadData() }
function handleExport() { ElMessage.success(t('oa.exportSuccess')) }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
