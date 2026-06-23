<template>
  <div class="page-container">
    <el-alert title="多语言国际化" type="info" :closable="false" show-icon style="margin-bottom: 16px">
      <template #default>支持多语言切换，可翻译系统所有文本。已支持简体中文、繁体中文、英语、日语、韩语。</template>
    </el-alert>
    <div class="lang-stats">
      <div v-for="l in langStats" :key="l.code" class="lang-card" :class="{ active: l.code === currentLang }" @click="switchLang(l.code)">
        <div class="lang-flag">{{ l.flag }}</div>
        <div class="lang-name">{{ l.name }}</div>
        <div class="lang-progress">翻译进度: {{ l.progress }}%</div>
        <el-progress :percentage="l.progress" :show-text="false" :stroke-width="6" />
      </div>
    </div>
    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增词条</el-button>
        <el-button :icon="Download" plain @click="handleExport">导出语言包</el-button>
        <el-button :icon="Upload" @click="handleImport">导入语言包</el-button>
      </div>
    </div>
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />
    <BaseTable :columns="columns" :table-data="tableData" :loading="loading" :total="total" :current-page.sync="queryParams.pageNum" :page-size.sync="queryParams.pageSize" :show-index="true" @current-change="handlePageChange" @size-change="handleSizeChange">
      <template #module="{ row }"><el-tag size="small" :type="moduleMap[row.module]?.type || ''">{{ moduleMap[row.module]?.label || row.module }}</el-tag></template>
      <template #operation="{ row }">
        <el-button v-for="action in getActions(row).slice(0, 3)" :key="action.key" :type="action.type" link size="small" @click="action.handler(row)">{{ action.label }}</el-button>
        <el-dropdown v-if="getActions(row).length > 3" trigger="click" @command="(cmd) => handleCommand(cmd, row)">
          <el-button type="primary" link size="small">更多<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
          <template #dropdown><el-dropdown-menu><el-dropdown-item v-for="action in getActions(row).slice(3)" :key="action.key" :command="action.key">{{ action.label }}</el-dropdown-item></el-dropdown-menu></template>
        </el-dropdown>
      </template>
    </BaseTable>
    <BaseDialog v-model="dialogVisible" :title="dialogTitle" width="700px" :confirm-loading="submitLoading" @confirm="handleSubmit" @cancel="cancelDialog">
      <el-form :model="formData" label-width="100px">
        <el-form-item label="词条键" required><el-input v-model="formData.key" placeholder="如 common.save" /></el-form-item>
        <el-form-item label="所属模块" required>
          <el-select v-model="formData.module" style="width: 100%">
            <el-option v-for="m in Object.entries(moduleMap)" :key="m[0]" :value="m[0]" :label="m[1].label" />
          </el-select>
        </el-form-item>
        <el-divider>各语言翻译</el-divider>
        <el-form-item v-for="l in langList" :key="l.code" :label="l.flag + ' ' + l.name">
          <el-input v-model="formData.translations[l.code]" :placeholder="'请输入' + l.name" />
        </el-form-item>
      </el-form>
    </BaseDialog>
  </div>
