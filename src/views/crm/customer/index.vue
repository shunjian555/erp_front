<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title-area">
        <h2 class="page-title">{{ t('crm.customerManage') }}</h2>
        <p class="page-desc">{{ t('crm.customerDesc') }}</p>
      </div>
      <div class="page-header-actions">
        <el-button type="primary" :icon="Plus" v-permission="['crm:customer:add']" @click="handleAdd">
          {{ t('crm.addCustomer') }}
        </el-button>
        <el-button :icon="Download" plain @click="handleExport">{{ t('common.export') }}</el-button>
      </div>
    </div>

    <!-- 搜索区域 -->
    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />

    <!-- 表格区域 -->
    <BaseTable
      ref="tableRef"
      :columns="columns"
      :table-data="tableData"
      :loading="loading"
      :total="total"
      :current-page="queryParams.pageNum"
      :page-size="queryParams.pageSize"
      :show-selection="true"
      :show-index="true"
      @selection-change="handleSelectionChange"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <template #level="{ row }">
        <el-tag
          :type="levelMap[row.level]?.type || 'info'"
          size="small"
          :effect="row.level === 'A' ? 'dark' : 'plain'"
          round
        >
          {{ levelMap[row.level]?.label || row.level }}
        </el-tag>
      </template>
      <template #status="{ row }">
        <el-switch
          :model-value="row.status === 1"
          active-color="#13ce66"
          inactive-color="#dcdfe6"
          size="small"
          @change="(val) => handleStatusChange(row, val)"
        />
      </template>
      <template #operation="{ row }">
        <el-button type="primary" link size="small" @click="handleView(row)">{{ t('common.detail') }}</el-button>
        <el-button type="primary" link size="small" @click="handleEdit(row)">{{ t('common.edit') }}</el-button>
        <el-popconfirm :title="t('crm.confirmDeleteCustomer')" @confirm="handleDelete(row)" :confirm-button-text="t('common.confirm')" :cancel-button-text="t('common.cancel')">
          <template #reference>
            <el-button type="danger" link size="small">{{ t('common.delete') }}</el-button>
          </template>
        </el-popconfirm>
      </template>
    </BaseTable>

    <!-- 新增/编辑弹窗 -->
    <BaseDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="680px"
      :confirm-loading="submitLoading"
      :confirm-text="t('common.confirm')"
      :cancel-text="t('common.cancel')"
      @confirm="handleSubmit"
      @cancel="cancelDialog"
    >
      <BaseForm
        ref="formRef"
        v-model="formData"
        :form-items="formItems"
        :form-rules="formRules"
        :col-count="2"
      />
    </BaseDialog>

    <!-- 详情抽屉 - 含跟进记录 -->
    <el-drawer
      v-model="drawerVisible"
      title=""
      direction="rtl"
      size="560px"
      :destroy-on-close="true"
    >
      <template #header>
        <div class="drawer-header">
          <div class="header-left">
            <span class="header-title">{{ t('crm.customerDetail') }}</span>
            <el-tag :type="levelMap[currentRow?.level]?.type || 'info'" size="small">{{ levelMap[currentRow?.level]?.label || '' }}</el-tag>
          </div>
          <el-tag :type="currentRow?.status === 1 ? 'success' : 'danger'" size="small" effect="dark">
            {{ currentRow?.status === 1 ? t('common.normal') : t('common.disable') }}
          </el-tag>
        </div>
      </template>

      <div class="drawer-content" v-if="currentRow">
        <!-- Tab 切换 -->
        <el-tabs v-model="activeTab" class="detail-tabs">
          <!-- 基本信息 Tab -->
          <el-tab-pane :label="t('crm.basicInfo')" name="basic">
            <div class="info-grid">
              <div class="info-item"><span class="label">{{ t('crm.customerName') }}</span><span class="value bold">{{ currentRow.customerName }}</span></div>
              <div class="info-item"><span class="label">{{ t('crm.contactName') }}</span><span class="value">{{ currentRow.contactName }}</span></div>
              <div class="info-item"><span class="label">{{ t('crm.phone') }}</span><span class="value phone">{{ currentRow.phone }}</span></div>
              <div class="info-item"><span class="label">{{ t('crm.email') }}</span><span class="value">{{ currentRow.email || '-' }}</span></div>
              <div class="info-item full"><span class="label">{{ t('crm.address') }}</span><span class="value">{{ currentRow.address || '-' }}</span></div>
              <div class="info-item"><span class="label">{{ t('crm.createTime') }}</span><span class="value">{{ currentRow.createTime }}</span></div>
              <div class="info-item full"><span class="label">{{ t('crm.remark') }}</span><span class="value remark">{{ currentRow.remark || t('crm.noRemark') }}</span></div>
            </div>

            <!-- 快捷操作 -->
            <div class="quick-actions-row">
              <el-button size="small" :icon="Phone"><el-icon><Phone /></el-icon> {{ t('crm.phoneCall') }}</el-button>
              <el-button size="small" :icon="Message"><el-icon><Message /></el-icon> {{ t('crm.emailFollow') }}</el-button>
              <el-button size="small" :icon="EditPen"><el-icon><EditPen /></el-icon> {{ t('common.edit') }}</el-button>
            </div>
          </el-tab-pane>

          <!-- 跟进记录 Tab -->
          <el-tab-pane :label="t('crm.followRecords')" name="followup">
            <div class="followup-header">
              <div class="followup-stats">
                <div class="stat-card">
                  <span class="stat-num">{{ followUpList.length }}</span>
                  <span class="stat-label">{{ t('crm.followRecords') }}</span>
                </div>
                <div class="stat-card">
                  <span class="stat-num">{{ recentDays }}</span>
                  <span class="stat-label">{{ t('crm.followTime') }}</span>
                </div>
              </div>
              <el-button type="primary" size="small" :icon="Plus" @click="handleAddFollowUp">{{ t('crm.addFollow') }}</el-button>
            </div>

            <!-- 时间线 -->
            <div class="timeline-wrapper">
              <el-timeline>
                <el-timeline-item
                  v-for="(item, index) in followUpList"
                  :key="index"
                  :timestamp="item.followTime"
                  :type="followTypeMap[item.type]?.color || ''"
                  placement="top"
                  :hollow="index > 0"
                >
                  <div class="timeline-card">
                    <div class="card-top">
                      <el-tag :type="followTypeMap[item.type]?.tagType || 'info'" size="small" effect="plain" round>
                        {{ followTypeMap[item.type]?.label || item.type }}
                      </el-tag>
                      <span class="follower">{{ item.followBy }}</span>
                    </div>
                    <p class="card-content">{{ item.content }}</p>
                    <div class="card-bottom" v-if="item.nextTime">
                      <el-icon><Clock /></el-icon>
                      <span>{{ t('crm.nextFollowTime') }}: {{ item.nextTime }}</span>
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
              <el-empty v-if="!followUpList.length" :description="t('common.noData')" :image-size="80" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-drawer>

    <!-- 新增跟进弹窗 -->
    <BaseDialog
      v-model="followUpDialogVisible"
      :title="t('crm.addFollow')"
      width="520px"
      :confirm-loading="followUpLoading"
      :confirm-text="t('common.confirm')"
      :cancel-text="t('common.cancel')"
      @confirm="handleSubmitFollowUp"
      @cancel="cancelFollowUpDialog"
    >
      <BaseForm
        ref="followUpFormRef"
        v-model="followUpFormData"
        :form-items="followUpFormItems"
        :form-rules="followUpFormRules"
        :col-count="1"
      />
    </BaseDialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Download, Phone, Message, EditPen, Clock } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import { getCustomerList, updateCustomerStatus } from '@/api/crm'

