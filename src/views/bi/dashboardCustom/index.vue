<template>
  <div class="page-container">
    <div class="dashboard-toolbar">
      <div>
        <el-button type="primary" :icon="Plus" @click="handleAddWidget">添加组件</el-button>
        <el-button :icon="Edit" @click="editMode = !editMode">{{ editMode ? '完成编辑' : '编辑布局' }}</el-button>
        <el-button :icon="DocumentCopy" @click="handleSaveTemplate">保存为模板</el-button>
        <el-button :icon="Refresh" @click="resetLayout">重置布局</el-button>
      </div>
      <div>
        <el-select v-model="currentTpl" style="width: 200px">
          <el-option v-for="t in templates" :key="t.id" :label="t.name" :value="t.id" />
        </el-select>
      </div>
    </div>
    <div class="dashboard-grid" :class="{ 'edit-mode': editMode }">
      <div v-for="(w, idx) in widgets" :key="w.id" class="widget-card" :style="{ gridColumn: `span ${w.w}` }" :draggable="editMode" @dragstart="onDragStart(idx)" @dragover.prevent @drop="onDrop(idx)">
        <div class="widget-header">
          <span class="widget-title">{{ w.title }}</span>
          <div class="widget-actions">
            <el-button v-if="editMode" :icon="Close" link size="small" @click="removeWidget(idx)" />
            <el-button v-if="editMode" :icon="FullScreen" link size="small" @click="resizeWidget(idx)" />
          </div>
        </div>
        <div class="widget-body">
          <div v-if="w.type === 'kpi'" class="kpi-widget">
            <div class="kpi-value">{{ w.value }}</div>
            <div class="kpi-trend" :style="{ color: w.trend > 0 ? '#67c23a' : '#f56c6c' }">
              {{ w.trend > 0 ? '↑' : '↓' }} {{ Math.abs(w.trend) }}%
            </div>
          </div>
          <BaseChart v-else-if="w.type === 'chart'" :option="w.option" height="220px" />
          <div v-else-if="w.type === 'table'" class="table-widget">
            <el-table :data="w.data" size="small" border>
              <el-table-column v-for="c in w.cols" :key="c" :prop="c" :label="c" />
            </el-table>
          </div>
        </div>
      </div>
    </div>
    <el-dialog v-model="addVisible" title="添加组件" width="500px">
      <el-form :model="newWidget" label-width="100px">
        <el-form-item label="组件类型">
          <el-select v-model="newWidget.type" style="width: 100%">
            <el-option label="KPI 指标" value="kpi" /><el-option label="图表" value="chart" /><el-option label="数据表" value="table" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题"><el-input v-model="newWidget.title" /></el-form-item>
        <el-form-item label="宽度">
          <el-radio-group v-model="newWidget.w">
            <el-radio :value="1">1/4</el-radio><el-radio :value="2">1/2</el-radio><el-radio :value="3">3/4</el-radio><el-radio :value="4">整行</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="newWidget.type === 'kpi'" label="指标值"><el-input v-model="newWidget.value" /></el-form-item>
        <el-form-item v-if="newWidget.type === 'kpi'" label="同比(%)"><el-input-number v-model="newWidget.trend" :min="-100" :max="100" style="width: 100%" /></el-form-item>
        <el-form-item v-if="newWidget.type === 'chart'" label="图表">
          <el-radio-group v-model="newWidget.chartType">
            <el-radio value="bar">柱状</el-radio><el-radio value="line">折线</el-radio><el-radio value="pie">饼图</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer><el-button @click="addVisible = false">取消</el-button><el-button type="primary" @click="confirmAdd">添加</el-button></template>
    </el-dialog>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, DocumentCopy, Refresh, Close, FullScreen } from '@element-plus/icons-vue'
