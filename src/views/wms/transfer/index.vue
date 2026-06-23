<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新建调拨单</el-button>
        <el-button :icon="Download" plain @click="handleExport">导出</el-button>
      </div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><el-tag :type="transferStatusMap[row.status]?.type || 'info'" size="small">{{ transferStatusMap[row.status]?.label || '未知' }}</el-tag></template>
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
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="600px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" :col-count="2" /></BaseDialog>

    <!-- 详情 -->
    <el-dialog v-model="viewVisible" title="调拨单详情" width="600px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="调拨单号">{{ viewRow.transferNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ transferStatusMap[viewRow.status]?.label }}</el-descriptions-item>
        <el-descriptions-item label="源仓库">{{ viewRow.fromWarehouse }}</el-descriptions-item>
        <el-descriptions-item label="目标仓库">{{ viewRow.toWarehouse }}</el-descriptions-item>
        <el-descriptions-item label="商品">{{ viewRow.goodsName }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ viewRow.quantity }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ viewRow.operator }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ viewRow.createTime }}</el-descriptions-item>
        <el-descriptions-item label="调拨原因" :span="2">{{ viewRow.reason }}</el-descriptions-item>
        <template v-if="viewRow.status === 1 || viewRow.status === 2 || viewRow.status === 3">
          <el-descriptions-item label="审核人">{{ viewRow.auditor || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核时间">{{ viewRow.auditTime || '-' }}</el-descriptions-item>
          <el-descriptions-item v-if="viewRow.auditOpinion" label="审核意见" :span="2">{{ viewRow.auditOpinion }}</el-descriptions-item>
        </template>
      </el-descriptions>
    </el-dialog>

    <!-- 审核弹窗 -->
    <el-dialog v-model="auditVisible" :title="auditForm.approved ? '审核通过' : '审核驳回'" width="500px">
      <el-form :model="auditForm" label-width="100px">
        <el-form-item label="调拨单号">{{ auditForm.transferNo }}</el-form-item>
        <el-form-item label="源仓库">{{ auditForm.fromWarehouse }} → {{ auditForm.toWarehouse }}</el-form-item>
        <el-form-item label="商品 / 数量">{{ auditForm.goodsName }} / {{ auditForm.quantity }}</el-form-item>
        <el-form-item :label="auditForm.approved ? '审核意见' : '驳回原因'" required>
          <el-input v-model="auditForm.auditOpinion" type="textarea" :rows="3" :placeholder="auditForm.approved ? '请输入审核意见' : '请输入驳回原因'" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAudit">确定</el-button>
      </template>
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

const transferStatusMap = { 0: { label: '待审核', type: 'warning' }, 1: { label: '已审核', type: '' }, 2: { label: '已发出', type: 'success' }, 3: { label: '已接收', type: 'success' } }
const searchItems = [ { prop: 'transferNo', label: '调拨单号', type: 'input' }, { prop: 'goodsName', label: '商品名称', type: 'input' } ]
const columns = [ { prop: 'transferNo', label: '调拨单号', width: 190 }, { prop: 'fromWarehouse', label: '源仓库', width: 120 }, { prop: 'toWarehouse', label: '目标仓库', width: 120 }, { prop: 'goodsName', label: '商品', width: 130 }, { prop: 'quantity', label: '数量', width: 80, align: 'center' }, { prop: 'operator', label: '操作人', width: 90 }, { prop: 'status', label: '状态', width: 90, slot: 'status' }, { prop: 'createTime', label: '创建时间', width: 170 } ]
const formItems = [ { prop: 'transferNo', label: '调拨单号', type: 'input', span: 12 }, { prop: 'goodsName', label: '商品名称', type: 'input', span: 12 }, { prop: 'fromWarehouse', label: '源仓库', type: 'input', span: 12 }, { prop: 'toWarehouse', label: '目标仓库', type: 'input', span: 12 }, { prop: 'quantity', label: '数量', type: 'number', span: 12 }, { prop: 'reason', label: '原因', type: 'textarea', rows: 3, span: 24 } ]
const formRules = { transferNo: [{ required: true, message: '请输入调拨单号', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref('新建调拨单'), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const auditVisible = ref(false), auditForm = reactive({ id: undefined, transferNo: '', fromWarehouse: '', toWarehouse: '', goodsName: '', quantity: undefined, approved: true, auditOpinion: '' })
const queryParams = reactive({ pageNum: 1, pageSize: 10, transferNo: '', goodsName: '' })
const formData = reactive({ id: undefined, transferNo: '', goodsName: '', fromWarehouse: '', toWarehouse: '', quantity: undefined, reason: '' })

async function loadData() {
  loading.value = true
  try {
    const goodsList = ['苹果手机壳', '小米充电宝', '华为耳机', '联想键盘', '罗技鼠标']
    const whs = ['主仓库', '分仓库A', '华南仓库']
    const all = Array.from({ length: 24 }, (_, i) => {
      const stt = i % 4
      const fromIdx = i % 3
      let toIdx = (fromIdx + 1 + (i % 2)) % 3
      if (toIdx === fromIdx) toIdx = (fromIdx + 1) % 3
      return {
        id: i + 1,
        transferNo: `TF${String(i + 1).padStart(4, '0')}`,
        fromWarehouse: whs[fromIdx],
        toWarehouse: whs[toIdx],
        goodsName: goodsList[i % goodsList.length],
        quantity: 50 + (i % 5) * 30,
        operator: ['张三', '李四', '王五', '赵六'][i % 4],
        status: stt,
        createTime: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 09:00:00`,
        reason: '库存调拨',
        auditor: stt > 0 ? ['王经理', '李总'][i % 2] : '',
        auditTime: stt > 0 ? `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 14:00:00` : '',
        auditOpinion: stt === 0 ? '' : (i % 3 === 0 ? '同意' : '情况属实，批准')
      }
    })
    const { transferNo = '', goodsName = '', pageNum = 1, pageSize = 10 } = queryParams
    let filtered = all
    if (transferNo) filtered = filtered.filter(x => x.transferNo.includes(transferNo))
    if (goodsName) filtered = filtered.filter(x => x.goodsName.includes(goodsName))
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新建调拨单'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.status = 0; dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑调拨单'; Object.assign(formData, r); dialogVisible.value = true }
function openAudit(row, approved) { Object.assign(auditForm, row, { approved, auditOpinion: '' }); auditVisible.value = true }
async function confirmAudit() {
  if (!auditForm.auditOpinion.trim()) { ElMessage.warning(auditForm.approved ? '请输入审核意见' : '请输入驳回原因'); return }
  const row = tableData.value.find(x => x.id === auditForm.id)
  if (row) { row.status = 1; row.auditor = '当前用户'; row.auditTime = new Date().toISOString().slice(0, 19).replace('T', ' '); row.auditOpinion = auditForm.auditOpinion }
  ElMessage.success(auditForm.approved ? '审核通过' : '已驳回')
  auditVisible.value = false
}
function handleOutbound(row) { row.status = 2; ElMessage.success('已发出') }
function handleReceive(row) { row.status = 3; ElMessage.success('已确认接收') }
function handleExport() { ElMessage.success('已导出调拨单数据') }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false } }
async function handleDelete(row) {
  if (row.status !== 0) { ElMessage.warning('只能删除待审核的调拨单'); return }
  await ElMessageBox.confirm(`确定删除「${row.transferNo}」?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData()
}
function getActions(row) {
  const actions = [{ key: 'view', label: '查看', type: 'primary', handler: handleView }]
  if (row.status === 0) {
    actions.push({ key: 'approve', label: '通过', type: 'success', handler: (r) => openAudit(r, true) })
    actions.push({ key: 'reject', label: '驳回', type: 'danger', handler: (r) => openAudit(r, false) })
    actions.push({ key: 'edit', label: '编辑', type: 'primary', handler: handleEdit })
  }
  if (row.status === 1) { actions.push({ key: 'outbound', label: '发出', type: 'warning', handler: handleOutbound }) }
  if (row.status === 2) { actions.push({ key: 'receive', label: '接收', type: 'success', handler: handleReceive }) }
  if (row.status === 0) { actions.push({ key: 'delete', label: '删除', type: 'danger', handler: handleDelete }) }
  return actions
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
