<template>
  <div class="page-container">
    <el-alert title="数据导入/导出向导" type="info" :closable="false" show-icon style="margin-bottom: 16px">
      <template #default>提供分步式导入/导出向导：下载模板 → 上传文件 → 字段映射 → 数据预览 → 确认导入。</template>
    </el-alert>
    <div class="wizard-tabs">
      <div v-for="(s, i) in steps" :key="i" class="wizard-step" :class="{ active: currentStep === i, done: currentStep > i }">
        <div class="step-num">{{ i + 1 }}</div>
        <div class="step-text">{{ s }}</div>
      </div>
    </div>
    <div class="wizard-content">
      <div v-if="currentStep === 0" class="step-content">
        <h3>选择操作类型与业务对象</h3>
        <el-form :model="form" label-width="120px">
          <el-form-item label="操作类型">
            <el-radio-group v-model="form.opType">
              <el-radio value="import">导入</el-radio><el-radio value="export">导出</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="业务对象">
            <el-select v-model="form.business" style="width: 100%">
              <el-option label="客户" value="customer" /><el-option label="商品" value="goods" /><el-option label="供应商" value="supplier" /><el-option label="员工" value="employee" /><el-option label="库存" value="inventory" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button :icon="Download" @click="handleDownloadTpl">下载模板</el-button>
          </el-form-item>
          <el-form-item v-if="form.opType === 'import'" label="上传文件">
            <el-upload action="#" :auto-upload="false" :on-change="handleFileChange" :limit="1">
              <el-button :icon="Upload">选择 Excel/CSV 文件</el-button>
            </el-upload>
            <div v-if="uploadFile" style="margin-top: 8px">已选择: {{ uploadFile.name }}</div>
          </el-form-item>
        </el-form>
      </div>
      <div v-else-if="currentStep === 1" class="step-content">
        <h3>字段映射</h3>
        <el-table :data="fieldMap" border>
          <el-table-column prop="fileField" label="文件字段" />
          <el-table-column label="系统字段">
            <template #default="{ row }">
              <el-select v-model="row.systemField" style="width: 100%">
                <el-option v-for="f in systemFields" :key="f" :label="f" :value="f" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column prop="required" label="必填" width="80" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.required" type="danger" size="small">必填</el-tag>
              <el-tag v-else size="small">选填</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else-if="currentStep === 2" class="step-content">
        <h3>数据预览</h3>
        <el-alert :title="`共 ${previewData.length} 行数据，其中 ${errorCount} 行有错误`" :type="errorCount > 0 ? 'warning' : 'success'" :closable="false" show-icon />
        <el-table :data="previewData" border style="margin-top: 16px" max-height="400">
          <el-table-column type="index" label="行号" width="80" align="center" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="code" label="编码" />
          <el-table-column prop="remark" label="备注" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'ok' ? 'success' : 'danger'" size="small">{{ row.status === 'ok' ? '正常' : '错误' }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else-if="currentStep === 3" class="step-content">
        <h3>完成</h3>
        <el-result icon="success" :title="`${form.opType === 'import' ? '导入' : '导出'}成功`" :subtitle="`共处理 ${previewData.length} 条数据`">
          <template #extra>
            <el-button type="primary" @click="resetWizard">完成</el-button>
          </template>
        </el-result>
      </div>
    </div>
    <div class="wizard-footer">
      <el-button :disabled="currentStep === 0" @click="currentStep--">上一步</el-button>
      <el-button v-if="currentStep < steps.length - 1" type="primary" @click="handleNext">下一步</el-button>
    </div>
    <div class="table-toolbar" style="margin-top: 24px">
      <div class="panel-title">历史导入/导出记录</div>
    </div>
    <BaseTable :columns="historyColumns" :table-data="historyData">
      <template #type="{ row }"><el-tag :type="row.type === '导入' ? 'success' : 'primary'" size="small">{{ row.type }}</el-tag></template>
      <template #status="{ row }"><BaseStatusTag :type="row.status === '成功' ? 'success' : 'danger'">{{ row.status }}</BaseStatusTag></template>
      <template #operation="{ row }">
        <el-button type="primary" link size="small" @click="handleDownloadLog(row)">下载日志</el-button>
        <el-button type="danger" link size="small" @click="handleDeleteLog(row)">删除</el-button>
      </template>
    </BaseTable>
  </div>
