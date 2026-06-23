<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">生成条码</el-button>
        <el-button type="success" :icon="Printer" plain :disabled="selectedRows.length === 0" @click="handleBatchPrint">批量打印</el-button>
        <el-button :icon="Download" plain @click="handleExport">导出</el-button>
      </div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-selection="true" :show-index="true" @selection-change="handleSelectionChange" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #barcode="{ row }"><div style="display: flex; align-items: center; gap: 8px"><span style="font-family: monospace; font-weight: 600">{{ row.barcode }}</span><el-tag size="small" :type="row.type === 'EAN13' ? '' : 'warning'">{{ row.type }}</el-tag></div></template>
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
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="500px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog"><BaseForm ref="formRef" v-model="formData" :form-items="formItems" :form-rules="formRules" /></BaseDialog>
    <el-dialog v-model="viewVisible" title="条码详情" width="450px">
      <el-descriptions v-if="viewRow" :column="1" border>
        <el-descriptions-item label="条码">{{ viewRow.barcode }}</el-descriptions-item>
        <el-descriptions-item label="类型">{{ viewRow.type }}</el-descriptions-item>
        <el-descriptions-item label="商品名称">{{ viewRow.goodsName }}</el-descriptions-item>
        <el-descriptions-item label="批次号">{{ viewRow.batchNo }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ viewRow.quantity }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ viewRow.createTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
    <el-dialog v-model="previewVisible" title="条码预览" width="400px">
      <div style="text-align: center; padding: 30px 0">
        <div style="font-family: monospace; font-size: 20px; font-weight: 600; letter-spacing: 4px; padding: 20px; background: #fff; border: 1px solid #ddd; display: inline-block">{{ previewCode }}</div>
        <p style="margin-top: 16px; color: #909399">商品：{{ previewGoods }}</p>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Printer, Download, Refresh, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'

const searchItems = [ { prop: 'barcode', label: '条码', type: 'input' }, { prop: 'goodsName', label: '商品名称', type: 'input' }, { prop: 'type', label: '类型', type: 'select', options: [{ value: '', label: '全部' }, { value: 'EAN13', label: 'EAN-13' }, { value: 'CODE128', label: 'Code128' }] } ]
const columns = [ { prop: 'barcode', label: '条码', width: 200, slot: 'barcode' }, { prop: 'goodsName', label: '商品名称', width: 150 }, { prop: 'batchNo', label: '批次号', width: 150 }, { prop: 'type', label: '类型', width: 90 }, { prop: 'quantity', label: '数量', width: 80, align: 'center' }, { prop: 'createTime', label: '创建时间', width: 170 } ]
const formItems = [ { prop: 'goodsName', label: '商品名称', type: 'input' }, { prop: 'batchNo', label: '批次号', type: 'input' }, { prop: 'quantity', label: '数量', type: 'number' }, { prop: 'type', label: '类型', type: 'select', options: [{ value: 'EAN13', label: 'EAN-13' }, { value: 'CODE128', label: 'Code128' }] } ]
const formRules = { goodsName: [{ required: true, message: '请输入商品名称', trigger: 'blur' }] }

const loading = ref(false), tableData = ref([]), total = ref(0), selectedRows = ref([])
const dialogVisible = ref(false), dialogTitle = ref('生成条码'), submitLoading = ref(false), formRef = ref(null)
const viewVisible = ref(false), viewRow = ref(null)
const previewVisible = ref(false), previewCode = ref(''), previewGoods = ref('')
const queryParams = reactive({ pageNum: 1, pageSize: 10, barcode: '', goodsName: '', type: '' })
const formData = reactive({ id: undefined, goodsName: '', batchNo: '', quantity: 1, type: 'EAN13' })

async function loadData() {
  loading.value = true
  try {
    const goodsList = ['苹果手机壳', '小米充电宝', '华为耳机', '联想键盘', '罗技鼠标']
    const types = ['EAN13', 'CODE128']
    const all = Array.from({ length: 28 }, (_, i) => {
      const tp = types[i % 2]
      const code = tp === 'EAN13' ? `69${String(1000000000 + i).padStart(12, '0')}` : `BC${String(i + 1).padStart(8, '0')}`
      return {
        id: i + 1,
        barcode: code,
        goodsName: goodsList[i % goodsList.length],
        batchNo: `B${String((i % 5) + 1).padStart(4, '0')}`,
        type: tp,
        quantity: 1 + (i % 5) * 10,
        createTime: `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')} 10:00:00`
      }
    })
    const { barcode = '', goodsName = '', type = '', pageNum = 1, pageSize = 10 } = queryParams
    let filtered = all
    if (barcode) filtered = filtered.filter(x => x.barcode.includes(barcode))
    if (goodsName) filtered = filtered.filter(x => x.goodsName.includes(goodsName))
    if (type) filtered = filtered.filter(x => x.type === type)
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleSelectionChange(r) { selectedRows.value = r }
function handleAdd() { dialogTitle.value = '生成条码'; Object.keys(formData).forEach(k => formData[k] = ''); formData.id = undefined; formData.type = 'EAN13'; formData.quantity = 1; dialogVisible.value = true }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function handlePrint(row) { previewCode.value = row.barcode; previewGoods.value = row.goodsName; previewVisible.value = true }
function handleBatchPrint() { previewCode.value = selectedRows.value[0].barcode; previewGoods.value = `已选 ${selectedRows.value.length} 个条码`; previewVisible.value = true; ElMessage.success(`已发送 ${selectedRows.value.length} 个条码到打印机`) }
function handleExport() { ElMessage.success('已导出当前条码数据') }
function cancelDialog() { dialogVisible.value = false; formRef.value?.resetFields() }
async function handleSubmit() { const valid = await formRef.value?.validate().catch(() => false); if (!valid) return; submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('条码生成成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('生成失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除「${row.barcode}」?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
function getActions(row) {
  const actions = [
    { key: 'view', label: '查看', type: 'primary', handler: handleView },
    { key: 'print', label: '打印', type: 'success', handler: handlePrint }
  ]
  actions.push({ key: 'delete', label: '删除', type: 'danger', handler: handleDelete })
  return actions
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
</style>