const { t } = useI18n()

// ==================== 搜索配置 ====================
const searchItems = [
  { prop: 'customerName', label: t('crm.customerName'), type: 'input', defaultValue: '' },
  { prop: 'contactName', label: t('crm.contactName'), type: 'input', defaultValue: '' },
  { prop: 'phone', label: t('crm.phone'), type: 'input', defaultValue: '' },
  { prop: 'level', label: t('crm.level'), type: 'select',
    options: [
      { value: 'A', label: t('crm.levelA') },
      { value: 'B', label: t('crm.levelB') },
      { value: 'C', label: t('crm.levelC') }
    ],
    defaultValue: ''
  }
]

// ==================== 表格列配置 ====================
const columns = [
  { prop: 'customerName', label: t('crm.customerName'), minWidth: 140, align: 'left' },
  { prop: 'contactName', label: t('crm.contactName'), width: 100 },
  { prop: 'phone', label: t('crm.phone'), width: 130 },
  { prop: 'address', label: t('crm.address'), minWidth: 180, showOverflowTooltip: true, align: 'left' },
  { prop: 'level', label: t('crm.level'), width: 90, slot: 'level' },
  { prop: 'status', label: t('common.status'), width: 80, slot: 'status' },
  { prop: 'createTime', label: t('crm.createTime'), width: 170 }
]

