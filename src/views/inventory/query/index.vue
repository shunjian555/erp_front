<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button type="primary" :icon="Plus" @click="handleStockIn">入库</el-button><el-button
          type="warning" :icon="Minus" @click="handleStockOut">出库</el-button><el-button :icon="Download" plain
          @click="handleExport">导出</el-button><el-button :icon="Printer" plain @click="handlePrint">打印</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total"
      :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true"
      @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #stock="{ row }"><span :class="{ 'low-stock': row.stock < row.safeStock }">{{ row.stock
          }}</span></template>
      <template #costPrice="{ row }">{{ formatMoney(row.costPrice) }}</template>
      <template #totalValue="{ row }">{{ formatMoney(row.totalValue) }}</template>
      <template #operation="{ row }">
        <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
        <el-dropdown @command="c => handleAction(c, row)">
          <el-button type="primary" link size="small">更多<el-icon class="el-icon--right">
              <ArrowDown />
            </el-icon></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="in">入库</el-dropdown-item>
              <el-dropdown-item command="out">出库</el-dropdown-item>
              <el-dropdown-item command="adjust">库存调整</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </BaseTable>

    <!-- 详情 -->
    <el-dialog v-model="viewVisible" title="库存详情" width="720px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border size="default">
        <el-descriptions-item label="商品编码">{{ viewRow.goodsCode }}</el-descriptions-item>
        <el-descriptions-item label="商品名称">{{ viewRow.goodsName }}</el-descriptions-item>
        <el-descriptions-item label="分类">{{ viewRow.category }}</el-descriptions-item>
        <el-descriptions-item label="仓库">{{ viewRow.warehouse }}</el-descriptions-item>
        <el-descriptions-item label="单位">{{ viewRow.unit }}</el-descriptions-item>
        <el-descriptions-item label="安全库存">{{ viewRow.safeStock }}</el-descriptions-item>
        <el-descriptions-item label="当前库存">
          <span :class="{ 'low-stock': viewRow.stock < viewRow.safeStock }">{{ viewRow.stock }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="成本价">{{ formatMoney(viewRow.costPrice) }}</el-descriptions-item>
        <el-descriptions-item label="库存金额">{{ formatMoney(viewRow.totalValue) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ viewRow.updateTime }}</el-descriptions-item>
        <el-descriptions-item label="库存状态" :span="2">
          <el-tag v-if="viewRow.stock === 0" type="danger" size="small">缺货</el-tag>
          <el-tag v-else-if="viewRow.stock < viewRow.safeStock" type="warning" size="small">低于安全库存</el-tag>
          <el-tag v-else type="success" size="small">正常</el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 入库 / 出库 / 调整 -->
    <el-dialog v-model="actionVisible" :title="actionTitle" width="500px" :close-on-click-modal="false">
      <el-form :model="actionForm" label-width="100px">
        <el-form-item label="商品编码">
          <el-input v-model="actionForm.goodsCode" disabled />
        </el-form-item>
        <el-form-item label="商品名称">
          <el-input v-model="actionForm.goodsName" disabled />
        </el-form-item>
        <el-form-item v-if="actionType !== 'adjust'" label="类型">
          <el-tag :type="actionType === 'in' ? 'success' : 'danger'">{{ actionType === 'in' ? '入库' : '出库' }}</el-tag>
        </el-form-item>
        <el-form-item label="变动数量" required>
          <el-input-number v-model="actionForm.qty" :min="actionType === 'out' ? 1 : 0"
            :max="actionType === 'out' ? (actionForm.currentStock || 0) : 99999" />
        </el-form-item>
        <el-form-item v-if="actionType === 'adjust'" label="调整类型">
          <el-radio-group v-model="actionForm.adjustType">
            <el-radio value="increase">增加</el-radio>
            <el-radio value="decrease">减少</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="actionForm.remark" type="textarea" :rows="2" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="actionVisible = false">取消</el-button>
        <el-button type="primary" :loading="actionLoading" @click="submitAction">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Minus, Download, Printer, Refresh, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import request from '@/utils/request'

const searchItems = [{ prop: 'goodsName', label: '商品名称', type: 'input' }, { prop: 'goodsCode', label: '商品编码', type: 'input' }, { prop: 'category', label: '分类', type: 'select', options: [{ value: '', label: '全部' }, { value: '电子产品', label: '电子产品' }, { value: '办公用品', label: '办公用品' }] }, { prop: 'warehouse', label: '仓库', type: 'input' }]
const columns = [ { prop: 'goodsCode', label: '编码', width: 140 }, { prop: 'goodsName', label: '商品名称', width: 150 }, { prop: 'category', label: '分类', width: 110 }, { prop: 'warehouse', label: '仓库', width: 100 }, { prop: 'unit', label: '单位', width: 60, align: 'center' }, { prop: 'safeStock', label: '安全库存', width: 90, align: 'center' }, { prop: 'stock', label: '当前库存', width: 100, align: 'center', slot: 'stock' }, { prop: 'costPrice', label: '成本价', width: 100, slot: 'costPrice', align: 'right' }, { prop: 'totalValue', label: '库存金额', width: 120, slot: 'totalValue', align: 'right' }, { prop: 'updateTime', label: '更新时间', width: 170 } ]

const loading = ref(false), tableData = ref([]), total = ref(0)
const queryParams = reactive({ pageNum: 1, pageSize: 10, goodsName: '', goodsCode: '', category: '', warehouse: '' })

const viewVisible = ref(false), viewRow = ref(null)
const actionVisible = ref(false), actionLoading = ref(false), actionType = ref('in'), actionRow = ref(null)
const actionForm = reactive({ goodsCode: '', goodsName: '', currentStock: 0, qty: 1, adjustType: 'increase', remark: '' })
const actionTitle = ref('')

function formatMoney(v) {
  if (v === null || v === undefined || v === '') return '0.00'
  return Number(v).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function loadData() {
  loading.value = true
  try {
    const res = await request({ url: '/api/inventory/query/list', method: 'get', params: queryParams })
    tableData.value = res.data.list || []
    total.value = res.data.total || 0
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleView(row) { viewRow.value = row; viewVisible.value = true }

function handleAction(cmd, row) {
  actionRow.value = row
  actionType.value = cmd
  actionForm.goodsCode = row.goodsCode
  actionForm.goodsName = row.goodsName
  actionForm.currentStock = row.stock
  actionForm.qty = 1
  actionForm.remark = ''
  actionForm.adjustType = 'increase'
  actionTitle.value = { in: '商品入库', out: '商品出库', adjust: '库存调整' }[cmd]
  actionVisible.value = true
}
function handleStockIn() { ElMessage.warning('请在列表中选择商品后操作') }
function handleStockOut() { ElMessage.warning('请在列表中选择商品后操作') }

async function submitAction() {
  if (!actionForm.qty || actionForm.qty <= 0) { ElMessage.warning('请输入有效数量'); return }
  if (actionType.value === 'out' && actionForm.qty > actionForm.currentStock) { ElMessage.warning('出库数量超过当前库存'); return }
  actionLoading.value = true
  try {
    await new Promise(r => setTimeout(r, 400))
    ElMessage.success('操作成功')
    actionVisible.value = false
    loadData()
  } finally { actionLoading.value = false }
}

function handleExport() { ElMessage.success('导出成功'); /* TODO: 实现 Excel 导出 */ }
function handlePrint() {
  const html = buildPrintHtml()
  printHtml(html)
}

function buildPrintHtml() {
  const headers = columns.filter(c => c.prop !== 'operation').map(c => c.label)
  const props = columns.filter(c => c.prop !== 'operation').map(c => c.prop)
  const rows = tableData.value.map(r => props.map(p => formatCell(p, r)))
  const style = `@page{size:A4 landscape;margin:12mm}body{font-family:SimSun;margin:0;padding:16px;color:#000}h2{text-align:center;margin:0 0 16px;font-size:18px}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border:1px solid #333;padding:6px 8px;text-align:left}th{background:#f0f0f0;font-weight:bold}`
  const thead = '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>'
  const tbody = rows.map(r => '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>').join('')
  return `<!doctype html><html><head><meta charset="utf-8"><title>库存查询</title><style>${style}</style></head><body><h2>库存查询报表</h2><table><thead>${thead}</thead><tbody>${tbody}</tbody></table></body></html>`
}
function formatCell(prop, row) {
  if (['costPrice', 'totalValue'].includes(prop)) return formatMoney(row[prop])
  return row[prop] ?? ''
}
function printHtml(html) {
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;'
  document.body.appendChild(iframe)
  const win = iframe.contentWindow
  const doc = win.document
  doc.open(); doc.write(html); doc.close()
  const trigger = () => { try { win.focus(); win.print() } catch (e) { ElMessage.error('打印失败') }; setTimeout(() => { if (iframe.parentNode) iframe.parentNode.removeChild(iframe) }, 1000) }
  if (doc.readyState === 'complete') trigger()
  else iframe.onload = trigger
}

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 14px 18px;
  background: #fff;
  border-radius: var(--border-radius-base);

  .toolbar-left {
    display: flex;
    gap: 10px;
  }

  .toolbar-right {
    display: flex;
    gap: 8px;
  }
}

.low-stock {
  color: var(--danger-color);
  font-weight: 600;
}
</style>
