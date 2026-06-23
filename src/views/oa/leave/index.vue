<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">提交请假</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #leaveType="{ row }"><el-tag size="small">{{ leaveTypeMap[row.leaveType] || row.leaveType }}</el-tag></template>
      <template #status="{ row }"><BaseStatusTag :type="row.status === 2 ? 'success' : row.status === 0 ? 'warning' : 'info'">{{ ['待审批','已拒绝','已通过'][row.status] || '未知' }}</BaseStatusTag></template>
      <template #operation="{ row }"><el-button type="primary" link size="small" @click="handleView(row)">查看</el-button><el-button v-if="row.status === 0" type="danger" link size="small" @click="handleCancel(row)">撤销</el-button></template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" title="提交请假申请" width="550px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog">
      <BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="1" />
    </BaseDialog>
    <BaseDialog v-model="viewDialogVisible" title="请假详情" width="620px" :show-footer="false" @cancel="viewDialogVisible = false">
      <el-descriptions v-if="viewData.id" :column="2" border>
        <el-descriptions-item label="标题">{{ viewData.title }}</el-descriptions-item>
        <el-descriptions-item label="请假类型">
          <el-tag size="small">{{ leaveTypeMap[viewData.leaveType] || viewData.leaveType }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="开始日期">{{ viewData.startDate }}</el-descriptions-item>
        <el-descriptions-item label="结束日期">{{ viewData.endDate }}</el-descriptions-item>
        <el-descriptions-item label="请假天数">{{ viewData.days }} 天</el-descriptions-item>
        <el-descriptions-item label="审批状态">
          <BaseStatusTag :type="viewData.status === 2 ? 'success' : viewData.status === 0 ? 'warning' : 'info'">{{ ['待审批','已拒绝','已通过'][viewData.status] || '未知' }}</BaseStatusTag>
        </el-descriptions-item>
        <el-descriptions-item label="申请人">{{ viewData.applicantName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="申请时间">{{ viewData.createTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="请假原因" :span="2">{{ viewData.reason || '-' }}</el-descriptions-item>
        <template v-if="viewData.status !== 0">
          <el-descriptions-item label="审批人">{{ viewData.approverName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审批时间">{{ viewData.approveTime || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="viewData.status === 1" label="拒绝原因" :span="2">{{ viewData.approveRemark || '-' }}</el-descriptions-item>
        </template>
      </el-descriptions>
    </BaseDialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'

const leaveTypeMap = { annual: '年假', sick: '病假', personal: '事假', marriage: '婚假', maternity: '产假' }
const searchItems = [ { prop: 'startDate', label: '开始日期', type: 'date' }, { prop: 'endDate', label: '结束日期', type: 'date' } ]
const columns = [ { prop: 'title', label: '标题', minWidth: 150 }, { prop: 'leaveType', label: '类型', width: 90, slot: 'leaveType' }, { prop: 'startDate', label: '开始时间', width: 160 }, { prop: 'endDate', label: '结束时间', width: 160 }, { prop: 'days', label: '天数', width: 70, align: 'center' }, { prop: 'reason', label: '原因', minWidth: 150, showOverflowTooltip: true }, { prop: 'status', label: '状态', width: 90, slot: 'status' } ]
const formItems = [ { prop: 'title', label: '标题', type: 'input' }, { prop: 'leaveType', label: '请假类型', type: 'select', options: Object.entries(leaveTypeMap).map(([v, l]) => ({ value: v, label: l })) }, { prop: 'startDate', label: '开始日期', type: 'date' }, { prop: 'endDate', label: '结束日期', type: 'date' }, { prop: 'reason', label: '原因', type: 'textarea', rows: 3 } ]
const formRules = { title: [{ required: true, message: '请输入标题', trigger: 'blur' }], leaveType: [{ required: true, message: '请选择类型', trigger: 'change' }] }

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), submitLoading = ref(false), formRef = ref(null)
const viewDialogVisible = ref(false)
const viewData = reactive({ id: undefined, title: '', leaveType: '', startDate: '', endDate: '', days: '', reason: '', status: 0, applicantName: '', createTime: '', approverName: '', approveTime: '', approveRemark: '' })
const queryParams = reactive({ pageNum: 1, pageSize: 10, startDate: '', endDate: '' })
const formData = reactive({ id: undefined, title: '', leaveType: '', startDate: '', endDate: '', reason: '' })

async function loadData() { loading.value = true; try { const res = await (await import('@/utils/request')).default({ url: '/api/oa/leave/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }; function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('提交成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('提交失败') } finally { submitLoading.value = false } }
function handleView(row) { Object.assign(viewData, row); viewDialogVisible.value = true }
async function handleCancel(row) { await ElMessageBox.confirm('确定撤销?', '提示', { type: 'warning' }); ElMessage.success('撤销成功'); loadData() }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