// ==================== 表单配置 ====================
const formItems = [
  { prop: 'customerName', label: t('crm.customerName') + ' *', type: 'input', span: 12,
    attrs: { maxlength: 50, showWordLimit: true, placeholder: t('crm.customerName') } },
  { prop: 'contactName', label: t('crm.contactName') + ' *', type: 'input', span: 12,
    attrs: { maxlength: 20, placeholder: t('crm.contactName') } },
  { prop: 'phone', label: t('crm.phone') + ' *', type: 'input', span: 12,
    attrs: { maxlength: 11, placeholder: t('crm.phone') } },
  { prop: 'email', label: t('crm.email'), type: 'input', span: 12,
    attrs: { placeholder: t('crm.email') } },
  { prop: 'address', label: t('crm.address'), type: 'textarea', rows: 2, span: 24,
    attrs: { maxlength: 200, showWordLimit: true, placeholder: t('crm.address') } },
  { prop: 'level', label: t('crm.level'), type: 'select', span: 12,
    options: [
      { value: 'A', label: t('crm.levelA') },
      { value: 'B', label: t('crm.levelB') },
      { value: 'C', label: t('crm.levelC') }
    ]
  },
  { prop: 'status', label: t('common.status'), type: 'radio', span: 12,
    options: [{ value: 1, label: t('common.normal') }, { value: 0, label: t('common.disable') }]
  },
  { prop: 'remark', label: t('crm.remark'), type: 'textarea', rows: 3, span: 24,
    attrs: { maxlength: 500, showWordLimit: true, placeholder: t('crm.remark') } }
]

const formRules = {
  customerName: [{ required: true, message: t('crm.customerName'), trigger: 'blur' }],
  contactName: [{ required: true, message: t('crm.contactName'), trigger: 'blur' }],
  phone: [
    { required: true, message: t('crm.phone'), trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: t('crm.phone'), trigger: 'blur' }
  ],
  email: [{ type: 'email', message: t('crm.email'), trigger: 'blur' }]
}

// ==================== 跟进记录表单配置 ====================
const followUpFormItems = [
  {
    prop: 'type',
    label: t('crm.followType') + ' *',
    type: 'select',
    options: [
      { value: 'phone', label: t('crm.phoneCall') },
      { value: 'visit', label: t('crm.visit') },
      { value: 'email', label: t('crm.emailFollow') },
      { value: 'wechat', label: t('crm.wechat') },
      { value: 'meeting', label: t('crm.other') }
    ]
  },
  {
    prop: 'content',
    label: t('crm.followContent') + ' *',
    type: 'textarea',
    rows: 4,
    attrs: { maxlength: 500, showWordLimit: true, placeholder: t('crm.followContent') }
  },
  {
    prop: 'nextTime',
    label: t('crm.nextFollowTime'),
    type: 'datetime',
    attrs: { placeholder: t('crm.nextFollowTime'), format: 'YYYY-MM-DD HH:mm', valueFormat: 'YYYY-MM-DD HH:mm:ss' }
  }
]

const followUpFormRules = {
  type: [{ required: true, message: t('crm.followType'), trigger: 'change' }],
  content: [{ required: true, message: t('crm.followContent'), trigger: 'blur' }]
}

// ==================== 数据状态 ====================
const tableRef = ref(null)
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const selectedRows = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref(t('crm.addCustomer'))
const submitLoading = ref(false)
const formRef = ref(null)

// 详情抽屉
const drawerVisible = ref(false)
const currentRow = ref(null)
const activeTab = ref('basic')

// 跟进记录相关
const followUpList = ref([])
const followUpDialogVisible = ref(false)
const followUpLoading = ref(false)
const followUpFormRef = ref(null)

const followUpFormData = reactive({
  type: '',
  content: '',
  nextTime: ''
})

const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  customerName: '',
  contactName: '',
  phone: '',
  level: ''
})

const formData = reactive({
  id: undefined,
  customerName: '',
  contactName: '',
  phone: '',
  email: '',
  address: '',
  level: '',
  status: 1,
  remark: ''
})

const levelMap = {
  A: { label: 'A级', type: 'danger' },
  B: { label: 'B级', type: 'warning' },
  C: { label: 'C级', type: 'info' }
}

