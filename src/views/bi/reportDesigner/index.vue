<template>
  <div class="page-container">
    <div class="designer-layout">
      <div class="left-panel">
        <div class="panel-title">数据源</div>
        <el-input v-model="searchKw" placeholder="搜索数据表" size="small" :prefix-icon="Search" clearable />
        <div class="data-source-list">
          <div v-for="t in filteredTables" :key="t.name" class="ds-item" :class="{ active: activeTable === t.name }" @click="activeTable = t.name">
            <el-icon><Coin /></el-icon>{{ t.name }}
          </div>
        </div>
        <div v-if="activeTable" class="field-panel">
          <div class="panel-subtitle">{{ activeTable }} - 字段</div>
          <div v-for="f in currentFields" :key="f" class="field-item" draggable="true" @dragstart="onDragStart($event, f)">
            <el-icon><Operation /></el-icon>{{ f }}
          </div>
        </div>
      </div>
      <div class="center-panel">
        <div class="panel-title">报表画布</div>
        <div class="canvas-area" @dragover.prevent @drop="onDrop">
          <div v-if="!canvasFields.length" class="canvas-placeholder">
            <el-icon><Plus /></el-icon>
            <p>从左侧拖拽字段到下方配置区</p>
          </div>
          <div v-else class="canvas-fields">
            <el-tag v-for="f in canvasFields" :key="f" closable @close="removeField(f)" type="primary" effect="light">{{ f }}</el-tag>
          </div>
        </div>
        <div class="canvas-config">
          <el-form :model="formData" label-width="100px" inline>
            <el-form-item label="报表名称"><el-input v-model="formData.name" placeholder="请输入" /></el-form-item>
            <el-form-item label="分组字段">
              <el-select v-model="formData.groupBy" multiple placeholder="选择分组" style="width: 240px">
                <el-option v-for="f in canvasFields" :key="f" :label="f" :value="f" />
              </el-select>
            </el-form-item>
            <el-form-item label="汇总方式">
              <el-select v-model="formData.agg" style="width: 160px">
                <el-option label="求和" value="sum" /><el-option label="计数" value="count" /><el-option label="平均" value="avg" /><el-option label="最大" value="max" /><el-option label="最小" value="min" />
              </el-select>
            </el-form-item>
            <el-form-item label="图表类型">
              <el-select v-model="formData.chartType" style="width: 160px">
                <el-option label="表格" value="table" /><el-option label="柱状图" value="bar" /><el-option label="折线图" value="line" /><el-option label="饼图" value="pie" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
        <div v-if="formData.chartType !== 'table'" class="preview-chart">
          <BaseChart :option="previewOption" height="320px" />
        </div>
        <div v-else class="preview-table">
          <el-table :data="previewRows" border size="small">
            <el-table-column v-for="c in previewCols" :key="c" :prop="c" :label="c" />
          </el-table>
        </div>
      </div>
      <div class="right-panel">
        <div class="panel-title">操作</div>
        <el-button type="primary" :icon="Plus" style="width: 100%" @click="handleSave">保存报表</el-button>
        <el-button :icon="VideoPlay" style="width: 100%; margin-top: 10px" @click="handlePreview">预览</el-button>
        <el-button :icon="Download" plain style="width: 100%; margin-top: 10px" @click="handleExport">导出</el-button>
        <el-divider />
        <div class="panel-subtitle">已保存的报表</div>
        <div v-for="r in savedReports" :key="r.id" class="saved-item">
          <span>{{ r.name }}</span>
          <el-button type="danger" link size="small" @click="deleteReport(r)">删除</el-button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Operation, Coin, VideoPlay, Download } from '@element-plus/icons-vue'