</template>
<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Download, Upload } from '@element-plus/icons-vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'
import { exportToExcel } from '@/utils/excel'
const steps = ['选择类型', '字段映射', '数据预览', '完成']
const currentStep = ref(0)
const form = reactive({ opType: 'import', business: 'customer' })
const uploadFile = ref(null)
const systemFields = ['客户编码', '客户名称', '联系人', '电话', '地址', '等级']
const fieldMap = ref([
  { fileField: 'name', systemField: '客户名称', required: true },
  { fileField: 'code', systemField: '客户编码', required: true },
  { fileField: 'phone', systemField: '电话', required: false },
  { fileField: 'contact', systemField: '联系人', required: false }
])
const previewData = ref([
  { name: 'A 客户', code: 'C001', remark: '', status: 'ok' }, { name: 'B 客户', code: 'C002', remark: '', status: 'ok' },
  { name: '', code: 'C003', remark: '名称为空', status: 'error' }, { name: 'D 客户', code: 'C004', remark: '', status: 'ok' },
  { name: 'E 客户', code: '', remark: '编码为空', status: 'error' }, { name: 'F 客户', code: 'C006', remark: '', status: 'ok' }
])
const errorCount = computed(() => previewData.value.filter(r => r.status === 'error').length)
const historyColumns = [
  { prop: 'type', label: '类型', width: 80, slot: 'type' }, { prop: 'business', label: '业务对象', width: 100 },
  { prop: 'fileName', label: '文件名', width: 200 }, { prop: 'count', label: '记录数', width: 90, align: 'center' },
  { prop: 'status', label: '状态', width: 90, slot: 'status' }, { prop: 'operator', label: '操作人', width: 100 },
  { prop: 'createTime', label: '时间', width: 170 }
]
const historyData = ref([
  { id: 1, type: '导入', business: '客户', fileName: '客户列表-2024-07-15.xlsx', count: 120, status: '成功', operator: '管理员', createTime: '2024-07-15 10:00:00' },
  { id: 2, type: '导出', business: '商品', fileName: '商品列表-2024-07-14.xlsx', count: 580, status: '成功', operator: '管理员', createTime: '2024-07-14 16:00:00' },
  { id: 3, type: '导入', business: '供应商', fileName: '供应商列表-2024-07-13.xlsx', count: 35, status: '失败', operator: '管理员', createTime: '2024-07-13 11:00:00' }
])
function handleFileChange(file) { uploadFile.value = file; ElMessage.success('文件已选择') }
function handleDownloadTpl() {
  const cols = systemFields.map(f => ({ prop: f, label: f }))
  const rows = [{}]
  cols.forEach(c => rows[0][c.prop] = '')
  exportToExcel(rows, cols, `${form.business}-导入模板`)
}
function handleNext() { if (currentStep.value < steps.length - 1) currentStep.value++ }
function resetWizard() { currentStep.value = 0; uploadFile.value = null }
function handleDownloadLog(row) {
  const cols = [{ prop: 'type', label: '类型' }, { prop: 'business', label: '业务对象' }, { prop: 'fileName', label: '文件名' }, { prop: 'count', label: '数量' }, { prop: 'status', label: '状态' }, { prop: 'operator', label: '操作人' }, { prop: 'createTime', label: '时间' }]
  exportToExcel([row], cols, row.fileName.replace(/\.[^.]+$/, '') + '-日志')
}
async function handleDeleteLog(row) { await ElMessageBox.confirm('确定删除该记录?', '提示', { type: 'warning' }); historyData.value = historyData.value.filter(x => x.id !== row.id); ElMessage.success('已删除') }
</script>
<style lang="scss" scoped>
.wizard-tabs { display: flex; align-items: center; background: #fff; padding: 20px; border-radius: 8px; margin-bottom: 16px }
.wizard-step { display: flex; align-items: center; gap: 8px; flex: 1; cursor: pointer }
.step-num { width: 32px; height: 32px; border-radius: 50%; background: #ebeef5; color: #909399; display: flex; align-items: center; justify-content: center; font-weight: 600; }
.wizard-step.active .step-num { background: #409eff; color: #fff }
.wizard-step.done .step-num { background: #67c23a; color: #fff }
.step-text { font-size: 14px; color: #909399; font-weight: 500 }
.wizard-step.active .step-text { color: #303133; font-weight: 600 }
.wizard-content { background: #fff; padding: 30px; border-radius: 8px; margin-bottom: 16px; min-height: 300px }
.step-content h3 { margin-top: 0; margin-bottom: 20px }
.wizard-footer { display: flex; justify-content: center; gap: 12px; padding: 16px; background: #fff; border-radius: 8px }
.table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 0; .toolbar-left { display: flex; gap: 10px; } .panel-title { font-size: 14px; font-weight: 600 } }
</style>