const followTypeMap = {
  phone: { label: '电话沟通', color: '', tagType: 'primary' },
  visit: { label: '上门拜访', color: 'success', tagType: 'success' },
  email: { label: '邮件往来', color: 'warning', tagType: 'warning' },
  wechat: { label: '微信沟通', color: '', tagType: '' },
  meeting: { label: '会议讨论', color: 'danger', tagType: 'danger' }
}

// 计算距上次跟进天数
const recentDays = computed(() => {
  if (!followUpList.value.length) return '-'
  const lastDate = new Date(followUpList.value[0].followTime.replace(/-/g, '/'))
  const now = new Date()
  return Math.floor((now - lastDate) / (1000 * 60 * 60 * 24))
})

// Mock 跟进记录数据生成
function generateMockFollowUps(customerId) {
  const types = ['phone', 'visit', 'email', 'wechat', 'meeting']
  const contents = [
    '与客户确认了本季度的采购需求，预计下周会下订单',
    '客户对产品价格有疑虑，已安排销售经理跟进报价方案',
    '上门拜访，参观了客户仓库，了解了实际使用场景',
    '发送了最新的产品资料和报价单，等待客户回复',
    '电话回访，客户表示满意当前服务，考虑续约',
    '参加了客户的内部会议，演示了新产品功能',
    '微信沟通了合同细节，基本达成一致',
    '处理了客户反馈的产品问题，客户满意度提升',
    '邮件发送了季度对账单，确认无误',
    '预约了下周一的正式商务洽谈'
  ]
  const followers = ['张伟', '李娜', '王强', '刘芳', '陈杰']
  const list = []
  const count = Math.floor(Math.random() * 5) + 2 // 2-6条

  for (let i = 0; i < count; i++) {
    const d = new Date()
    d.setDate(d.getDate() - i * (Math.floor(Math.random() * 7) + 1))
    const dateStr = d.toISOString().replace('T', ' ').substring(0, 19)

    let nextTime = null
    if (i === 0) {
      // 最新一条可能有下次跟进时间
      const nextD = new Date()
      nextD.setDate(nextD.getDate() + Math.floor(Math.random() * 14) + 1)
      nextTime = nextD.toISOString().replace('T', ' ').substring(0, 16) + ':00'
    }

    list.push({
      id: `${customerId}-${i}`,
      customerId,
      type: types[Math.floor(Math.random() * types.length)],
      content: contents[Math.floor(Math.random() * contents.length)],
      followTime: dateStr,
      followBy: followers[Math.floor(Math.random() * followers.length)],
      nextTime
    })
  }

  // 按时间倒序
  list.sort((a, b) => new Date(b.followTime) - new Date(a.followTime))
  return list
}

