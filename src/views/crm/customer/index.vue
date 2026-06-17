<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title-area">
        <h2 class="page-title">客户管理</h2>
        <p class="page-desc">管理系统客户信息，支持新增、编辑、删除及跟进记录</p>
      </div>
      <div class="page-header-actions">
        <el-button type="primary" :icon="Plus" v-permission="['crm:customer:add']" @click="handleAdd">
          新增客户
        </el-button>
        <el-button :icon="Download" plain @click="handleExport">导出数据</el-button>
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
        <el-button type="primary" link size="small" @click="handleView(row)">详情</el-button>
        <el-button type="primary" link size="small" @click="handleEdit(row)">编辑</el-button>
        <el-popconfirm title="确定删除该客户？" @confirm="handleDelete(row)" confirm-button-text="确定" cancel-button-text="取消">
          <template #reference>
            <el-button type="danger" link size="small">删除</el-button>
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
      confirm-text="确 定"
      cancel-text="取 消"
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
            <span class="header-title">客户详情</span>
            <el-tag :type="levelMap[currentRow?.level]?.type || 'info'" size="small">{{ levelMap[currentRow?.level]?.label || '' }}</el-tag>
          </div>
          <el-tag :type="currentRow?.status === 1 ? 'success' : 'danger'" size="small" effect="dark">
            {{ currentRow?.status === 1 ? '正常' : '停用' }}
          </el-tag>
        </div>
      </template>

      <div class="drawer-content" v-if="currentRow">
        <!-- Tab 切换 -->
        <el-tabs v-model="activeTab" class="detail-tabs">
          <!-- 基本信息 Tab -->
          <el-tab-pane label="基本信息" name="basic">
            <div class="info-grid">
              <div class="info-item"><span class="label">客户名称</span><span class="value bold">{{ currentRow.customerName }}</span></div>
              <div class="info-item"><span class="label">联系人</span><span class="value">{{ currentRow.contactName }}</span></div>
              <div class="info-item"><span class="label">手机号</span><span class="value phone">{{ currentRow.phone }}</span></div>
              <div class="info-item"><span class="label">邮箱</span><span class="value">{{ currentRow.email || '-' }}</span></div>
              <div class="info-item full"><span class="label">地址</span><span class="value">{{ currentRow.address || '-' }}</span></div>
              <div class="info-item"><span class="label">创建时间</span><span class="value">{{ currentRow.createTime }}</span></div>
              <div class="info-item full"><span class="label">备注</span><span class="value remark">{{ currentRow.remark || '暂无备注' }}</span></div>
            </div>

            <!-- 快捷操作 -->
            <div class="quick-actions-row">
              <el-button size="small" :icon="Phone"><el-icon><Phone /></el-icon> 电话联系</el-button>
              <el-button size="small" :icon="Message"><el-icon><Message /></el-icon> 发送消息</el-button>
              <el-button size="small" :icon="EditPen"><el-icon><EditPen /></el-icon> 编辑信息</el-button>
            </div>
          </el-tab-pane>

          <!-- 跟进记录 Tab -->
          <el-tab-pane label="跟进记录" name="followup">
            <div class="followup-header">
              <div class="followup-stats">
                <div class="stat-card">
                  <span class="stat-num">{{ followUpList.length }}</span>
                  <span class="stat-label">总跟进次数</span>
                </div>
                <div class="stat-card">
                  <span class="stat-num">{{ recentDays }}</span>
                  <span class="stat-label">距上次跟进(天)</span>
                </div>
              </div>
              <el-button type="primary" size="small" :icon="Plus" @click="handleAddFollowUp">新增跟进</el-button>
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
                      <span>下次跟进: {{ item.nextTime }}</span>
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
              <el-empty v-if="!followUpList.length" description="暂无跟进记录" :image-size="80" />
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-drawer>

    <!-- 新增跟进弹窗 -->
    <BaseDialog
      v-model="followUpDialogVisible"
      title="新增跟进记录"
      width="520px"
      :confirm-loading="followUpLoading"
      confirm-text="确 定"
      cancel-text="取 消"
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
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'
import { getCustomerList, updateCustomerStatus } from '@/api/crm'

// ==================== 搜索配置 ====================
const searchItems = [
  { prop: 'customerName', label: '客户名称', type: 'input', defaultValue: '' },
  { prop: 'contactName', label: '联系人', type: 'input', defaultValue: '' },
  { prop: 'phone', label: '手机号', type: 'input', defaultValue: '' },
  { prop: 'level', label: '客户等级', type: 'select',
    options: [
      { value: 'A', label: 'A级（重要）' },
      { value: 'B', label: 'B级（普通）' },
      { value: 'C', label: 'C级（一般）' }
    ],
    defaultValue: ''
  }
]