import BaseChart from '@/components/BaseChart.vue'
const tables = [
  { name: '销售订单', fields: ['订单号', '客户', '金额', '数量', '日期', '状态'] },
  { name: '采购订单', fields: ['采购单号', '供应商', '金额', '数量', '日期', '状态'] },
  { name: '库存', fields: ['商品编码', '商品名称', '库存数量', '仓库', '成本价'] },
  { name: '客户', fields: ['客户编码', '客户名称', '联系人', '电话', '等级'] },
  { name: '财务凭证', fields: ['凭证号', '科目', '借方', '贷方', '日期'] }
]
const searchKw = ref(''), activeTable = ref('销售订单'), canvasFields = ref(['日期', '金额'])
const currentFields = computed(() => tables.find(t => t.name === activeTable.value)?.fields || [])
const filteredTables = computed(() => tables.filter(t => !searchKw.value || t.name.includes(searchKw.value)))
const formData = reactive({ name: '销售月报', groupBy: ['日期'], agg: 'sum', chartType: 'bar' })
const savedReports = ref([
  { id: 1, name: '销售月报' }, { id: 2, name: '采购汇总' }, { id: 3, name: '库存周转分析' }
])
const previewRows = ref([])
const previewCols = computed(() => ['日期', '金额'])
const previewOption = computed(() => {
  const xData = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06']
  if (formData.chartType === 'bar') return { tooltip: {}, xAxis: { type: 'category', data: xData }, yAxis: { type: 'value' }, series: [{ type: 'bar', data: [120, 200, 150, 80, 70, 110], itemStyle: { color: '#409eff' } }] }
  if (formData.chartType === 'line') return { tooltip: {}, xAxis: { type: 'category', data: xData }, yAxis: { type: 'value' }, series: [{ type: 'line', data: [120, 200, 150, 80, 70, 110], smooth: true, itemStyle: { color: '#67c23a' } }] }
  return { tooltip: {}, series: [{ type: 'pie', data: [{ value: 1048, name: '产品A' }, { value: 735, name: '产品B' }, { value: 580, name: '产品C' }] }] }
})
function onDragStart(e, f) { e.dataTransfer.setData('text/plain', f) }
function onDrop(e) { const f = e.dataTransfer.getData('text/plain'); if (f && !canvasFields.value.includes(f)) canvasFields.value.push(f) }
function removeField(f) { canvasFields.value = canvasFields.value.filter(x => x !== f) }
function handleSave() { if (!formData.name) { ElMessage.warning('请输入报表名称'); return }; savedReports.value.push({ id: Date.now(), name: formData.name }); ElMessage.success('保存成功') }
function handlePreview() { previewRows.value = previewCols.value.map((c, i) => ({ [c]: i === 0 ? '2024-07' : 158200 })); browserPrint({ title: reportConfig.value.name || '报表预览' }) }
function handleExport() {
  const cols = selectedFields.value.map(f => ({ prop: f.name, label: f.label }))
  const rows = reportData.value.map(r => {
    const obj = {}
    selectedFields.value.forEach(f => { obj[f.name] = r[f.name] })
    return obj
  })
  exportToExcel(rows, cols, reportConfig.value.name || '自定义报表')
}
async function deleteReport(r) { await ElMessageBox.confirm(`确定删除「${r.name}」?`, '提示', { type: 'warning' }); savedReports.value = savedReports.value.filter(x => x.id !== r.id); ElMessage.success('已删除') }
onMounted(() => { handlePreview() })
</script>
<style lang="scss" scoped>
.designer-layout { display: grid; grid-template-columns: 240px 1fr 240px; gap: 16px; height: calc(100vh - 200px) }
.left-panel, .right-panel { background: #fff; padding: 16px; border-radius: 8px; overflow-y: auto }
.center-panel { background: #fff; padding: 16px; border-radius: 8px; overflow-y: auto }
.panel-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #409eff }
.panel-subtitle { font-size: 13px; color: #606266; margin: 16px 0 8px }
.data-source-list { margin-top: 12px; max-height: 200px; overflow-y: auto }
.ds-item { padding: 8px 10px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 13px; &:hover { background: #f5f7fa } &.active { background: #ecf5ff; color: #409eff } }
.field-panel { margin-top: 16px; padding-top: 16px; border-top: 1px solid #ebeef5 }
.field-item { padding: 6px 10px; margin: 4px 0; background: #f5f7fa; border-radius: 4px; cursor: move; display: flex; align-items: center; gap: 6px; font-size: 13px; &:hover { background: #e6f0ff } }
.canvas-area { min-height: 120px; padding: 20px; border: 2px dashed #dcdfe6; border-radius: 8px; display: flex; align-items: center; justify-content: center }
.canvas-placeholder { color: #909399; text-align: center; .el-icon { font-size: 32px; margin-bottom: 8px } }
.canvas-fields { display: flex; flex-wrap: wrap; gap: 8px; width: 100% }
.canvas-config { margin-top: 16px; padding: 16px; background: #fafbfc; border-radius: 6px }
.preview-chart, .preview-table { margin-top: 16px; padding: 16px; background: #fff; border: 1px solid #ebeef5; border-radius: 6px }
.saved-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px }
</style>
