<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新建批次</el-button>
        <el-button :icon="Download" plain @click="handleExport">导出</el-button>
      </div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><BaseStatusTag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '有效' : '失效' }}</BaseStatusTag></template>
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
    <el-dialog v-model="viewVisible" title="批次详情" width="500px">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="批次号">{{ viewRow.batchNo }}</el-descriptions-item>
        <el-descriptions-item label="商品">{{ viewRow.goodsName }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ viewRow.quantity }}</el-descriptions-item>
        <el-descriptions-item label="仓库">{{ viewRow.warehouse }}</el-descriptions-item>
        <el-descriptions-item label="生产日期">{{ viewRow.produceDate }}</el-descriptions-item>
        <el-descriptions-item label="有效期至">{{ viewRow.expireDate }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ viewRow.status === 1 ? '有效' : '失效' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ viewRow.remark }}</el-descriptions-item>
      </el-descriptions>
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
import BaseStatusTag from '@/components/BaseStatusTag.vue'

const searchItems = [ { prop: 'batchNo', label: '批次号', type: 'input' }, { prop: 'goodsName', label: '商品名称', type: 'input' } ]
const columns = [ { prop: 'batchNo', label: '批次号', width: 190 }, { prop: 'goodsName', label: '商品', width: 130 }, { prop: 'quantity', label: '数量', width: 80, align: 'center' }, { prop: 'produceDate', label: '生产日期', width: 120 }, { prop: 'expireDate', label: '有效期至', width: 120 }, { prop: 'warehouse', label: '仓库', width: 100 }, { prop: 'status', label: '状态', width: 80, slot: 'status' } ]
const formItems = [ { prop: 'batchNo', label: '批次号', type: 'input', span: 12 }, { prop: 'goodsName', label: '商品名称', type: 'input', span: 12 }, { prop: 'quantity', label: '数量', type: 'number', span: 12 }, { prop: 'produceDate', label: '生产日期', type: 'date', span: 12 }, { prop: 'expireDate', label: '有效期至', type: 'date', span: 12 }, { prop: 'remark', label: '备注', type: 'textarea', rows: 3, span: 24 } ]
const formRules = { batchNo: [{ required: true, message: '请输入批次号', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref('新建批次'), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const queryParams = reactive({ pageNum: 1, pageSize: 10, batchNo: '', goodsName: '' })
const formData = reactive({ id: undefined, batchNo: '', goodsName: '', quantity: undefined, produceDate: '', expireDate: '', remark: '' })

async function loadData() {
  loading.value = true
  try {
    const goodsList = ['苹果手机壳', '小米充电宝', '华为耳机', '联想键盘', '罗技鼠标']
    const whs = ['主仓库', '分仓库A', '华南仓库']
    const all = Array.from({ length: 25 }, (_, i) => {
      const stt = i % 6 === 5 ? 0 : 1
      return {
        id: i + 1,
        batchNo: `B${String(i + 1).padStart(4, '0')}`,
        goodsName: goodsList[i % goodsList.length],
        quantity: 100 + (i % 5) * 50,
        produceDate: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        expireDate: `2026-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        warehouse: whs[i % whs.length],
        status: stt,
        remark: i % 3 === 0 ? '常规批次' : '进口批次'
      }
    })
    const { batchNo = '', goodsName = '', pageNum = 1, pageSize = 10 } = queryParams
    let filtered = all
    if (batchNo) filtered = filtered.filter(x => x.batchNo.includes(batchNo))
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
function handleAdd() { dialogTitle.value = '新建批次'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑批次'; Object.assign(formData, r); dialogVisible.value = true }
function handleToggle(row) { row.status = row.status === 1 ? 0 : 1; ElMessage.success(`${row.status === 1 ? '启用' : '失效'}成功`) }
function handleExport() { ElMessage.success('已导出当前批次数据') }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('操作成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('操作失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除「${row.batchNo}」?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
function getActions(row) {
  const actions = [
    { key: 'view', label: '查看', type: 'primary', handler: handleView },
    { key: 'edit', label: '编辑', type: 'primary', handler: handleEdit }
  ]
  actions.push({ key: 'toggle', label: row.status === 1 ? '失效' : '启用', type: 'warning', handler: handleToggle })
  actions.push({ key: 'delete', label: '删除', type: 'danger', handler: handleDelete })
  return actions
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