// ==================== 表格列配置 ====================
const columns = [
  { prop: 'customerName', label: '客户名称', minWidth: 140, align: 'left' },
  { prop: 'contactName', label: '联系人', width: 100 },
  { prop: 'phone', label: '手机号', width: 130 },
  { prop: 'address', label: '地址', minWidth: 180, showOverflowTooltip: true, align: 'left' },
  { prop: 'level', label: '等级', width: 90, slot: 'level' },
  { prop: 'status', label: '状态', width: 80, slot: 'status' },
  { prop: 'createTime', label: '创建时间', width: 170 }
]

// ==================== 表单配置 ====================
const formItems = [
  { prop: 'customerName', label: '客户名称 *', type: 'input', span: 12,
    attrs: { maxlength: 50, showWordLimit: true, placeholder: '请输入客户名称' } },
  { prop: 'contactName', label: '联系人 *', type: 'input', span: 12,
    attrs: { maxlength: 20, placeholder: '请输入联系人姓名' } },
  { prop: 'phone', label: '手机号 *', type: 'input', span: 12,
    attrs: { maxlength: 11, placeholder: '请输入手机号码' } },
  { prop: 'email', label: '邮箱', type: 'input', span: 12,
    attrs: { placeholder: '请输入邮箱地址' } },
  { prop: 'address', label: '地址', type: 'textarea', rows: 2, span: 24,
    attrs: { maxlength: 200, showWordLimit: true, placeholder: '请输入详细地址' } },
  { prop: 'level', label: '客户等级', type: 'select', span: 12,
    options: [
      { value: 'A', label: 'A级（重要）' },
      { value: 'B', label: 'B级（普通）' },
      { value: 'C', label: 'C级（一般）' }
    ]
  },
  { prop: 'status', label: '状态', type: 'radio', span: 12,
    options: [{ value: 1, label: '正常' }, { value: 0, label: '停用' }]
  },
  { prop: 'remark', label: '备注', type: 'textarea', rows: 3, span: 24,
    attrs: { maxlength: 500, showWordLimit: true, placeholder: '请输入备注信息（可选）' } }
]

const formRules = {
  customerName: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  contactName: [{ required: true, message: '请输入联系人', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ],
  email: [{ type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }]
}

// ==================== 跟进记录表单配置 ====================
const followUpFormItems = [
  {
    prop: 'type',
    label: '跟进方式 *',
    type: 'select',
    options: [
      { value: 'phone', label: '电话沟通' },
      { value: 'visit', label: '上门拜访' },
      { value: 'email', label: '邮件往来' },
      { value: 'wechat', label: '微信沟通' },
      { value: 'meeting', label: '会议讨论' }
    ]
  },
  {
    prop: 'content',
    label: '跟进内容 *',
    type: 'textarea',
    rows: 4,
    attrs: { maxlength: 500, showWordLimit: true, placeholder: '请详细描述本次跟进的内容、结果、客户反馈等' }
  },
  {
    prop: 'nextTime',
    label: '下次跟进时间',
    type: 'datetime',
    attrs: { placeholder: '选择下次计划跟进的时间', format: 'YYYY-MM-DD HH:mm', valueFormat: 'YYYY-MM-DD HH:mm:ss' }
  }
]

const followUpFormRules = {
  type: [{ required: true, message: '请选择跟进方式', trigger: 'change' }],
  content: [{ required: true, message: '请输入跟进内容', trigger: 'blur' }]
}

// ==================== 数据状态 ====================
const tableRef = ref(null)
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const selectedRows = ref([])
const dialogVisible = ref(false)
const dialogTitle = ref('新增客户')
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
    ElMessage.success(val ? '已启用' : '已停用')
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

function handleAdd() {
  dialogTitle.value = '新增客户'
  resetForm()
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = '编辑客户'
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
    ElMessage.success(formData.id ? '编辑成功' : '新增成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('操作失败')
  } finally {
    submitLoading.value = false
  }
}

async function handleDelete(row) {
  ElMessage.success('删除成功')
  loadData()
}

function handleExport() {
  ElMessage.success('导出功能开发中...')
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
    ElMessage.success('跟进记录添加成功')
  } catch (e) {
    ElMessage.error('添加失败')
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
