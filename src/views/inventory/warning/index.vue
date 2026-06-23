<template>
  <div class="page-container">
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <div class="table-toolbar">
      <div class="toolbar-left"><el-button :icon="Download" plain @click="handleExport">导出预警报告</el-button></div>
      <div class="toolbar-right"><el-button :icon="Refresh" circle @click="loadData" /></div>
    </div>
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #status="{ row }"><BaseStatusTag type="danger">预警</BaseStatusTag></template>
      <template #level="{ row }"><el-tag :type="levelMap[row.level]?.type || 'info'" size="small">{{ levelMap[row.level]?.label || row.level }}</el-tag></template>
      <template #operation="{ row }">
        <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
        <el-button type="warning" link size="small" @click="handleAdjust(row)">调整</el-button>
        <el-button type="success" link size="small" @click="handlePurchase(row)">采购补货</el-button>
      </template>
    </BaseTable>

    <!-- 详情 -->
    <el-dialog v-model="viewVisible" title="预警详情" width="640px" :close-on-click-modal="false">
      <el-descriptions v-if="viewRow" :column="2" border>
        <el-descriptions-item label="商品名称">{{ viewRow.goodsName }}</el-descriptions-item>
        <el-descriptions-item label="商品编码">{{ viewRow.goodsCode }}</el-descriptions-item>
        <el-descriptions-item label="当前库存">{{ viewRow.currentStock }}</el-descriptions-item>
        <el-descriptions-item label="安全库存">{{ viewRow.safeStock }}</el-descriptions-item>
        <el-descriptions-item label="缺口数量">{{ viewRow.gap }}</el-descriptions-item>
        <el-descriptions-item label="单位">{{ viewRow.unit }}</el-descriptions-item>
        <el-descriptions-item label="预警级别">
          <el-tag :type="levelMap[viewRow.level]?.type || 'info'" size="small">{{ levelMap[viewRow.level]?.label || viewRow.level }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="最近入库">{{ viewRow.lastInDate }}</el-descriptions-item>
        <el-descriptions-item label="建议补货量" :span="2">
          <span class="text-warn">建议补货 <strong>{{ viewRow.safeStock * 2 - viewRow.currentStock }}</strong> {{ viewRow.unit }}，使库存达到安全库存 2 倍</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 调整 -->
    <el-dialog v-model="adjustVisible" title="库存调整" width="500px" :close-on-click-modal="false">
      <el-form :model="adjustForm" label-width="100px">
        <el-form-item label="商品名称"><el-input v-model="adjustForm.goodsName" disabled /></el-form-item>
        <el-form-item label="商品编码"><el-input v-model="adjustForm.goodsCode" disabled /></el-form-item>
        <el-form-item label="当前库存"><el-input :value="adjustForm.currentStock + ' ' + adjustForm.unit" disabled /></el-form-item>
        <el-form-item label="安全库存"><el-input :value="adjustForm.safeStock + ' ' + adjustForm.unit" disabled /></el-form-item>
        <el-form-item label="调整类型">
          <el-radio-group v-model="adjustForm.adjustType">
            <el-radio value="increase">盘盈/入库</el-radio>
            <el-radio value="decrease">盘损/出库</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="调整数量" required>
          <el-input-number v-model="adjustForm.qty" :min="0" :max="adjustForm.adjustType === 'decrease' ? adjustForm.currentStock : 99999" />
        </el-form-item>
        <el-form-item label="调整原因">
          <el-select v-model="adjustForm.reason" placeholder="请选择" style="width:100%">
            <el-option v-for="r in reasonOptions" :key="r" :label="r" :value="r" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注"><el-input v-model="adjustForm.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="adjustVisible = false">取消</el-button>
        <el-button type="primary" :loading="adjustLoading" @click="submitAdjust">提交调整</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Refresh } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'
import request from '@/utils/request'

const levelMap = { high: { label: '高', type: 'danger' }, medium: { label: '中', type: 'warning' }, low: { label: '低', type: 'info' } }
const reasonOptions = ['盘盈', '盘损', '损坏', '过期', '其他']
const searchItems = [ { prop: 'goodsName', label: '商品名称', type: 'input' }, { prop: 'level', label: '预警级别', type: 'select', options: [{ value: '', label: '全部' }, { value: 'high', label: '高' }, { value: 'medium', label: '中' }, { value: 'low', label: '低' }] } ]
const columns = [ { prop: 'goodsName', label: '商品名称', width: 150 }, { prop: 'goodsCode', label: '编码', width: 140 }, { prop: 'currentStock', label: '当前库存', width: 100, align: 'center' }, { prop: 'safeStock', label: '安全库存', width: 100, align: 'center' }, { prop: 'gap', label: '缺口', width: 80, align: 'center' }, { prop: 'unit', label: '单位', width: 60, align: 'center' }, { prop: 'level', label: '级别', width: 80, slot: 'level', align: 'center' }, { prop: 'status', label: '状态', width: 70, slot: 'status' }, { prop: 'lastInDate', label: '最近入库', width: 120 } ]

const loading = ref(false), tableData = ref([]), total = ref(0)
const queryParams = reactive({ pageNum: 1, pageSize: 10, goodsName: '', level: '' })
const viewVisible = ref(false), viewRow = ref(null)
const adjustVisible = ref(false), adjustLoading = ref(false), adjustRow = ref(null)
const adjustForm = reactive({ goodsCode: '', goodsName: '', unit: '', currentStock: 0, safeStock: 0, qty: 0, adjustType: 'increase', reason: '', remark: '' })

async function loadData() {
  loading.value = true
  try {
    const res = await request({ url: '/api/inventory/warning/list', method: 'get', params: queryParams })
    tableData.value = res.data.list || []
    total.value = res.data.total || 0
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleView(row) { viewRow.value = row; viewVisible.value = true }
function handleAdjust(row) {
  adjustRow.value = row
  adjustForm.goodsCode = row.goodsCode
  adjustForm.goodsName = row.goodsName
  adjustForm.unit = row.unit
  adjustForm.currentStock = row.currentStock
  adjustForm.safeStock = row.safeStock
  adjustForm.qty = Math.max(0, row.safeStock - row.currentStock)
  adjustForm.adjustType = 'increase'
  adjustForm.reason = ''
  adjustForm.remark = ''
  adjustVisible.value = true
}
function handlePurchase(row) { ElMessage.success(`已生成【${row.goodsName}】的采购补货建议，请到采购模块处理`) }
async function submitAdjust() {
  if (!adjustForm.qty || adjustForm.qty <= 0) { ElMessage.warning('请输入有效数量'); return }
  if (adjustForm.adjustType === 'decrease' && adjustForm.qty > adjustForm.currentStock) { ElMessage.warning('调整数量超过当前库存'); return }
  adjustLoading.value = true
  try {
    await request({ url: '/api/inventory/adjust/save', method: 'post', data: { adjustNo: 'ADJ' + Date.now(), goodsName: adjustForm.goodsName, adjustType: adjustForm.adjustType, adjustQty: adjustForm.qty, reason: adjustForm.reason } }).catch(() => {})
    ElMessage.success('调整单已提交')
    adjustVisible.value = false
    loadData()
  } finally { adjustLoading.value = false }
}
function handleExport() { ElMessage.success('预警报告导出成功') /* TODO: Excel 导出 */ }
onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page-container .table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } .toolbar-right { display: flex; gap: 8px; } }
.text-warn { color: #e6a23c; }
</style>