</template>
<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Upload, ArrowDown } from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseStatusTag from '@/components/BaseStatusTag.vue'
import { exportToExcel, importFromExcel } from '@/utils/excel'
const moduleMap = { common: { label: '通用', type: '' }, menu: { label: '菜单', type: 'primary' }, button: { label: '按钮', type: 'success' }, message: { label: '消息', type: 'warning' }, error: { label: '错误', type: 'danger' } }
const langList = [
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' }, { code: 'zh-TW', name: '繁体中文', flag: '🇭🇰' }, { code: 'en-US', name: '英语', flag: '🇺🇸' }, { code: 'ja-JP', name: '日语', flag: '🇯🇵' }, { code: 'ko-KR', name: '韩语', flag: '🇰🇷' }
]
const currentLang = ref('zh-CN')
const langStats = ref([
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳', progress: 100 }, { code: 'zh-TW', name: '繁体中文', flag: '🇭🇰', progress: 95 },
  { code: 'en-US', name: '英语', flag: '🇺🇸', progress: 100 }, { code: 'ja-JP', name: '日语', flag: '🇯🇵', progress: 65 }, { code: 'ko-KR', name: '韩语', flag: '🇰🇷', progress: 40 }
])
const searchItems = [{ prop: 'key', label: '词条键', type: 'input' }, { prop: 'module', label: '模块', type: 'select', options: Object.entries(moduleMap).map(([k, v]) => ({ value: k, label: v.label })) }]
const columns = [
  { prop: 'key', label: '词条键', width: 180 },
  { prop: 'module', label: '模块', width: 100, slot: 'module' },
  { prop: 'zh-CN', label: '简体中文', width: 160, showOverflowTooltip: true },
  { prop: 'en-US', label: '英语', width: 160, showOverflowTooltip: true }
]
const loading = ref(false), tableData = ref([]), total = ref(0)
const dialogVisible = ref(false), dialogTitle = ref(''), submitLoading = ref(false)
const queryParams = reactive({ pageNum: 1, pageSize: 10, key: '', module: '' })
const formData = reactive({ id: undefined, key: '', module: 'common', translations: {} })
async function loadData() {
  loading.value = true
  try {
    const all = [
      { id: 1, key: 'common.save', module: 'common', 'zh-CN': '保存', 'zh-TW': '保存', 'en-US': 'Save', 'ja-JP': '保存', 'ko-KR': '저장' },
      { id: 2, key: 'common.cancel', module: 'common', 'zh-CN': '取消', 'zh-TW': '取消', 'en-US': 'Cancel', 'ja-JP': 'キャンセル', 'ko-KR': '취소' },
      { id: 3, key: 'menu.dashboard', module: 'menu', 'zh-CN': '工作台', 'zh-TW': '工作台', 'en-US': 'Dashboard', 'ja-JP': 'ダッシュボード', 'ko-KR': '대시보드' },
      { id: 4, key: 'menu.crm', module: 'menu', 'zh-CN': 'CRM', 'zh-TW': 'CRM', 'en-US': 'CRM', 'ja-JP': 'CRM', 'ko-KR': 'CRM' },
      { id: 5, key: 'button.add', module: 'button', 'zh-CN': '新增', 'zh-TW': '新增', 'en-US': 'Add', 'ja-JP': '新規', 'ko-KR': '추가' },
      { id: 6, key: 'button.edit', module: 'button', 'zh-CN': '编辑', 'zh-TW': '編輯', 'en-US': 'Edit', 'ja-JP': '編集', 'ko-KR': '편집' },
      { id: 7, key: 'message.success', module: 'message', 'zh-CN': '操作成功', 'zh-TW': '操作成功', 'en-US': 'Operation successful', 'ja-JP': '操作成功', 'ko-KR': '작업 성공' },
      { id: 8, key: 'message.error', module: 'message', 'zh-CN': '操作失败', 'zh-TW': '操作失敗', 'en-US': 'Operation failed', 'ja-JP': '操作失敗', 'ko-KR': '작업 실패' },
      { id: 9, key: 'error.404', module: 'error', 'zh-CN': '页面不存在', 'zh-TW': '頁面不存在', 'en-US': 'Page not found', 'ja-JP': 'ページが存在しません', 'ko-KR': '페이지를 찾을 수 없습니다' },
      { id: 10, key: 'error.500', module: 'error', 'zh-CN': '服务器错误', 'zh-TW': '伺服器錯誤', 'en-US': 'Server error', 'ja-JP': 'サーバーエラー', 'ko-KR': '서버 오류' }
    ]
    const { key = '', module = '', pageNum = 1, pageSize = 10 } = queryParams
    let filtered = all
    if (key) filtered = filtered.filter(x => x.key.includes(key))
    if (module) filtered = filtered.filter(x => x.module === module)
    const start = (Number(pageNum) - 1) * Number(pageSize)
    tableData.value = filtered.slice(start, start + Number(pageSize))
    total.value = filtered.length
  } finally { loading.value = false }
}
function handleSearch(p) { Object.assign(queryParams, p, { pageNum: 1 }); loadData() }
function handleReset() { Object.keys(queryParams).forEach(k => { if (k !== 'pageNum' && k !== 'pageSize') queryParams[k] = '' }); loadData() }
function handlePageChange(p) { queryParams.pageNum = p; loadData() }
function handleSizeChange(s) { queryParams.pageSize = s; queryParams.pageNum = 1; loadData() }
function handleAdd() { dialogTitle.value = '新增词条'; formData.id = undefined; formData.key = ''; formData.module = 'common'; formData.translations = {}; dialogVisible.value = true }
function handleEdit(r) { dialogTitle.value = '编辑词条'; formData.id = r.id; formData.key = r.key; formData.module = r.module; formData.translations = { 'zh-CN': r['zh-CN'], 'zh-TW': r['zh-TW'], 'en-US': r['en-US'], 'ja-JP': r['ja-JP'], 'ko-KR': r['ko-KR'] }; dialogVisible.value = true }
function switchLang(code) { currentLang.value = code; ElMessage.success(`已切换到 ${langList.find(l => l.code === code).name}`) }
function handleExport() {
  const langCode = currentLang.value
  const rows = tableData.value.map(t => ({ key: t.key, value: t.translations[langCode] || '' }))
  exportToExcel(rows, [{ prop: 'key', label: '词条键' }, { prop: 'value', label: langList.find(l => l.code === langCode)?.name || langCode }], `语言包-${langCode}`)
}
function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xlsx,.xls,.csv'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    try {
      const rows = await importFromExcel(file, [{ prop: 'key', label: '词条键' }, { prop: 'value', label: '翻译' }])
      const langCode = currentLang.value
      let n = 0
      rows.forEach(r => {
        const item = tableData.value.find(t => t.key === r.key)
        if (item) { item.translations[langCode] = r.value; n++ }
      })
      ElMessage.success(`成功导入 ${n} 条词条`)
    } catch (err) {
      ElMessage.error('导入失败: ' + err.message)
    }
  }
  input.click()
}
async function handleSubmit() { if (!formData.key) return ElMessage.warning('请输入词条键'); submitLoading.value = true; try { await new Promise(r => setTimeout(r, 500)); ElMessage.success('保存成功'); dialogVisible.value = false; loadData() } catch { ElMessage.error('保存失败') } finally { submitLoading.value = false } }
async function handleDelete(row) { await ElMessageBox.confirm(`确定删除「${row.key}」?`, '提示', { type: 'warning' }); ElMessage.success('删除成功'); loadData() }
function getActions(row) {
  return [
    { key: 'edit', label: '编辑', type: 'primary', handler: handleEdit },
    { key: 'translate', label: '在线翻译', type: 'success', handler: (r) => ElMessage.success('已自动翻译') },
    { key: 'delete', label: '删除', type: 'danger', handler: handleDelete }
  ]
}
function handleCommand(cmd, row) { getActions(row).find(a => a.key === cmd)?.handler(row) }
onMounted(() => loadData())
</script>
<style lang="scss" scoped>
.lang-stats { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 20px }
.lang-card { padding: 16px; background: #fff; border: 2px solid transparent; border-radius: 8px; text-align: center; cursor: pointer; transition: all .2s; &.active, &:hover { border-color: #409eff; box-shadow: 0 2px 12px rgba(64,158,255,.2) } }
.lang-flag { font-size: 32px; margin-bottom: 8px }
.lang-name { font-size: 15px; font-weight: 600 }
.lang-progress { font-size: 12px; color: #909399; margin: 8px 0 }
.table-toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding: 14px 18px; background: #fff; border-radius: var(--border-radius-base); .toolbar-left { display: flex; gap: 10px; } }
</style>