import BaseChart from '@/components/BaseChart.vue'
const editMode = ref(false), addVisible = ref(false)
const templates = ref([{ id: 1, name: 'CEO 驾驶舱' }, { id: 2, name: '销售分析' }, { id: 3, name: '财务概览' }])
const currentTpl = ref(1)
const newWidget = reactive({ type: 'kpi', title: '', w: 2, value: '¥1,280,000', trend: 12, chartType: 'bar' })
const widgets = ref([
  { id: 1, type: 'kpi', title: '本月销售额', w: 1, value: '¥1,280,000', trend: 12 },
  { id: 2, type: 'kpi', title: '订单数', w: 1, value: '1,256', trend: 8 },
  { id: 3, type: 'kpi', title: '毛利率', w: 1, value: '32.5%', trend: -2 },
  { id: 4, type: 'kpi', title: '回款率', w: 1, value: '85.2%', trend: 5 },
  { id: 5, type: 'chart', title: '销售趋势', w: 2, option: { tooltip: {}, xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] }, yAxis: { type: 'value' }, series: [{ type: 'line', data: [120, 200, 150, 80, 70, 110], smooth: true, itemStyle: { color: '#409eff' }, areaStyle: { opacity: 0.3 } }] } },
  { id: 6, type: 'chart', title: '产品占比', w: 2, option: { tooltip: {}, series: [{ type: 'pie', radius: '60%', data: [{ value: 1048, name: '产品A' }, { value: 735, name: '产品B' }, { value: 580, name: '产品C' }, { value: 484, name: '产品D' }] }] } },
  { id: 7, type: 'table', title: 'TOP 客户', w: 4, cols: ['客户', '销售额', '订单数'], data: [{ '客户': 'A 客户', '销售额': '¥320,000', '订单数': 15 }, { '客户': 'B 客户', '销售额': '¥280,000', '订单数': 12 }, { '客户': 'C 客户', '销售额': '¥210,000', '订单数': 9 }] }
])
let dragIndex = -1
function onDragStart(idx) { dragIndex = idx }
function onDrop(idx) { if (dragIndex < 0 || dragIndex === idx) return; const item = widgets.value.splice(dragIndex, 1)[0]; widgets.value.splice(idx, 0, item); dragIndex = -1 }
function handleAddWidget() { Object.keys(newWidget).forEach(k => newWidget[k] = (k === 'type' ? 'kpi' : k === 'w' ? 2 : k === 'trend' ? 12 : k === 'chartType' ? 'bar' : '')); addVisible.value = true }
function confirmAdd() {
  if (!newWidget.title) { ElMessage.warning('请输入标题'); return }
  const w = { id: Date.now(), type: newWidget.type, title: newWidget.title, w: newWidget.w }
  if (newWidget.type === 'kpi') { w.value = newWidget.value; w.trend = newWidget.trend }
  else if (newWidget.type === 'chart') { w.option = { tooltip: {}, xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] }, yAxis: { type: 'value' }, series: [{ type: newWidget.chartType, data: [120, 200, 150, 80, 70, 110], itemStyle: { color: '#409eff' } }] } }
  else if (newWidget.type === 'table') { w.cols = ['名称', '值']; w.data = [{ '名称': '示例', '值': 100 }] }
  widgets.value.push(w); addVisible.value = false; ElMessage.success('已添加')
}
function removeWidget(idx) { widgets.value.splice(idx, 1) }
function resizeWidget(idx) { const sizes = [1, 2, 3, 4]; const w = widgets.value[idx]; w.w = sizes[(sizes.indexOf(w.w) + 1) % sizes.length] }
function handleSaveTemplate() { templates.value.push({ id: Date.now(), name: `自定义模板 ${templates.value.length + 1}` }); ElMessage.success('已保存为模板') }
function resetLayout() { ElMessage.success('已恢复默认布局') }
onMounted(() => {})
</script>
<style lang="scss" scoped>
.dashboard-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: 8px; .el-button + .el-button { margin-left: 8px } }
.dashboard-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; &.edit-mode .widget-card { cursor: move; border: 2px dashed #409eff } }
.widget-card { background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,.05); overflow: hidden; transition: all .2s; &:hover { box-shadow: 0 4px 12px rgba(0,0,0,.1) } }
.widget-header { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; border-bottom: 1px solid #f0f0f0; background: #fafbfc }
.widget-title { font-size: 14px; font-weight: 600 }
.widget-body { padding: 16px }
.kpi-widget { text-align: center }
.kpi-value { font-size: 28px; font-weight: 700; color: #303133; margin-bottom: 8px }
.kpi-trend { font-size: 13px; font-weight: 600 }
.table-widget { max-height: 240px; overflow-y: auto }
</style>