// ==================== 方法 ====================
async function loadData() {
  loading.value = true
  try {
    const res = await getCustomerList(queryParams)
    tableData.value = res.data.list
    total.value = res.data.total
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function handleSearch(params) {
  Object.assign(queryParams, params, { pageNum: 1 })
  loadData()
}

function handleReset() {
  Object.assign(queryParams, { pageNum: 1, customerName: '', contactName: '', phone: '', level: '' })
  loadData()
}

function handlePageChange(page) {
  queryParams.pageNum = page
  loadData()
}

function handleSizeChange(size) {
  queryParams.pageSize = size
  queryParams.pageNum = 1
  loadData()
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

async function handleStatusChange(row, val) {
  try {
    await updateCustomerStatus(row.id, val ? 1 : 0)
    row.status = val ? 1 : 0
    ElMessage.success(val ? t('common.enable') : t('common.disable'))
  } catch (e) {
    ElMessage.error(t('common.failed'))
  }
}

function handleAdd() {
  dialogTitle.value = t('crm.addCustomer')
  resetForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = t('crm.editCustomer')
  Object.assign(formData, { ...row })
  dialogVisible.value = true
}

function handleView(row) {
  currentRow.value = { ...row }
  activeTab.value = 'basic'
  // 生成 mock 跟进记录
  followUpList.value = generateMockFollowUps(row.id)
  drawerVisible.value = true
}

function resetForm() {
  Object.keys(formData).forEach((key) => {
    if (key === 'status') formData[key] = 1
    else formData[key] = ''
  })
  formData.id = undefined
}

function cancelDialog() {
  dialogVisible.value = false
  formRef.value?.resetFields()
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  submitLoading.value = true
  try {
    await new Promise((resolve) => setTimeout(resolve, 500))
    ElMessage.success(t('common.success'))
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error(t('common.failed'))
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row) {
  ElMessage.success(t('common.success'))
  loadData()
}

function handleExport() {
  ElMessage.success(t('common.export') + '...')
}

// ==================== 跟进记录方法 ====================
function handleAddFollowUp() {
  followUpFormData.type = ''
  followUpFormData.content = ''
  followUpFormData.nextTime = ''
  followUpDialogVisible.value = true
}

function cancelFollowUpDialog() {
  followUpDialogVisible.value = false
  followUpFormRef.value?.resetFields()
}

async function handleSubmitFollowUp() {
  const valid = await followUpFormRef.value?.validate().catch(() => false)
  if (!valid) return

  followUpLoading.value = true
  try {
    await new Promise((resolve) => setTimeout(resolve, 400))

    const newItem = {
      id: `new-${Date.now()}`,
      customerId: currentRow.value.id,
      type: followUpFormData.type,
      content: followUpFormData.content,
      followTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
      followBy: '当前用户',
      nextTime: followUpFormData.nextTime || null
    }

    followUpList.value.unshift(newItem)
    followUpDialogVisible.value = false
    ElMessage.success(t('common.success'))
  } catch (e) {
    ElMessage.error(t('common.failed'))
  } finally {
    followUpLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style lang="scss" scoped>
.page-container {
  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 16px;

    .page-title-area {
      .page-title {
        font-size: 18px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0 0 4px 0;
      }

      .page-desc {
        font-size: 13px;
        color: var(--text-secondary);
        margin: 0;
      }
    }

    .page-header-actions {
      display: flex;
      gap: 10px;
      flex-shrink: 0;
    }
  }
}

// 抽屉头部样式
.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .header-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

// 抽屉内容样式
.drawer-content {
  padding: 0 4px;

  :deep(.el-tabs__header) {
    margin-bottom: 16px;
  }

  :deep(.el-tabs__item) {
    font-size: 14px;
    font-weight: 500;
  }
}

// 基本信息网格
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px 20px;

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;

    &.full {
      grid-column: 1 / -1;
    }

    .label {
      font-size: 12px;
      color: #909399;
    }

    .value {
      font-size: 14px;
      color: #303133;
      word-break: break-all;

      &.bold {
        font-weight: 600;
        font-size: 15px;
      }

      &.phone {
        font-family: monospace;
        letter-spacing: 0.5px;
      }

      &.remark {
        line-height: 1.6;
        color: #606266;
        background: #f8f9fa;
        padding: 8px 12px;
        border-radius: 6px;
      }
    }
  }
}

// 快捷操作行
.quick-actions-row {
  display: flex;
  gap: 10px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

// 跟进记录区域
.followup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .followup-stats {
    display: flex;
    gap: 12px;

    .stat-card {
      background: linear-gradient(135deg, #f0f7ff 0%, #ecf5ff 100%);
      border-radius: 8px;
      padding: 10px 16px;
      text-align: center;
      min-width: 90px;

      .stat-num {
        display: block;
        font-size: 22px;
        font-weight: 700;
        color: #409eff;
        line-height: 1.2;
      }

      .stat-label {
        font-size: 11px;
        color: #909399;
      }
    }
  }
}

// 时间线样式
.timeline-wrapper {
  max-height: calc(100vh - 280px);
  overflow-y: auto;
  padding-right: 4px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #dcdfe6;
    border-radius: 2px;
  }

  :deep(.el-timeline-item__wrapper) {
    padding-left: 16px;
  }

  :deep(.el-timeline-item__timestamp) {
    font-size: 12px;
    color: #909399;
  }

  :deep(.el-timeline-item__tail) {
    border-left-color: #e4e7ed;
  }
}

.timeline-card {
  background: #fafbfc;
  border-radius: 8px;
  padding: 12px 14px;
  transition: all 0.2s;

  &:hover {
    background: #f0f5ff;
    box-shadow: 0 2px 8px rgba(64, 158, 255, 0.08);
  }

  .card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 6px;

    .follower {
      font-size: 12px;
      color: #909399;
    }
  }

  .card-content {
    font-size: 13px;
    color: #303133;
    line-height: 1.6;
    margin: 0;
  }

  .card-bottom {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed #ebeef5;
    font-size: 12px;
    color: #e6a23c;

    .el-icon {
      font-size: 13px;
    }
  }
}
</style>
