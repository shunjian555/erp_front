<template>
  <div class="page-container">
    <el-alert title="打印模板设计器" type="info" :closable="false" show-icon style="margin-bottom: 16px">
      <template #default>支持单据、报表、标签等多种打印模板设计，可拖拽字段、设置样式、预览打印效果。</template>
    </el-alert>
    <div class="designer-layout">
      <div class="left-panel">
        <div class="panel-title">模板列表</div>
        <div v-for="t in templates" :key="t.id" class="template-item" :class="{ active: current?.id === t.id }" @click="current = t">
          <el-icon><Document /></el-icon>
          <div>
            <div class="tpl-name">{{ t.name }}</div>
            <div class="tpl-type">{{ t.type }} · {{ t.paper }}</div>
          </div>
        </div>
      </div>
      <div class="center-panel">
        <div class="toolbar">
          <el-button-group>
            <el-button :icon="Plus" @click="addField('text')">文本</el-button>
            <el-button :icon="PictureFilled" @click="addField('image')">图片</el-button>
            <el-button :icon="Grid" @click="addField('table')">表格</el-button>
            <el-button :icon="Operation" @click="addField('line')">分隔线</el-button>
          </el-button-group>
          <el-divider direction="vertical" />
          <el-button :icon="Printer" @click="handlePrint">打印</el-button>
          <el-button :icon="Download" @click="handleExport">导出</el-button>
          <el-button :icon="Edit" @click="current && (current.editing = !current.editing)">{{ current?.editing ? '完成' : '编辑' }}</el-button>
        </div>
        <div class="canvas">
          <div v-if="current" class="a4-paper" :class="{ editing: current.editing }">
            <div class="paper-header">
              <div class="company-name">{{ current.headerText }}</div>
              <div class="doc-title">{{ current.name }}</div>
            </div>
            <div v-for="(f, i) in current.fields" :key="i" class="paper-field" :class="['type-' + f.type]" :style="f.style">
              <span v-if="f.type === 'text'">{{ f.content }}</span>
              <span v-else-if="f.type === 'image'" class="placeholder-img">公司 Logo</span>
              <table v-else-if="f.type === 'table'" class="paper-table">
                <thead><tr><th>商品</th><th>数量</th><th>单价</th><th>金额</th></tr></thead>
                <tbody><tr v-for="i in 3" :key="i"><td>示例商品 {{ i }}</td><td>10</td><td>¥100.00</td><td>¥1000.00</td></tr></tbody>
              </table>
              <hr v-else-if="f.type === 'line'" class="paper-line" />
              <div class="field-actions" v-if="current.editing">
                <el-button :icon="Delete" link size="small" @click="removeField(i)" />
              </div>
            </div>
            <div class="paper-footer">
              <div>打印时间: {{ new Date().toLocaleString() }}</div>
              <div>第 1 页 / 共 1 页</div>
            </div>
          </div>
          <el-empty v-else description="请从左侧选择模板" />
        </div>
      </div>
      <div class="right-panel">
        <div class="panel-title">属性设置</div>
        <el-form v-if="current" label-width="80px" size="small">
          <el-form-item label="模板名"><el-input v-model="current.name" :disabled="!current.editing" /></el-form-item>
          <el-form-item label="页眉文字"><el-input v-model="current.headerText" :disabled="!current.editing" /></el-form-item>
          <el-form-item label="纸张"><el-select v-model="current.paper" :disabled="!current.editing" style="width: 100%"><el-option label="A4" value="A4" /><el-option label="A5" value="A5" /><el-option label="B5" value="B5" /></el-select></el-form-item>
          <el-form-item label="方向"><el-radio-group v-model="current.orientation" :disabled="!current.editing"><el-radio value="portrait">纵向</el-radio><el-radio value="landscape">横向</el-radio></el-radio-group></el-form-item>
          <el-form-item><el-button type="primary" size="small" @click="handleSave">保存模板</el-button></el-form-item>
          <el-form-item><el-button type="danger" size="small" plain @click="handleDelete">删除模板</el-button></el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, PictureFilled, Grid, Operation, Printer, Download, Edit, Delete, Document } from '@element-plus/icons-vue'
