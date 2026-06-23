<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleAdd">新增工艺</el-button><el-button :icon="Download" plain>导出</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #isMain="{ row }"><el-tag :type="row.isMain ? 'success' : 'info'" size="small">{{ row.isMain ? '主工艺' : '替代' }}</el-tag></template>
      <template #status="{ row }"><el-tag :type="statusMap[row.status]?.type || 'info'" size="small">{{ statusMap[row.status]?.label || '未知' }}</el-tag></template>
      <template #totalCost="{ row }">{{ formatMoney(row.totalCost) }}</template>
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

    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="650px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>

    <el-dialog v-model="detailVisible" title="工艺路线工序明细" width="900px" :close-on-click-modal="false">
      <div class="detail-header" v-if="currentRow">
        <el-tag>工艺号：{{ currentRow.routingNo }}</el-tag>
        <el-tag type="success">产品：{{ currentRow.productName }}</el-tag>
        <el-tag type="warning">版本：{{ currentRow.version }}</el-tag>
        <el-tag type="info">总工时：{{ currentRow.totalTime }} 分钟</el-tag>
        <el-tag type="danger">总成本：{{ formatMoney(currentRow.totalCost) }}</el-tag>
      </div>
      <el-table :data="detailLines" border>
        <el-table-column prop="sequence" label="工序号" width="80" align="center" />
        <el-table-column prop="operationName" label="工序名称" width="100" />
        <el-table-column prop="workCenter" label="工作中心" width="160" />
        <el-table-column prop="standardTime" label="标准工时(min)" width="120" align="right" />
        <el-table-column prop="setupTime" label="准备时间(min)" width="120" align="right" />
        <el-table-column prop="waitTime" label="等待时间(min)" width="120" align="right" />
        <el-table-column prop="moveTime" label="转移时间(min)" width="120" align="right" />
        <el-table-column prop="unitCost" label="单位成本" width="100" align="right">
          <template #default="{ row }">{{ formatMoney(row.unitCost) }}</template>
        </el-table-column>
        <el-table-column label="关键工序" width="80" align="center">
          <template #default="{ row }"><el-tag v-if="row.isKey" type="danger" size="small">关键</el-tag><span v-else>-</span></template>
        </el-table-column>
        <el-table-column label="质检" width="70" align="center">
          <template #default="{ row }"><el-tag v-if="row.isQc" type="warning" size="small">是</el-tag><span v-else>-</span></template>
        </el-table-column>
        <el-table-column prop="description" label="说明" min-width="120" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Refresh, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import request from '@/utils/request'

function formatMoney(v) {
  if (v == null || v === '') return '0.00'
  return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const statusMap = { 0: { label: '草稿', type: 'info' }, 1: { label: '已审核', type: 'success' }, 2: { label: '已停用', type: 'warning' } }
const searchItems = [
  { prop: 'routingNo', label: '工艺号', type: 'input' },
  { prop: 'productName', label: '产品名称', type: 'input' },
  { prop: 'status', label: '状态', type: 'select', options: Object.entries(statusMap).map(([v, l]) => ({ value: Number(v), label: l.label })) }
]
const columns = [
  { prop: 'routingNo', label: '工艺号', width: 180 },
  { prop: 'productName', label: '产品名称', minWidth: 160 },
  { prop: 'version', label: '版本', width: 80 },
  { prop: 'isMain', label: '类型', width: 90, slot: 'isMain' },
  { prop: 'processCount', label: '工序数', width: 80, align: 'center' },
  { prop: 'totalTime', label: '总工时(分)', width: 110, align: 'right' },
  { prop: 'totalCost', label: '总成本', width: 110, slot: 'totalCost', align: 'right' },
  { prop: 'status', label: '状态', width: 100, slot: 'status' },
  { prop: 'createBy', label: '创建人', width: 90 }
]
const formItems = [
  { prop: 'routingNo', label: '工艺号', type: 'input' },
  { prop: 'productCode', label: '产品编码', type: 'input' },
  { prop: 'productName', label: '产品名称', type: 'input' },
  { prop: 'version', label: '版本', type: 'input' },
  { prop: 'isMain', label: '是否主工艺', type: 'switch' },
  { prop: 'remark', label: '备注', type: 'textarea', rows: 3, span: 24 }
]
const formRules = {
  routingNo: [{ required: true, message: '请输入工艺号', trigger: 'blur' }],
  productName: [{ required: true, message: '请输入产品名称', trigger: 'blur' }]
}

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false), formRef = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, routingNo: '', productName: '', status: '' })
const formData = reactive({ id: undefined, routingNo: '', productCode: '', productName: '', version: 'V1.0', isMain: true, remark: '' })
const detailVisible = ref(false), currentRow = ref(null), detailLines = ref([])

async function loadData() { loading.value = true; try { const res = await request({ url: '/api/production/process/list', method: 'get', params: queryParams }); tableData.value = res.data.list || []; total.value = res.data.total || 0 } finally { loading.value = false } }
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增工艺'; Object.keys(formData).forEach(k => formData[k] = ''); formData.version = 'V1.0'; formData.isMain = true; formData.id = undefined; dialogVisible.value = true }
async function handleView(r) { currentRow.value = r; const res = await request({ url: '/api/production/process/detail', method: 'get', params: { id: r.id } }); detailLines.value = res.data.lines || []; detailVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑工艺'; Object.assign(formData, r); dialogVisible.value = true }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('保存成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('保存失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除工艺【${row.routingNo}】?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
async function handleAudit(row) { await ElMessageBox.confirm(`确定审核工艺【${row.routingNo}】?`, '提示', { type: 'warning' }); ElMessage.success('审核成功'); loadData() }

function getActions(row) {
  const actions = [{ key: 'view', label: '查看', type: 'primary', handler: handleView }]
  if (row.status === 0) {
    actions.push({ key: 'edit', label: '编辑', type: 'primary', handler: handleEdit })
    actions.push({ key: 'audit', label: '审核', type: 'success', handler: handleAudit })
    actions.push({ key: 'delete', label: '删除', type: 'danger', handler: handleDelete })
  }
  return actions
}

function handleCommand(cmd, row) {
  const action = getActions(row).find(a => a.key === cmd)
  action?.handler(row)
}

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
.detail-header { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
</style>
