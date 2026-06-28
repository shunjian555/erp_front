<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">{{ $t('oa.newTask') }}</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><el-tag :type="row.status === t('oa.statusCompleted') ? 'success' : row.status === t('oa.statusOverdue') ? 'danger' : row.status === t('oa.statusInProgress') ? 'warning' : 'info'" size="small">{{ row.status }}</el-tag></template>
      <template #priority="{ row }"><el-tag :type="row.priority === t('oa.priorityHigh') ? 'danger' : row.priority === t('oa.priorityMedium') ? 'warning' : 'info'" size="small">{{ row.priority }}</el-tag></template>
      <template #progress="{ row }"><el-progress :percentage="row.progress" :status="row.status === t('oa.statusCompleted') ? 'success' : ''" /></template>
      <template #operation="{ row }">
        <MoreActions :items="[
          { label: $t('common.detail'), onClick: () => handleView(row) },
          { label: $t('common.edit'), onClick: () => handleEdit(row) },
          { label: $t('oa.markComplete'), type: 'success', hidden: row.status === t('oa.statusCompleted'), onClick: () => handleComplete(row) },
          { label: $t('common.delete'), type: 'danger', onClick: () => handleDelete(row) }
        ]" />
      </template>
    </BaseTable>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" :close-on-click-modal="false" @close="cancelDialog">
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px">
        <el-form-item :label="$t('oa.taskTitle')" prop="title"><el-input v-model="formData.title" /></el-form-item>
        <el-form-item :label="$t('oa.owner')" prop="owner"><el-input v-model="formData.owner" /></el-form-item>
        <el-form-item :label="$t('oa.priority')" prop="priority">
          <el-radio-group v-model="formData.priority"><el-radio v-for="p in priorityOptions" :key="p" :value="p">{{ p }}</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item :label="$t('oa.startDate')" prop="startDate"><el-input v-model="formData.startDate" :placeholder="$t('oa.placeholderDate')" /></el-form-item>
        <el-form-item :label="$t('oa.dueDate')" prop="endDate"><el-input v-model="formData.endDate" :placeholder="$t('oa.placeholderEndDate')" /></el-form-item>
        <el-form-item :label="$t('oa.progress')" prop="progress"><el-input-number v-model="formData.progress" :min="0" :max="100" style="width: 100%" /></el-form-item>
        <el-form-item :label="$t('common.status')" prop="status">
          <el-select v-model="formData.status" style="width: 100%"><el-option v-for="o in statusOptions" :key="o" :label="o" :value="o" /></el-select>
        </el-form-item>
        <el-form-item :label="$t('oa.taskDescription')" prop="description"><el-input v-model="formData.description" type="textarea" :rows="3" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelDialog">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="viewVisible" :title="$t('oa.taskDetail')" width="600px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item :label="$t('oa.taskTitle')" :span="2">{{ viewRow.title }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.owner')">{{ viewRow.owner }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.priority')">{{ viewRow.priority }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.startDate')">{{ viewRow.startDate }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.dueDate')">{{ viewRow.endDate }}</el-descriptions-item>
        <el-descriptions-item :label="$t('common.status')">{{ viewRow.status }}</el-descriptions-item>
        <el-descriptions-item :label="$t('oa.progress')" :span="2"><el-progress :percentage="viewRow.progress" :status="viewRow.status === t('oa.statusCompleted') ? 'success' : ''" /></el-descriptions-item>
        <el-descriptions-item :label="$t('oa.taskDescription')" :span="2">{{ viewRow.description }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import MoreActions from '@/components/MoreActions.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const statusOptions = computed(() => [t('oa.statusPending'), t('oa.statusInProgress'), t('oa.statusCompleted'), t('oa.statusOverdue')])
const priorityOptions = computed(() => [t('oa.priorityHigh'), t('oa.priorityMedium'), t('oa.priorityLow')])
const searchItems = computed(() => [
  { prop: 'title', label: t('oa.taskTitle'), type: 'input' },
  { prop: 'owner', label: t('oa.owner'), type: 'input' },
  { prop: 'status', label: t('common.status'), type: 'select', options: statusOptions.value.map(v => ({ value: v, label: v })) }
])
const columns = computed(() => [
  { prop: 'title', label: t('oa.taskTitle'), minWidth: 200, showOverflowTooltip: true },
  { prop: 'owner', label: t('oa.owner'), width: 100 },
  { prop: 'priority', label: t('oa.priority'), width: 100, slot: 'priority' },
  { prop: 'startDate', label: t('oa.startDate'), width: 120 },
  { prop: 'endDate', label: t('oa.dueDate'), width: 120 },
  { prop: 'progress', label: t('oa.progress'), width: 180, slot: 'progress' },
  { prop: 'status', label: t('common.status'), width: 100, slot: 'status' }
])
const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, title: '', owner: '', status: '' })
const formData = reactive({ id: undefined, title: '', owner: '', priority: '', startDate: '', endDate: '', progress: 0, status: '', description: '' })
const formRules = computed(() => ({ title: [{ required: true, message: t('oa.inputTaskTitle'), trigger: 'blur' }] }))
const titles = ['Q2 销售报告', '产品需求评审', '客户回访', '系统功能优化', '市场调研', '项目周报', '数据备份', '培训资料准备', '招标方案编制', '客户演示准备']
const owners = ['张伟', '李娜', '王强', '赵敏', '刘芳', '陈晨', '黄磊', '周杰']

async function loadData() {
  loading.value = true
  try {
    const allS = statusOptions.value, allP = priorityOptions.value
    const { title = '', owner = '', status = '', pageNum = 1, pageSize = 10 } = queryParams
    const all = Array.from({ length: 60 }, (_, i) => ({
      id: i + 1, title: titles[i % titles.length] + (i > 9 ? ` #${Math.floor(i / 10) + 1}` : ''),
      owner: owners[i % owners.length], priority: allP[i % allP.length],
      startDate: `2025-${String((i % 6) + 1).padStart(2, '0')}-01`,
      endDate: `2025-${String((i % 6) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
      progress: i % 4 === 2 ? 100 : (i % 4 === 1 ? 50 : (i % 4 === 0 ? 0 : 30)),
      status: allS[i % allS.length], description: '详细任务说明文档待补充'
    }))
    let filtered = all
    if (title) filtered = filtered.filter(x => x.title.includes(title))
    if (owner) filtered = filtered.filter(x => x.owner.includes(owner))
    if (status) filtered = filtered.filter(x => x.status === status)
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize)); total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = t('oa.newTask'); Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.priority = t('oa.priorityMedium'); formData.progress = 0; formData.status = t('oa.statusPending'); dialogVisible.value = true }
function handleEdit(row) { dialogTitle.value = t('oa.editTask'); Object.assign(formData, row); dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success(t('oa.saveSuccess')); dialogVisible.value = false; loadData() } catch { ElMessage.error(t('oa.saveFailed')) } finally { submitLoading.value = false } }
async function handleComplete(row) { await ElMessageBox.confirm(t('oa.markCompleteConfirm', { title: row.title }), t('header.tips'), { type: 'warning' }); ElMessage.success(t('oa.markCompleteSuccess')); loadData() }
async function handleDelete(row) { await ElMessageBox.confirm(t('oa.deleteTaskConfirm', { title: row.title }), t('header.tips'), { type: 'warning' }); ElMessage.success(t('oa.deleteSuccess')); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