import { exportToExcel } from '@/utils/excel'
import { browserPrint } from '@/utils/print'
const templates = ref([
  { id: 1, name: '销售订单模板', type: '单据', headerText: 'ABC 科技有限公司', paper: 'A4', orientation: 'portrait', editing: false, fields: [
    { id: 1, type: 'text', content: '订单号: SO202407-0001', style: { fontSize: '14px' } },
    { id: 2, type: 'text', content: '客户: A 客户', style: { fontSize: '12px' } },
    { id: 3, type: 'table', content: '', style: {} },
    { id: 4, type: 'line', content: '', style: {} },
    { id: 5, type: 'text', content: '合计金额: ¥3,000.00', style: { fontSize: '14px', fontWeight: 'bold' } }
  ] },
  { id: 2, name: '采购入库单', type: '单据', headerText: 'ABC 科技有限公司', paper: 'A4', orientation: 'portrait', editing: false, fields: [
    { id: 1, type: 'text', content: '入库单号: IO202407-0001', style: { fontSize: '14px' } },
    { id: 2, type: 'table', content: '', style: {} }
  ] },
  { id: 3, name: '商品标签', type: '标签', headerText: 'ABC 科技有限公司', paper: 'A5', orientation: 'landscape', editing: false, fields: [
    { id: 1, type: 'image', content: '', style: {} },
    { id: 2, type: 'text', content: '商品名称', style: { fontSize: '12px' } },
    { id: 3, type: 'text', content: '¥100.00', style: { fontSize: '18px', fontWeight: 'bold', color: '#f56c6c' } }
  ] }
])
const current = ref(templates.value[0])
function addField(type) { if (!current.value) return; current.value.fields.push({ id: Date.now(), type, content: type === 'text' ? '新文本' : '', style: {} }) }
function removeField(i) { current.value.fields.splice(i, 1) }
function handlePrint() { browserPrint({ title: current.value?.name || '打印模板' }) }
function handleExport() {
  const fields = (current.value?.fields || []).map(f => ({ 类型: f.type, 内容: f.content, X坐标: f.style?.x || 0, Y坐标: f.style?.y || 0 }))
  exportToExcel(fields, [{ prop: '类型', label: '类型' }, { prop: '内容', label: '内容' }, { prop: 'X坐标', label: 'X坐标' }, { prop: 'Y坐标', label: 'Y坐标' }], current.value?.name || '打印模板')
}
function handleSave() { ElMessage.success('已保存模板') }
async function handleDelete() { if (!current.value) return; await ElMessageBox.confirm(`确定删除「${current.value.name}」?`, '提示', { type: 'warning' }); templates.value = templates.value.filter(t => t.id !== current.value.id); current.value = templates.value[0] || null; ElMessage.success('已删除') }
</script>
<style lang="scss" scoped>
.designer-layout { display: grid; grid-template-columns: 220px 1fr 240px; gap: 16px; min-height: calc(100vh - 240px) }
.left-panel, .right-panel { background: #fff; padding: 16px; border-radius: 8px; overflow-y: auto }
.center-panel { background: #f5f5f5; border-radius: 8px; padding: 16px; overflow-y: auto }
.panel-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #409eff }
.template-item { display: flex; align-items: center; gap: 10px; padding: 10px; border-radius: 4px; cursor: pointer; margin-bottom: 4px; &.active, &:hover { background: #ecf5ff; color: #409eff } }
.tpl-name { font-size: 13px; font-weight: 600 }
.tpl-type { font-size: 12px; color: #909399 }
.toolbar { background: #fff; padding: 10px; border-radius: 6px; margin-bottom: 12px }
.canvas { display: flex; justify-content: center; padding: 20px }
.a4-paper { width: 595px; min-height: 800px; background: #fff; padding: 40px; box-shadow: 0 2px 12px rgba(0,0,0,.1); &.editing { border: 1px dashed #409eff } }
.paper-header { text-align: center; border-bottom: 2px solid #303133; padding-bottom: 16px; margin-bottom: 24px }
.company-name { font-size: 22px; font-weight: 700 }
.doc-title { font-size: 18px; margin-top: 8px }
.paper-field { position: relative; margin-bottom: 12px; padding: 4px 0 }
.field-actions { position: absolute; right: 0; top: 0 }
.paper-table { width: 100%; border-collapse: collapse; th, td { border: 1px solid #303133; padding: 8px; text-align: left; font-size: 13px } th { background: #f5f7fa; font-weight: 600 } }
.paper-line { border: none; border-top: 1px dashed #909399; margin: 12px 0 }
.placeholder-img { display: inline-block; padding: 30px 60px; background: #f0f0f0; color: #909399; font-size: 13px }
.paper-footer { display: flex; justify-content: space-between; margin-top: 30px; padding-top: 12px; border-top: 1px solid #ebeef5; font-size: 12px; color: #606266 }
</style>
