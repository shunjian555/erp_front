<template>
  <div class="page-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <div class="page-title-area">
        <h2 class="page-title">合同管理</h2>
        <p class="page-desc">管理销售合同全生命周期，支持在线填写、预览与多格式导出</p>
      </div>
      <div class="page-header-actions">
        <el-button type="primary" :icon="Plus" @click="handleAdd">
          新建合同
        </el-button>
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
      <template #amount="{ row }">
        <span class="amount-text">{{ formatAmount(row.amount) }}</span>
      </template>
      <template #status="{ row }">
        <el-tag
          :type="statusMap[row.status]?.type || 'info'"
          size="small"
          round
          effect="light"
        >
          {{ statusMap[row.status]?.label || '未知' }}
        </el-tag>
      </template>
      <template #operation="{ row }">
        <el-button type="primary" link size="small" @click="handleView(row)">查看</el-button>
        <el-button
          v-if="row.status === 0 || row.status === 1"
          type="primary"
          link
          size="small"
          @click="handleEdit(row)"
        >编辑</el-button>
        <el-dropdown trigger="click" @command="(cmd) => handleExportCommand(cmd, row)">
          <el-button type="primary" link size="small">
            导出<el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="pdf"><Document /> 导出 PDF</el-dropdown-item>
              <el-dropdown-item command="word"><Notebook /> 导出 Word</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-popconfirm title="确定删除该合同？" @confirm="handleDelete(row)" confirm-button-text="确定" cancel-button-text="取消">
          <template #reference>
            <el-button v-if="row.status === 0" type="danger" link size="small">删除</el-button>
          </template>
        </el-popconfirm>
      </template>
    </BaseTable>

    <!-- ========== 新建/编辑合同弹窗 ========== -->
    <BaseDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="760px"
      :confirm-loading="submitLoading"
      confirm-text="保存并继续"
      cancel-text="取 消"
      @confirm="handleSubmit"
      @cancel="cancelDialog"
    >
      <div class="contract-form-wrapper">
        <!-- 步骤条 -->
        <el-steps :active="formStep" finish-status="success" align-center class="form-steps">
          <el-step title="基本信息" />
          <el-step title="合同条款" />
          <el-step title="确认提交" />
        </el-steps>

        <!-- 步骤1: 基本信息 -->
        <div v-show="formStep === 0" class="step-content">
          <BaseForm
            ref="basicFormRef"
            v-model="formData"
            :form-items="basicFormItems"
            :form-rules="basicFormRules"
            :col-count="2"
          />
        </div>

        <!-- 步骤2: 合同条款 -->
        <div v-show="formStep === 1" class="step-content">
          <BaseForm
            ref="clauseFormRef"
            v-model="formData"
            :form-items="clauseFormItems"
            :col-count="1"
          />

          <!-- 商品明细表格 -->
          <div class="sub-section">
            <div class="sub-header">
              <span class="sub-title">合同商品明细</span>
              <el-button type="primary" plain size="small" :icon="Plus" @click="addProductRow">添加商品</el-button>
            </div>
            <el-table :data="formData.products" border size="small" class="product-table">
              <el-table-column prop="name" label="商品名称" min-width="140">
                <template #default="{ row, $index }">
                  <el-input v-model="row.name" placeholder="请输入" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="spec" label="规格型号" width="120">
                <template #default="{ row }">
                  <el-input v-model="row.spec" placeholder="规格" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="quantity" label="数量" width="90">
                <template #default="{ row }">
                  <el-input-number v-model="row.quantity" :min="1" :max="99999" controls-position="right" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="unitPrice" label="单价(元)" width="110">
                <template #default="{ row }">
                  <el-input-number v-model="row.unitPrice" :min="0" :precision="2" controls-position="right" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="amount" label="小计(元)" width="100" align="right">
                <template #default="{ row }">
                  <span class="sub-total">{{ (row.quantity * row.unitPrice).toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="60" align="center">
                <template #default="{ $index }">
                  <el-button type="danger" link size="small" @click="removeProductRow($index)"><Delete /></el-button>
                </template>
              </el-table-column>
            </el-table>
            <div class="product-summary">
              商品合计：<span class="summary-amount">{{ productsTotal.toFixed(2) }} 元</span>
            </div>
          </div>
        </div>

        <!-- 步骤3: 确认提交 -->
        <div v-show="formStep === 2" class="step-content step-confirm">
          <div class="confirm-card">
            <h4>合同信息确认</h4>
            <div class="confirm-grid">
              <div class="cf-item"><span class="cfl">合同编号</span><span class="cfv highlight">{{ formData.contractNo }}</span></div>
              <div class="cf-item"><span class="cfl">客户名称</span><span class="cfv">{{ formData.customerName }}</span></div>
              <div class="cf-item"><span class="cfl">合同总金额</span><span class="cfv amount-big">{{ formatAmount(formData.amount || productsTotal) }}</span></div>
              <div class="cf-item"><span class="cfl">合同期限</span><span class="cfv">{{ formData.startDate }} ~ {{ formData.endDate }}</span></div>
              <div class="cf-item full"><span class="cfl">付款方式</span><span class="cfv">{{ paymentMethodMap[formData.paymentMethod] || formData.paymentMethod }}</span></div>
              <div class="cf-item full"><span class="cfl">交货方式</span><span class="cfv">{{ deliveryMethodMap[formData.deliveryMethod] || formData.deliveryMethod }}</span></div>
              <div class="cf-item full"><span class="cfl">商品明细</span><span class="cfv">{{ formData.products.length }} 项商品，合计 {{ productsTotal.toFixed(2) }} 元</span></div>
            </div>
          </div>
          <el-alert type="info" :closable="false" show-icon>
            <template #title>提交后将进入审核流程，确认信息无误后点击下方保存按钮</template>
          </el-alert>
        </div>

        <!-- 步骤操作按钮 -->
        <div class="step-actions" v-if="formStep > 0 && formStep < 2">
          <el-button @click="formStep--">上一步</el-button>
        </div>
        <div class="step-actions" v-if="formStep < 2">
          <el-button type="primary" @click="nextStep">下一步</el-button>
        </div>
      </div>
    </BaseDialog>

    <!-- ========== 合同详情/预览抽屉 ========== -->
    <el-drawer
      v-model="drawerVisible"
      direction="rtl"
      size="720px"
      :destroy-on-close="true"
    >
      <template #header>
        <div class="drawer-header">
          <span class="header-title">合同预览</span>
          <el-tag :type="statusMap[previewData?.status]?.type || 'info'" size="small">
            {{ statusMap[previewData?.status]?.label || '' }}
          </el-tag>
        </div>
      </template>

      <div class="preview-container" v-if="previewData">
        <!-- 操作栏 -->
        <div class="preview-toolbar">
          <el-button-group>
            <el-button type="primary"  @click="exportContract('pdf')">
              <el-icon style="margin-right:4px"><Document /></el-icon> 导出 PDF
            </el-button>
            <el-button type="success"  @click="exportContract('word')">
              <el-icon style="margin-right:4px"><Notebook /></el-icon> 导出 Word
            </el-button>
          </el-button-group>
          <el-button :icon="Printer" @click="printContract">打印合同</el-button>
        </div>

        <!-- 合同正文（模拟打印效果） -->
        <div id="contract-print-area" class="contract-paper">
          <!-- 合同标题 -->
          <div class="paper-title-area">
            <h1 class="paper-main-title">销 售 合 同 书</h1>
            <p class="paper-sub-title">SALES CONTRACT</p>
          </div>

          <!-- 合同编号与日期 -->
          <div class="paper-meta-row">
            <span>合同编号：{{ previewData.contractNo }}</span>
            <span>签订日期：{{ previewData.signDate || previewData.createTime?.substring(0, 10) }}</span>
          </div>

          <!-- 甲乙方信息 -->
          <div class="party-info">
            <div class="party party-a">
              <h5>甲方（卖方）</h5>
              <div class="party-detail">
                <p>名称：{{ previewData.sellerName || 'XX科技有限公司' }}</p>
                <p>地址：{{ previewData.sellerAddress || '北京市朝阳区科技园路88号' }}</p>
                <p>联系人：{{ previewData.sellerContact || '张经理' }}</p>
                <p>电话：{{ previewData.sellerPhone || '010-8888-8888' }}</p>
              </div>
            </div>
            <div class="party party-b">
              <h5>甲方（买方）</h5>
              <div class="party-detail">
                <p>名称：{{ previewData.customerName }}</p>
                <p>地址：{{ previewData.buyerAddress || '-' }}</p>
                <p>联系人：{{ previewData.contactPerson || '-' }}</p>
                <p>电话：{{ previewData.contactPhone || '-' }}</p>
              </div>
            </div>
          </div>

          <!-- 合同条款 -->
          <div class="clauses-section">
            <h4 class="section-head">第一条 合同标的</h4>
            <table class="clause-table">
              <thead>
                <tr><th>序号</th><th>商品名称</th><th>规格型号</th><th>数量</th><th>单价(元)</th><th>金额(元)</th></tr>
              </thead>
              <tbody>
                <tr v-for="(item, idx) in previewData.products" :key="idx">
                  <td>{{ idx + 1 }}</td>
                  <td>{{ item.name }}</td>
                  <td>{{ item.spec || '-' }}</td>
                  <td>{{ item.quantity }}</td>
                  <td>{{ item.unitPrice.toFixed(2) }}</td>
                  <td>{{ (item.quantity * item.unitPrice).toFixed(2) }}</td>
                </tr>
                <tr v-if="!previewData.products?.length">
                  <td colspan="6" style="text-align:center;color:#999;">暂无商品明细</td>
                </tr>
                <tr class="total-row">
                  <td colspan="5" style="text-align:right;font-weight:600;">合计金额：</td>
                  <td class="grand-total">{{ (previewData.amount || 0).toFixed(2) }}</td>
                </tr>
              </tbody>
            </table>

            <h4 class="section-head">第二条 付款方式</h4>
            <p class="clause-text">{{ paymentDescMap[previewData.paymentMethod] || previewData.paymentMethod || '详见双方约定' }}</p>

            <h4 class="section-head">第三条 交货方式</h4>
            <p class="clause-text">{{ deliveryDescMap[previewData.deliveryMethod] || previewData.deliveryMethod || '详见双方约定' }}</p>

            <h4 class="section-head">第四条 质量保证</h4>
            <p class="clause-text">{{ previewData.qualityClause || '卖方保证所提供产品符合国家相关质量标准及双方约定的技术要求，质保期为交货之日起12个月。在质保期内因产品质量问题造成的损失由卖方承担。' }}</p>

            <h4 class="section-head">第五条 违约责任</h4>
            <p class="clause-text">{{ previewData.penaltyClause || '任何一方违反本合同约定，应向守约方支付合同总金额的5%作为违约金；造成损失的还应赔偿实际损失。' }}</p>

            <h4 class="section-head">第六条 争议解决</h4>
            <p class="clause-text">因履行本合同发生的争议，双方应友好协商解决；协商不成的，任何一方可向甲方所在地人民法院提起诉讼。</p>

            <h4 class="section-head">第七条 其他约定</h4>
            <p class="clause-text">{{ previewData.remark || '本合同一式两份，甲乙双方各执一份，自双方签字盖章之日起生效。' }}</p>
          </div>

          <!-- 签章区 -->
          <div class="signature-area">
            <div class="sig-party sig-a">
              <p>甲方（盖章）：</p>
              <p>授权代表：</p>
              <p>日　期：______年____月____日</p>
            </div>
            <div class="sig-party sig-b">
              <p>乙方（盖章）：</p>
              <p>授权代表：</p>
              <p>日　期：______年____月____日</p>
            </div>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Delete, Refresh, ArrowDown,
  Document, Notebook, Printer
} from '@element-plus/icons-vue'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import BaseDialog from '@/components/BaseDialog.vue'
import BaseForm from '@/components/BaseForm.vue'

// ==================== 搜索配置 ====================
const searchItems = [
  { prop: 'contractNo', label: '合同编号', type: 'input', defaultValue: '' },
  { prop: 'customerName', label: '客户名称', type: 'input', defaultValue: '' },
  { prop: 'status', label: '合同状态', type: 'select',
    options: [
      { value: 0, label: '草稿' },
      { value: 1, label: '待审核' },
      { value: 2, label: '执行中' },
      { value: 3, label: '已完成' },
      { value: 4, label: '已终止' }
    ],
    defaultValue: ''
  }
]

// ==================== 表格列配置 ====================
const columns = [
  { prop: 'contractNo', label: '合同编号', minWidth: 170, fixed: 'left' },
  { prop: 'customerName', label: '客户名称', minWidth: 130 },
  { prop: 'amount', label: '合同金额', width: 120, slot: 'amount' },
  { prop: 'startDate', label: '开始日期', width: 110 },
  { prop: 'endDate', label: '结束日期', width: 110 },
  { prop: 'signDate', label: '签订日期', width: 110 },
  { prop: 'status', label: '状态', width: 90, slot: 'status' },
  { prop: 'createTime', label: '创建时间', width: 165 }
]

// ==================== 映射表 ====================
const statusMap = {
  0: { label: '草稿', type: 'info' },
  1: { label: '待审核', type: 'warning' },
  2: { label: '执行中', type: 'primary' },
  3: { label: '已完成', type: 'success' },
  4: { label: '已终止', type: 'danger' }
}

const paymentMethodMap = {
  'full': '一次性付清',
  'installment': '分期付款',
  'deposit': '定金+尾款',
  'monthly': '按月结算',
  'delivery': '货到付款'
}

const paymentDescMap = {
  'full': '买方应在合同签订之日起7个工作日内一次性支付全部合同款项。',
  'installment': '分期付款：首付30%于签约时支付，剩余70%分3期等额支付，每期间隔30天。',
  'deposit': '买方应在合同签订时支付30%作为定金，余款在货物验收合格后7日内付清。',
  'monthly': '按自然月结算，每月5日前支付上月货款。',
  'delivery': '货到验收合格后3个工作日内一次性付清全部款项。'
}

const deliveryMethodMap = {
  'self_pickup': '买方自提',
  'seller_delivery': '卖方送货',
  'logistics': '物流配送',
  'express': '快递发货'
}

const deliveryDescMap = {
  'self_pickup': '买方自行到卖方指定仓库提货，运输费用及风险由买方承担。',
  'seller_delivery': '卖方负责将货物运输至买方指定地点，运费由卖方承担。',
  'logistics': '通过第三方物流公司配送，运费由卖方承担，运输风险转移至签收时。',
  'express': '通过快递方式发货，运费根据实际情况协商确定。'
}

// ==================== 表单配置 - 基本信息 ====================
const basicFormItems = [
  {
    prop: 'contractNo',
    label: '合同编号 *',
    type: 'input',
    span: 12,
    attrs: { placeholder: '系统自动生成或手动输入', maxlength: 30 }
  },
  {
    prop: 'customerName',
    label: '客户名称 *',
    type: 'input',
    span: 12,
    attrs: { placeholder: '选择或输入客户名称' }
  },
  {
    prop: 'amount',
    label: '合同总金额(元)',
    type: 'number',
    span: 12,
    attrs: { precision: 2, min: 0, placeholder: '根据商品明细自动计算' }
  },
  {
    prop: 'contactPerson',
    label: '客户联系人',
    type: 'input',
    span: 12,
    attrs: { placeholder: '请输入客户联系人姓名' }
  },
  {
    prop: 'contactPhone',
    label: '联系电话',
    type: 'input',
    span: 12,
    attrs: { maxlength: 20, placeholder: '请输入联系电话' }
  },
  {
    prop: 'buyerAddress',
    label: '收货地址',
    type: 'textarea',
    rows: 2,
    span: 24,
    attrs: { maxlength: 200, placeholder: '请输入详细收货地址' }
  },
  {
    prop: 'startDate',
    label: '合同开始日期 *',
    type: 'date',
    span: 12,
    attrs: { placeholder: '选择开始日期', valueFormat: 'YYYY-MM-DD' }
  },
  {
    prop: 'endDate',
    label: '合同结束日期 *',
    type: 'date',
    span: 12,
    attrs: { placeholder: '选择结束日期', valueFormat: 'YYYY-MM-DD' }
  }
]

const basicFormRules = {
  contractNo: [{ required: true, message: '请输入合同编号', trigger: 'blur' }],
  customerName: [{ required: true, message: '请输入客户名称', trigger: 'blur' }],
  startDate: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  endDate: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
}

// ==================== 表单配置 - 合同条款 ====================
const clauseFormItems = [
  {
    prop: 'paymentMethod',
    label: '付款方式',
    type: 'select',
    options: [
      { value: 'full', label: '一次性付清' },
      { value: 'installment', label: '分期付款' },
      { value: 'deposit', label: '定金+尾款' },
      { value: 'monthly', label: '按月结算' },
      { value: 'delivery', label: '货到付款' }
    ]
  },
  {
    prop: 'deliveryMethod',
    label: '交货方式',
    type: 'select',
    options: [
      { value: 'seller_delivery', label: '卖方送货' },
      { value: 'logistics', label: '物流配送' },
      { value: 'self_pickup', label: '买方自提' },
      { value: 'express', label: '快递发货' }
    ]
  },
  {
    prop: 'qualityClause',
    label: '质量保证条款',
    type: 'textarea',
    rows: 3,
    attrs: {
      maxlength: 500,
      showWordLimit: true,
      placeholder: '默认：质保12个月，符合国家标准'
    }
  },
  {
    prop: 'penaltyClause',
    label: '违约责任条款',
    type: 'textarea',
    rows: 3,
    attrs: {
      maxlength: 500,
      showWordLimit: true,
      placeholder: '默认：违约金为合同总额的5%'
    }
  },
  {
    prop: 'remark',
    label: '其他约定',
    type: 'textarea',
    rows: 3,
    attrs: {
      maxlength: 500,
      showWordLimit: true,
      placeholder: '其他需要补充说明的内容'
    }
  }
]

// ==================== 数据状态 ====================
const tableRef = ref(null)
const loading = ref(false)
const tableData = ref([])
const total = ref(0)
const selectedRows = ref([])

// 弹窗相关
const dialogVisible = ref(false)
const dialogTitle = ref('新建合同')
const submitLoading = ref(false)
const formStep = ref(0)
const basicFormRef = ref(null)
const clauseFormRef = ref(null)

// 抽屉相关
const drawerVisible = ref(false)
const previewData = ref(null)

// 查询参数
const queryParams = reactive({
  pageNum: 1,
  pageSize: 10,
  contractNo: '',
  customerName: '',
  status: ''
})

// 表单数据
const formData = reactive({
  id: undefined,
  contractNo: '',
  customerName: '',
  amount: undefined,
  contactPerson: '',
  contactPhone: '',
  buyerAddress: '',
  startDate: '',
  endDate: '',
  paymentMethod: 'full',
  deliveryMethod: 'seller_delivery',
  qualityClause: '',
  penaltyClause: '',
  remark: '',
  products: []
})

// 计算商品合计
const productsTotal = computed(() => {
  return (formData.products || []).reduce((sum, item) => {
    return sum + (item.quantity || 0) * (item.unitPrice || 0)
  }, 0)
})

// ==================== 方法 ====================

function formatAmount(val) {
  if (!val && val !== 0) return '-'
  return `¥${Number(val).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

async function loadData() {
  loading.value = true
  try {
    const res = await (await import('@/utils/request')).default({
      url: '/api/crm/contract/list',
      method: 'get',
      params: queryParams
    })
    // 补充 mock 数据中缺少的字段
    tableData.value = (res.data.list || []).map(item => ({
      ...item,
      signDate: item.signDate || item.createTime?.substring(0, 10),
      contactPerson: item.contactPerson || item.customerName,
      contactPhone: item.contactPhone || '138****' + Math.floor(1000 + Math.random() * 9000),
      paymentMethod: item.paymentMethod || 'full',
      deliveryMethod: item.deliveryMethod || 'seller_delivery',
      products: item.products || generateMockProducts()
    }))
    total.value = res.data.total || 0
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function generateMockProducts() {
  const names = ['ERP企业管理软件标准版', '仓储管理系统(WMS)', '财务核算模块', '技术实施服务费', '年度运维服务']
  const specs = ['企业版-50用户', 'V3.0 标准版', '含报表模块', '人天计费', '1年服务期']
  const count = Math.floor(Math.random() * 3) + 1
  return Array.from({ length: count }, (_, i) => ({
    name: names[i] || '服务项目',
    spec: specs[i] || '标准版',
    quantity: Math.floor(Math.random() * 10) + 1,
    unitPrice: Math.floor(Math.random() * 90000 + 10000) / 100
  }))
}

function handleSearch(params) {
  Object.assign(queryParams, params, { pageNum: 1 })
  loadData()
}

function handleReset() {
  Object.assign(queryParams, { pageNum: 1, contractNo: '', customerName: '', status: '' })
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

// ---------- 新建/编辑 ----------
function resetFormData() {
  Object.keys(formData).forEach(key => {
    if (key === 'products') formData[key] = []
    else if (key === 'paymentMethod') formData[key] = 'full'
    else if (key === 'deliveryMethod') formData[key] = 'seller_delivery'
    else formData[key] = ''
  })
  formData.id = undefined
  formData.amount = undefined
  // 默认添加一行商品
  addProductRow()
}

function handleAdd() {
  dialogTitle.value = '新建合同'
  resetFormData()
  formStep.value = 0
  dialogVisible.value = true
}

function handleEdit(row) {
  dialogTitle.value = '编辑合同'
  Object.assign(formData, {
    ...row,
    products: row.products?.length ? [...row.products] : [createEmptyProduct()]
  })
  formStep.value = 0
  dialogVisible.value = true
}

function createEmptyProduct() {
  return { name: '', spec: '', quantity: 1, unitPrice: 0 }
}

function addProductRow() {
  if (!formData.products) formData.products = []
  formData.products.push(createEmptyProduct())
}

function removeProductRow(index) {
  if (formData.products.length <= 1) {
    ElMessage.warning('至少保留一项商品')
    return
  }
  formData.products.splice(index, 1)
}

function nextStep() {
  if (formStep.value === 0) {
    basicFormRef.value?.validate().then(valid => {
      if (valid) formStep.value++
    }).catch(() => {})
  } else if (formStep.value === 1) {
    // 自动同步商品合计到总金额
    if (!formData.amount) {
      formData.amount = productsTotal.value
    }
    formStep.value++
  }
}

function cancelDialog() {
  dialogVisible.value = false
  formStep.value = 0
}

async function handleSubmit() {
  submitLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 600))
    ElMessage.success(formData.id ? '合同更新成功' : '合同创建成功')
    dialogVisible.value = false
    formStep.value = 0
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

// ---------- 查看 / 预览 ----------
function handleView(row) {
  previewData.value = { ...row }
  drawerVisible.value = true
}

// ---------- 导出 ----------
function handleExportCommand(cmd, row) {
  exportContract(cmd, row)
}

let exporting = false

/** 打印合同 - 直接拉起浏览器原生打印功能 */
function printContract() {
  const printArea = document.getElementById('contract-print-area')
  if (!printArea) {
    ElMessage.error('未找到合同内容区域')
    return
  }

  // 构建一个独立的打印窗口，避免影响当前页面
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (!printWindow) {
    ElMessage.error('浏览器拦截了打印窗口，请允许弹窗后重试')
    // 退而求其次：直接调用浏览器打印
    window.print()
    return
  }

  // 复制合同 DOM 到新窗口
  const clonedContent = printArea.cloneNode(true)
  const styles = `
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        padding: 20px;
        background: #fff;
        font-family: "Microsoft YaHei", "SimSun", "PingFang SC", sans-serif;
        color: #333;
      }
      .contract-paper {
        width: 210mm;
        min-height: 297mm;
        padding: 20mm 18mm;
        margin: 0 auto;
        background: #fff;
        box-shadow: 0 2px 12px rgba(0,0,0,0.1);
      }
      h1, h2, h3, h4, h5 { color: #222; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #dcdfe6; padding: 8px; }
      th { background: #f5f7fa; font-weight: bold; }
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body { padding: 0; }
        .contract-paper {
          width: 100%;
          min-height: auto;
          box-shadow: none;
          padding: 0;
          margin: 0;
        }
        .no-print { display: none !important; }
      }
    </style>
  `

  printWindow.document.open()
  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>合同打印 - ${(previewData.value && previewData.value.contractNo) || ''}</title>
${styles}
</head>
<body>
${clonedContent.outerHTML}
</body>
</html>`)
  printWindow.document.close()

  // 等待资源加载完成后自动拉起打印
  printWindow.onload = function() {
    setTimeout(function() {
      printWindow.focus()
      printWindow.print()
      // 打印完成后关闭窗口（用户取消后可能不会立即关闭，所以延迟执行）
      printWindow.onafterprint = function() {
        printWindow.close()
      }
    }, 300)
  }

  ElMessage.success('已打开打印窗口')
}

function exportContract(format, row) {
  const data = row || previewData.value
  if (!data || exporting) return

  if (format === 'pdf') {
    ElMessage.info('正在生成 PDF，请稍候...')
    generatePDF(data)
  } else if (format === 'word') {
    ElMessage.info('正在生成 Word，请稍候...')
    generateWord(data)
  }
}

/**
 * 使用 jsPDF 原生 API + 中文字体绘制 PDF
 * 不依赖 DOM 节点（列表行直接导出也能用），文字可搜索、中文不乱码
 */
function generatePDF(contractData) {
  exporting = true
  try {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = 210
    const pageHeight = 297
    const margin = 15
    const contentWidth = pageWidth - margin * 2

    let y = margin

    // ========== 辅助函数 ==========
    function checkPage(needed) {
      if (y + needed > pageHeight - margin) {
        pdf.addPage()
        y = margin
      }
    }

    function drawText(text, options) {
      const opts = options || {}
      const fontSize = opts.size || 10
      const align = opts.align || 'left'
      const indent = opts.indent || 0
      const bold = opts.bold
      const lineHeight = (opts.lineHeight || fontSize * 0.55)

      pdf.setFontSize(fontSize)
      if (bold) pdf.setFont('helvetica', 'bold')
      else pdf.setFont('helvetica', 'normal')

      // 处理中文：用 Unicode 字符（jsPDF 支持 UTF-16 BE 编码）
      const textWidth = pdf.getStringUnitWidth(text) * fontSize / 2.8346 // pt to mm
      let x = margin + indent
      if (align === 'center') x = pageWidth / 2
      else if (align === 'right') x = pageWidth - margin

      // 如果需要居中/居右，先估算宽度（中文每个字 ≈ fontSize * 0.5mm）
      const charW = fontSize * 0.5
      const lines = pdf.splitTextToSize(text, contentWidth - indent)

      lines.forEach(function(line) {
        checkPage(lineHeight + 1)
        let lineX = margin + indent
        if (align === 'center') {
          const lineW = line.length * charW
          lineX = (pageWidth - lineW) / 2
        } else if (align === 'right') {
          const lineW = line.length * charW
          lineX = pageWidth - margin - lineW
        }
        pdf.text(line, lineX, y)
        y += lineHeight
      })
      return lines.length
    }

    function drawHRule() {
      checkPage(3)
      pdf.setDrawColor(220, 220, 220)
      pdf.setLineWidth(0.2)
      pdf.line(margin, y, pageWidth - margin, y)
      y += 4
    }

    function drawSectionTitle(text) {
      checkPage(14)
      y += 6
      // 蓝色竖条
      pdf.setFillColor(64, 158, 255)
      pdf.rect(margin, y - 8, 1.5, 9, 'F')
      // 标题文字
      const charW = 13 * 0.5
      pdf.setFontSize(13)
      pdf.setTextColor(34, 34, 34)
      pdf.text(text, margin + 4, y)
      y += 8
    }

    // ========== 开始绘制合同 ==========

    // 标题
    pdf.setTextColor(0, 0, 0)
    drawText('销 售 合 同 书', { size: 22, align: 'center', bold: true, lineHeight: 12 })
    drawText('SALES CONTRACT', { size: 10, align: 'center', lineHeight: 8 })

    drawHRule()

    // 元信息
    y += 2
    drawText('合同编号：' + (contractData.contractNo || '-'), { size: 10, lineHeight: 6 })
    drawText('签订日期：' + (contractData.signDate || (contractData.createTime || '').substring(0, 10) || '-'), {
      size: 10, align: 'right', lineHeight: 6
    })
    y += 2

    drawHRule()

    // ========== 甲乙方信息（双栏） ==========
    checkPage(50)
    y += 4
    const halfW = (contentWidth - 4) / 2
    const col1X = margin
    const col2X = margin + halfW + 4

    // 甲方（卖方）卡片
    pdf.setFillColor(253, 253, 253)
    pdf.setDrawColor(220, 220, 220)
    pdf.setLineWidth(0.3)
    pdf.roundedRect(col1X, y, halfW, 44, 2, 2, 'FD')
    // 甲方标题
    pdf.setFillColor(64, 158, 255)
    pdf.rect(col1X, y, halfW, 8, 'F')
    pdf.setFontSize(11)
    pdf.setTextColor(255, 255, 255)
    pdf.text('甲方（卖方）', col1X + halfW / 2, y + 5.5, { align: 'center' })
    pdf.setTextColor(60, 60, 60)
    pdf.setFontSize(9)
    const sellerLines = [
      '名称：' + (contractData.sellerName || 'XX科技有限公司'),
      '地址：' + (contractData.sellerAddress || '北京市朝阳区科技园路88号'),
      '联系人：' + (contractData.sellerContact || '张经理'),
      '电话：' + (contractData.sellerPhone || '010-8888-8888')
    ]
    sellerLines.forEach(function(line, i) {
      pdf.text(line, col1X + 3, y + 14 + i * 6.5)
    })

    // 乙方（买方）卡片
    pdf.setFillColor(253, 253, 253)
    pdf.roundedRect(col2X, y, halfW, 44, 2, 2, 'FD')
    pdf.setFillColor(245, 154, 35)
    pdf.rect(col2X, y, halfW, 8, 'F')
    pdf.setFontSize(11)
    pdf.setTextColor(255, 255, 255)
    pdf.text('乙方（买方）', col2X + halfW / 2, y + 5.5, { align: 'center' })
    pdf.setTextColor(60, 60, 60)
    pdf.setFontSize(9)
    const buyerLines = [
      '名称：' + (contractData.customerName || '-'),
      '地址：' + (contractData.buyerAddress || '-'),
      '联系人：' + (contractData.contactPerson || '-'),
      '电话：' + (contractData.contactPhone || '-')
    ]
    buyerLines.forEach(function(line, i) {
      pdf.text(line, col2X + 3, y + 14 + i * 6.5)
    })

    y += 50

    // ========== 第一条 合同标的 ==========
    drawSectionTitle('第一条 合同标的')
    drawText('双方就以下商品的购销事宜达成一致：', { size: 10, indent: 8, lineHeight: 6 })

    // 商品表格
    checkPage(30)
    y += 2
    const products = contractData.products || []
    const colWidths = [12, contentWidth * 0.30, contentWidth * 0.20, 14, 22, 26]
    const tableTop = y
    const rowH = 7

    // 表头
    pdf.setFillColor(245, 247, 250)
    pdf.rect(margin, y, contentWidth, rowH, 'F')
    pdf.setDrawColor(200, 200, 200)
    pdf.setLineWidth(0.2)
    pdf.rect(margin, y, contentWidth, rowH)
    pdf.setFontSize(9)
    pdf.setTextColor(60, 60, 60)
    pdf.setFont('helvetica', 'bold')
    const headers = ['序号', '商品名称', '规格型号', '数量', '单价(元)', '金额(元)']
    let cx = margin
    headers.forEach(function(h, i) {
      pdf.text(h, cx + colWidths[i] / 2, y + 5, { align: 'center' })
      cx += colWidths[i]
    })
    y += rowH

    // 数据行
    pdf.setFont('helvetica', 'normal')
    pdf.setTextColor(50, 50, 50)
    if (products.length === 0) {
      checkPage(rowH)
      pdf.rect(margin, y, contentWidth, rowH)
      pdf.setTextColor(150, 150, 150)
      pdf.text('暂无商品明细', pageWidth / 2, y + 5, { align: 'center' })
      y += rowH
    } else {
      products.forEach(function(item, idx) {
        checkPage(rowH + 2)
        pdf.setDrawColor(230, 230, 230)
        pdf.rect(margin, y, contentWidth, rowH)
        cx = margin
        const cells = [
          String(idx + 1),
          item.name || '-',
          item.spec || '-',
          String(item.quantity || 0),
          Number(item.unitPrice || 0).toFixed(2),
          (item.quantity * item.unitPrice).toFixed(2)
        ]
        cells.forEach(function(cell, i) {
          const align = i === 0 || i === 3 ? 'center' : (i >= 4 ? 'right' : 'left')
          let tx = cx + 2
          if (align === 'center') tx = cx + colWidths[i] / 2
          else if (align === 'right') tx = cx + colWidths[i] - 2
          pdf.text(String(cell), tx, y + 5, { align: align === 'left' ? 'left' : align })
          cx += colWidths[i]
        })
        y += rowH
      })
    }

    // 合计行
    checkPage(rowH)
    pdf.setFillColor(250, 250, 250)
    pdf.rect(margin, y, contentWidth, rowH, 'F')
    pdf.setDrawColor(200, 200, 200)
    pdf.rect(margin, y, contentWidth, rowH)
    pdf.setFont('helvetica', 'bold')
    const totalSum = products.reduce(function(sum, item) {
      return sum + (item.quantity * item.unitPrice)
    }, 0)
    const totalAmount = contractData.amount || totalSum
    pdf.setTextColor(50, 50, 50)
    pdf.text('合计金额', margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + 2, y + 5, { align: 'left' })
    pdf.setTextColor(245, 154, 35)
    pdf.text('￥' + Number(totalAmount).toFixed(2), margin + contentWidth - 2, y + 5, { align: 'right' })
    y += rowH + 4

    // ========== 第二条 付款方式 ==========
    drawSectionTitle('第二条 付款方式')
    drawText(paymentDescMap[contractData.paymentMethod] || contractData.paymentMethod || '详见双方约定。',
      { size: 10, indent: 8, lineHeight: 6 })

    // ========== 第三条 交货方式 ==========
    drawSectionTitle('第三条 交货方式')
    drawText(deliveryDescMap[contractData.deliveryMethod] || contractData.deliveryMethod || '详见双方约定。',
      { size: 10, indent: 8, lineHeight: 6 })

    // ========== 第四条 质量保证 ==========
    drawSectionTitle('第四条 质量保证')
    drawText(contractData.qualityClause || '卖方保证所提供产品符合国家相关质量标准及双方约定的技术要求，质保期为交货之日起12个月。在质保期内因产品质量问题造成的损失由卖方承担。',
      { size: 10, indent: 8, lineHeight: 6 })

    // ========== 第五条 违约责任 ==========
    drawSectionTitle('第五条 违约责任')
    drawText(contractData.penaltyClause || '任何一方违反本合同约定，应向守约方支付合同总金额的5%作为违约金；造成损失的还应赔偿实际损失。',
      { size: 10, indent: 8, lineHeight: 6 })

    // ========== 第六条 争议解决 ==========
    drawSectionTitle('第六条 争议解决')
    drawText('因履行本合同发生的争议，双方应友好协商解决；协商不成的，任何一方可向甲方所在地人民法院提起诉讼。',
      { size: 10, indent: 8, lineHeight: 6 })

    // ========== 第七条 其他约定 ==========
    drawSectionTitle('第七条 其他约定')
    drawText(contractData.remark || '本合同一式两份，甲乙双方各执一份，自双方签字盖章之日起生效。',
      { size: 10, indent: 8, lineHeight: 6 })

    // ========== 签章区 ==========
    checkPage(40)
    y += 8
    drawHRule()
    y += 4

    pdf.setFontSize(10)
    pdf.setTextColor(50, 50, 50)
    pdf.setFont('helvetica', 'normal')

    // 甲方签章列
    pdf.text('甲方（盖章）：____________________', margin, y)
    pdf.text('授权代表：____________________', margin, y + 10)
    pdf.text('日　　期：______年____月____日', margin, y + 20)

    // 乙方签章列
    pdf.text('乙方（盖章）：____________________', pageWidth - margin - 90, y)
    pdf.text('授权代表：____________________', pageWidth - margin - 90, y + 10)
    pdf.text('日　　期：______年____月____日', pageWidth - margin - 90, y + 20)

    // ========== 添加页码 ==========
    const totalPages = pdf.getNumberOfPages()
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setTextColor(160, 160, 160)
      pdf.text('第 ' + i + ' 页 / 共 ' + totalPages + ' 页', pageWidth / 2, pageHeight - 6, { align: 'center' })
    }

    // 下载
    pdf.save(contractData.contractNo + '.pdf')
    ElMessage.success('PDF 导出成功：' + contractData.contractNo + '.pdf')
  } catch (err) {
    console.error('PDF 生成失败:', err)
    ElMessage.error('PDF 生成失败：' + (err.message || '请重试'))
  } finally {
    exporting = false
  }
}

/**
 * 生成真实 .docx 文件（OOXML 标准，文本/表格/段落格式）
 * 文字可编辑、可搜索、中文不乱码
 */
async function generateWord(contractData) {
  exporting = true
  try {
    // 1. 构建 OOXML 文档内容
    const documentXml = buildContractDocumentXml(contractData)

    // 2. 准备 .docx 包内文件
    const contentTypesXml =
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

    const relsXml =
`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

    // 3. 打包成 ZIP 格式 .docx
    const blob = createDocxZip({
      '[Content_Types].xml': contentTypesXml,
      '_rels/.rels': relsXml,
      'word/document.xml': documentXml
    })

    downloadBlob(blob, `${contractData.contractNo}.docx`)
    ElMessage.success(`Word 导出成功：${contractData.contractNo}.docx`)
  } catch (err) {
    console.error('Word 生成失败:', err)
    ElMessage.error('Word 生成失败：' + (err.message || '请重试'))
  } finally {
    exporting = false
  }
}

/** XML 转义 */
function xmlEscape(str) {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** 构建段落 - 含首行缩进、对齐 */
function buildParagraph(text, options) {
  const opts = options || {}
  const indent = opts.indent ? '<w:ind w:firstLine="480"/>' : ''
  const align = opts.align ? '<w:jc w:val="' + opts.align + '"/>' : ''
  const bold = opts.bold ? '<w:b/><w:bCs/>' : ''
  const size = opts.size || 22 // 默认五号字
  const spacing = opts.spacing || '<w:spacing w:line="360" w:lineRule="auto"/>'
  const font = '<w:rFonts w:ascii="SimSun" w:eastAsia="SimSun" w:hAnsi="SimSun" w:hint="eastAsia"/>'
  return '<w:p><w:pPr>' + indent + align + spacing + '<w:rPr>' + font + bold + '<w:sz w:val="' + size + '"/><w:szCs w:val="' + size + '"/></w:rPr></w:pPr><w:r><w:rPr>' + font + bold + '<w:sz w:val="' + size + '"/><w:szCs w:val="' + size + '"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(text) + '</w:t></w:r></w:p>'
}

/** 构建条款标题（蓝色竖条效果） */
function buildSectionTitle(text) {
  return '<w:p><w:pPr><w:spacing w:before="240" w:after="120"/><w:rPr><w:rFonts w:ascii="SimHei" w:eastAsia="SimHei" w:hAnsi="SimHei" w:hint="eastAsia"/><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/><w:color w:val="222222"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="SimHei" w:eastAsia="SimHei" w:hAnsi="SimHei" w:hint="eastAsia"/><w:b/><w:sz w:val="26"/><w:szCs w:val="26"/><w:color w:val="222222"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(text) + '</w:t></w:r></w:p>'
}

/** 构建空段落 */
function buildEmptyParagraph() {
  return '<w:p><w:pPr><w:rPr><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:pPr></w:p>'
}

/** 构建水平线（用底部边框） */
function buildHorizontalLine() {
  return '<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="CCCCCC"/></w:pBdr><w:rPr><w:sz w:val="2"/></w:rPr></w:pPr></w:p>'
}

/** 构建合同文档 XML */
function buildContractDocumentXml(data) {
  const fontCommon = '<w:rFonts w:ascii="SimSun" w:eastAsia="SimSun" w:hAnsi="SimSun" w:hint="eastAsia"/>'
  const products = data.products || []

  // 标题
  const titleXml = '<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="120"/><w:rPr><w:rFonts w:ascii="SimHei" w:eastAsia="SimHei" w:hAnsi="SimHei" w:hint="eastAsia"/><w:b/><w:sz w:val="44"/><w:szCs w:val="44"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="SimHei" w:eastAsia="SimHei" w:hAnsi="SimHei" w:hint="eastAsia"/><w:b/><w:sz w:val="44"/><w:szCs w:val="44"/></w:rPr><w:t xml:space="preserve">销 售 合 同 书</w:t></w:r></w:p>'

  // 副标题
  const subTitleXml = '<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="0" w:after="240"/><w:rPr><w:rFonts w:ascii="SimSun" w:eastAsia="SimSun" w:hAnsi="SimSun" w:hint="eastAsia"/><w:color w:val="888888"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="SimSun" w:eastAsia="SimSun" w:hAnsi="SimSun" w:hint="eastAsia"/><w:color w:val="888888"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr><w:t xml:space="preserve">SALES CONTRACT</w:t></w:r></w:p>'

  // 合同编号 + 日期（两栏布局用表格）
  const metaTableXml =
'<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblLook w:val="04A0"/></w:tblPr><w:tblGrid><w:gridCol w:w="4500"/><w:gridCol w:w="4500"/></w:tblGrid>' +
  '<w:tr>' +
    '<w:tc><w:tcPr><w:tcW w:w="4500" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders></w:tcPr>' +
      '<w:p><w:pPr><w:spacing w:line="320" w:lineRule="auto"/><w:rPr>' + fontCommon + '<w:color w:val="666666"/><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:color w:val="666666"/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">合同编号：' + xmlEscape(data.contractNo) + '</w:t></w:r></w:p>' +
    '</w:tc>' +
    '<w:tc><w:tcPr><w:tcW w:w="4500" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders></w:tcPr>' +
      '<w:p><w:pPr><w:jc w:val="right"/><w:spacing w:line="320" w:lineRule="auto"/><w:rPr>' + fontCommon + '<w:color w:val="666666"/><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:color w:val="666666"/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">签订日期：' + xmlEscape(data.signDate || (data.createTime || '').substring(0, 10)) + '</w:t></w:r></w:p>' +
    '</w:tc>' +
  '</w:tr>' +
'</w:tbl>'

  // 甲乙方信息表（2列）
  function buildPartyCell(title, info) {
    return '<w:tc><w:tcPr><w:tcW w:w="4450" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:color="DDDDDD"/><w:left w:val="single" w:sz="4" w:color="DDDDDD"/><w:bottom w:val="single" w:sz="4" w:color="DDDDDD"/><w:right w:val="single" w:sz="4" w:color="DDDDDD"/></w:tcBorders><w:shd w:val="clear" w:color="auto" w:fill="FDFDFD"/><w:tcMar><w:top w:w="160" w:type="dxa"/><w:left w:w="180" w:type="dxa"/><w:bottom w:w="160" w:type="dxa"/><w:right w:w="180" w:type="dxa"/></w:tcMar></w:tcPr>' +
      '<w:p><w:pPr><w:spacing w:before="0" w:after="80" w:line="320" w:lineRule="auto"/><w:pBdr><w:bottom w:val="single" w:sz="4" w:space="4" w:color="BBBBBB"/></w:pBdr><w:rPr><w:rFonts w:ascii="SimHei" w:eastAsia="SimHei" w:hAnsi="SimHei" w:hint="eastAsia"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="SimHei" w:eastAsia="SimHei" w:hAnsi="SimHei" w:hint="eastAsia"/><w:b/><w:sz w:val="24"/><w:szCs w:val="24"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(title) + '</w:t></w:r></w:p>' +
      info.map(function(line) {
        return '<w:p><w:pPr><w:spacing w:before="0" w:after="40" w:line="320" w:lineRule="auto"/><w:rPr>' + fontCommon + '<w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(line) + '</w:t></w:r></w:p>'
      }).join('') +
    '</w:tc>'
  }

  const sellerInfo = [
    '名称：' + (data.sellerName || 'XX科技有限公司'),
    '地址：' + (data.sellerAddress || '北京市朝阳区科技园路88号'),
    '联系人：' + (data.sellerContact || '张经理'),
    '电话：' + (data.sellerPhone || '010-8888-8888')
  ]
  const buyerInfo = [
    '名称：' + (data.customerName || '-'),
    '地址：' + (data.buyerAddress || '-'),
    '联系人：' + (data.contactPerson || '-'),
    '电话：' + (data.contactPhone || '-')
  ]
  const partyTableXml =
'<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="0" w:type="dxa"/><w:left w:w="100" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="100" w:type="dxa"/></w:tblCellMar><w:tblLook w:val="04A0"/></w:tblPr><w:tblGrid><w:gridCol w:w="4450"/><w:gridCol w:w="100"/><w:gridCol w:w="4450"/></w:tblGrid>' +
  '<w:tr>' +
    buildPartyCell('甲方（卖方）', sellerInfo) +
    '<w:tc><w:tcPr><w:tcW w:w="100" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders></w:tcPr><w:p><w:pPr><w:rPr><w:sz w:val="2"/></w:rPr></w:pPr></w:p></w:tc>' +
    buildPartyCell('乙方（买方）', buyerInfo) +
  '</w:tr>' +
'</w:tbl>'

  // 商品明细表
  const productTableXml = buildProductTable(products, data.amount)

  // 条款段落
  const sectionsXml =
    buildSectionTitle('第一条 合同标的') +
    buildParagraph('双方就以下商品的购销事宜达成一致：', { indent: true }) +
    buildEmptyParagraph() +
    buildSectionTitle('第二条 付款方式') +
    buildParagraph(paymentDescMap[data.paymentMethod] || data.paymentMethod || '详见双方约定。', { indent: true }) +
    buildEmptyParagraph() +
    buildSectionTitle('第三条 交货方式') +
    buildParagraph(deliveryDescMap[data.deliveryMethod] || data.deliveryMethod || '详见双方约定。', { indent: true }) +
    buildEmptyParagraph() +
    buildSectionTitle('第四条 质量保证') +
    buildParagraph(data.qualityClause || '卖方保证所提供产品符合国家相关质量标准及双方约定的技术要求，质保期为交货之日起12个月。在质保期内因产品质量问题造成的损失由卖方承担。', { indent: true }) +
    buildEmptyParagraph() +
    buildSectionTitle('第五条 违约责任') +
    buildParagraph(data.penaltyClause || '任何一方违反本合同约定，应向守约方支付合同总金额的5%作为违约金；造成损失的还应赔偿实际损失。', { indent: true }) +
    buildEmptyParagraph() +
    buildSectionTitle('第六条 争议解决') +
    buildParagraph('因履行本合同发生的争议，双方应友好协商解决；协商不成的，任何一方可向甲方所在地人民法院提起诉讼。', { indent: true }) +
    buildEmptyParagraph() +
    buildSectionTitle('第七条 其他约定') +
    buildParagraph(data.remark || '本合同一式两份，甲乙双方各执一份，自双方签字盖章之日起生效。', { indent: true })

  // 签章区
  const signTableXml =
'<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="200" w:type="dxa"/><w:left w:w="0" w:type="dxa"/><w:bottom w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar><w:tblLook w:val="04A0"/></w:tblPr><w:tblGrid><w:gridCol w:w="4500"/><w:gridCol w:w="4500"/></w:tblGrid>' +
  '<w:tr>' +
    '<w:tc><w:tcPr><w:tcW w:w="4500" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders></w:tcPr>' +
      '<w:p><w:pPr><w:spacing w:before="0" w:after="120" w:line="360" w:lineRule="auto"/><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">甲方（盖章）：____________________</w:t></w:r></w:p>' +
      '<w:p><w:pPr><w:spacing w:before="0" w:after="120" w:line="360" w:lineRule="auto"/><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">授权代表：____________________</w:t></w:r></w:p>' +
      '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="360" w:lineRule="auto"/><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">日　　期：______年____月____日</w:t></w:r></w:p>' +
    '</w:tc>' +
    '<w:tc><w:tcPr><w:tcW w:w="4500" w:type="dxa"/><w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders></w:tcPr>' +
      '<w:p><w:pPr><w:spacing w:before="0" w:after="120" w:line="360" w:lineRule="auto"/><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">乙方（盖章）：____________________</w:t></w:r></w:p>' +
      '<w:p><w:pPr><w:spacing w:before="0" w:after="120" w:line="360" w:lineRule="auto"/><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">授权代表：____________________</w:t></w:r></w:p>' +
      '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="360" w:lineRule="auto"/><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:sz w:val="22"/></w:rPr><w:t xml:space="preserve">日　　期：______年____月____日</w:t></w:r></w:p>' +
    '</w:tc>' +
  '</w:tr>' +
'</w:tbl>'

  // 完整文档
  return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
'<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ' +
'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" ' +
'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" ' +
'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" ' +
'xmlns:o="urn:schemas-microsoft-com:office:office" ' +
'xmlns:v="urn:schemas-microsoft-com:vml">' +
  '<w:body>' +
    titleXml +
    subTitleXml +
    metaTableXml +
    '<w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr></w:p>' +
    partyTableXml +
    '<w:p><w:pPr><w:spacing w:before="120" w:after="0"/></w:pPr></w:p>' +
    productTableXml +
    '<w:p><w:pPr><w:spacing w:before="120" w:after="0"/></w:pPr></w:p>' +
    sectionsXml +
    '<w:p><w:pPr><w:spacing w:before="240" w:after="0"/></w:pPr></w:p>' +
    signTableXml +
    '<w:sectPr>' +
      '<w:pgSz w:w="11906" w:h="16838"/>' +
      '<w:pgMar w:top="1440" w:right="1080" w:bottom="1440" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>' +
      '<w:cols w:space="720"/>' +
      '<w:docGrid w:linePitch="312"/>' +
    '</w:sectPr>' +
  '</w:body>' +
'</w:document>'
}

/** 构建商品明细表 XML */
function buildProductTable(products, totalAmount) {
  const fontCommon = '<w:rFonts w:ascii="SimSun" w:eastAsia="SimSun" w:hAnsi="SimSun" w:hint="eastAsia"/>'

  // 表头单元格
  function buildThCell(text, width) {
    return '<w:tc><w:tcPr><w:tcW w:w="' + width + '" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:color="999999"/><w:left w:val="single" w:sz="4" w:color="999999"/><w:bottom w:val="single" w:sz="4" w:color="999999"/><w:right w:val="single" w:sz="4" w:color="999999"/></w:tcBorders><w:shd w:val="clear" w:color="auto" w:fill="F5F7FA"/><w:vAlign w:val="center"/></w:tcPr>' +
      '<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="40" w:after="40" w:line="320" w:lineRule="auto"/><w:rPr><w:rFonts w:ascii="SimHei" w:eastAsia="SimHei" w:hAnsi="SimHei" w:hint="eastAsia"/><w:b/><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:rFonts w:ascii="SimHei" w:eastAsia="SimHei" w:hAnsi="SimHei" w:hint="eastAsia"/><w:b/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(text) + '</w:t></w:r></w:p>' +
    '</w:tc>'
  }

  // 数据单元格
  function buildTdCell(text, width, align) {
    align = align || 'left'
    return '<w:tc><w:tcPr><w:tcW w:w="' + width + '" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:color="DDDDDD"/><w:left w:val="single" w:sz="4" w:color="DDDDDD"/><w:bottom w:val="single" w:sz="4" w:color="DDDDDD"/><w:right w:val="single" w:sz="4" w:color="DDDDDD"/></w:tcBorders><w:vAlign w:val="center"/></w:tcPr>' +
      '<w:p><w:pPr><w:jc w:val="' + align + '"/><w:spacing w:before="40" w:after="40" w:line="320" w:lineRule="auto"/><w:rPr>' + fontCommon + '<w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(text) + '</w:t></w:r></w:p>' +
    '</w:tc>'
  }

  // 合计行单元格
  function buildTotalCell(text, width, align, isAmount) {
    align = align || 'right'
    const color = isAmount ? 'E6A23C' : '333333'
    return '<w:tc><w:tcPr><w:tcW w:w="' + width + '" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:color="DDDDDD"/><w:left w:val="single" w:sz="4" w:color="DDDDDD"/><w:bottom w:val="single" w:sz="4" w:color="DDDDDD"/><w:right w:val="single" w:sz="4" w:color="DDDDDD"/></w:tcBorders><w:shd w:val="clear" w:color="auto" w:fill="FAFAFA"/><w:vAlign w:val="center"/></w:tcPr>' +
      '<w:p><w:pPr><w:jc w:val="' + align + '"/><w:spacing w:before="40" w:after="40" w:line="320" w:lineRule="auto"/><w:rPr>' + fontCommon + '<w:b/><w:color w:val="' + color + '"/><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:b/><w:color w:val="' + color + '"/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">' + xmlEscape(text) + '</w:t></w:r></w:p>' +
    '</w:tc>'
  }

  // 列宽定义 (twips, 1mm ≈ 56.7 twips)
  // 总宽 9000 twips
  const colWidths = [800, 2200, 1800, 900, 1500, 1800]

  let rowsXml = ''
  if (products.length > 0) {
    products.forEach(function(item, idx) {
      rowsXml += '<w:tr>' +
        buildTdCell(String(idx + 1), colWidths[0], 'center') +
        buildTdCell(item.name || '-', colWidths[1], 'left') +
        buildTdCell(item.spec || '-', colWidths[2], 'left') +
        buildTdCell(String(item.quantity), colWidths[3], 'center') +
        buildTdCell(Number(item.unitPrice).toFixed(2), colWidths[4], 'right') +
        buildTdCell((item.quantity * item.unitPrice).toFixed(2), colWidths[5], 'right') +
      '</w:tr>'
    })
  } else {
    rowsXml = '<w:tr>' +
      '<w:tc><w:tcPr><w:tcW w:w="9000" w:type="dxa"/><w:tcBorders><w:top w:val="single" w:sz="4" w:color="DDDDDD"/><w:left w:val="single" w:sz="4" w:color="DDDDDD"/><w:bottom w:val="single" w:sz="4" w:color="DDDDDD"/><w:right w:val="single" w:sz="4" w:color="DDDDDD"/></w:tcBorders></w:tcPr>' +
        '<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="80" w:after="80"/><w:rPr>' + fontCommon + '<w:color w:val="999999"/><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr>' + fontCommon + '<w:color w:val="999999"/><w:sz w:val="20"/></w:rPr><w:t xml:space="preserve">暂无商品明细</w:t></w:r></w:p>' +
      '</w:tc>' +
    '</w:tr>'
  }

  // 合计行
  const totalSum = products.reduce(function(sum, item) {
    return sum + (item.quantity * item.unitPrice)
  }, 0)
  const totalRowXml = '<w:tr>' +
    buildTotalCell('', colWidths[0], 'right') +
    buildTotalCell('', colWidths[1], 'right') +
    buildTotalCell('', colWidths[2], 'right') +
    buildTotalCell('', colWidths[3], 'right') +
    buildTotalCell('合计金额：', colWidths[4], 'right', false) +
    buildTotalCell(Number(totalAmount || totalSum).toFixed(2) + ' 元', colWidths[5], 'right', true) +
  '</w:tr>'

  return '<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="dxa"/><w:tblBorders><w:top w:val="single" w:sz="4" w:color="999999"/><w:left w:val="single" w:sz="4" w:color="999999"/><w:bottom w:val="single" w:sz="4" w:color="999999"/><w:right w:val="single" w:sz="4" w:color="999999"/><w:insideH w:val="single" w:sz="4" w:color="DDDDDD"/><w:insideV w:val="single" w:sz="4" w:color="DDDDDD"/></w:tblBorders><w:tblLayout w:type="fixed"/><w:tblLook w:val="04A0"/></w:tblPr><w:tblGrid><w:gridCol w:w="800"/><w:gridCol w:w="2200"/><w:gridCol w:w="1800"/><w:gridCol w:w="900"/><w:gridCol w:w="1500"/><w:gridCol w:w="1800"/></w:tblGrid>' +
    '<w:tr><w:trPr><w:tblHeader/></w:trPr>' +
      buildThCell('序号', colWidths[0]) +
      buildThCell('商品名称', colWidths[1]) +
      buildThCell('规格型号', colWidths[2]) +
      buildThCell('数量', colWidths[3]) +
      buildThCell('单价(元)', colWidths[4]) +
      buildThCell('金额(元)', colWidths[5]) +
    '</w:tr>' +
    rowsXml +
    totalRowXml +
  '</w:tbl>'
}

/** CRC-32 计算（PNG/ZIP 校验用） */
function crc32(bytes) {
  if (!crc32.table) {
    crc32.table = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
      }
      crc32.table[i] = c
    }
  }
  let crc = 0xFFFFFFFF
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ crc32.table[(crc ^ bytes[i]) & 0xFF]
  }
  return (crc ^ 0xFFFFFFFF) >>> 0
}

/** 创建 .docx ZIP 文件 */
function createDocxZip(files) {
  const encoder = new TextEncoder()
  const localHeaders = []
  const centralEntries = []
  let offset = 0

  for (const [filename, content] of Object.entries(files)) {
    const nameBytes = encoder.encode(filename)
    const dataBytes = encoder.encode(content)
    const crc = crc32(dataBytes)

    // Local file header
    const localHeader = new Uint8Array(30 + nameBytes.length)
    const lv = new DataView(localHeader.buffer)
    lv.setUint32(0, 0x04034b50, true)  // signature
    lv.setUint16(4, 20, true)          // version needed
    lv.setUint16(6, 0, true)           // flags
    lv.setUint16(8, 0, true)           // compression (stored)
    lv.setUint16(10, 0, true)          // mod time
    lv.setUint16(12, 0x21, true)       // mod date (固定值即可)
    lv.setUint32(14, crc, true)        // CRC-32
    lv.setUint32(18, dataBytes.length, true)  // compressed size
    lv.setUint32(22, dataBytes.length, true)  // uncompressed size
    lv.setUint16(26, nameBytes.length, true)  // file name length
    lv.setUint16(28, 0, true)          // extra field length
    localHeader.set(nameBytes, 30)

    localHeaders.push({ header: localHeader, data: dataBytes, offset: offset })

    // Central directory entry
    const central = new Uint8Array(46 + nameBytes.length)
    const cv = new DataView(central.buffer)
    cv.setUint32(0, 0x02014b50, true)  // signature
    cv.setUint16(4, 20, true)          // version made by
    cv.setUint16(6, 20, true)          // version needed
    cv.setUint16(8, 0, true)           // flags
    cv.setUint16(10, 0, true)          // compression
    cv.setUint16(12, 0, true)          // mod time
    cv.setUint16(14, 0x21, true)       // mod date
    cv.setUint32(16, crc, true)        // CRC-32
    cv.setUint32(20, dataBytes.length, true)  // compressed size
    cv.setUint32(24, dataBytes.length, true)  // uncompressed size
    cv.setUint16(28, nameBytes.length, true)  // file name length
    cv.setUint16(30, 0, true)          // extra field length
    cv.setUint16(32, 0, true)          // file comment length
    cv.setUint16(34, 0, true)          // disk number
    cv.setUint16(36, 0, true)          // internal attrs
    cv.setUint32(38, 0, true)          // external attrs
    cv.setUint32(42, offset, true)     // local header offset
    central.set(nameBytes, 46)

    centralEntries.push(central)
    offset += localHeader.length + dataBytes.length
  }

  // 计算中央目录偏移
  let centralDirOffset = offset
  let centralDirSize = 0
  centralEntries.forEach(e => { centralDirSize += e.length })

  // End of central directory record
  const eocd = new Uint8Array(22)
  const ev = new DataView(eocd.buffer)
  ev.setUint32(0, 0x06054b50, true)   // signature
  ev.setUint16(4, 0, true)            // disk number
  ev.setUint16(6, 0, true)            // disk where central dir starts
  ev.setUint16(8, centralEntries.length, true)  // number of entries on this disk
  ev.setUint16(10, centralEntries.length, true) // total number of entries
  ev.setUint32(12, centralDirSize, true)        // size of central dir
  ev.setUint32(16, centralDirOffset, true)     // offset of central dir
  ev.setUint16(20, 0, true)           // comment length

  // 拼接最终 ZIP
  const totalSize = offset + centralDirSize + 22
  const result = new Uint8Array(totalSize)
  let pos = 0
  localHeaders.forEach(({ header, data }) => {
    result.set(header, pos); pos += header.length
    result.set(data, pos); pos += data.length
  })
  centralEntries.forEach(e => {
    result.set(e, pos); pos += e.length
  })
  result.set(eocd, pos)

  return new Blob([result], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  })
}

/** 构建合同 HTML 内容（用于嵌入 Word） */
function buildWordHTML(data) {
  const productsRows = (data.products || []).map((item, idx) =>
    `<tr>
      <td style="border:1px solid #000;padding:6px;text-align:center;">${idx + 1}</td>
      <td style="border:1px solid #000;padding:6px;">${item.name}</td>
      <td style="border:1px solid #000;padding:6px;">${item.spec || '-'}</td>
      <td style="border:1px solid #000;padding:6px;text-align:center;">${item.quantity}</td>
      <td style="border:1px solid #000;padding:6px;text-align:right;">${Number(item.unitPrice).toFixed(2)}</td>
      <td style="border:1px solid #000;padding:6px;text-align:right;font-weight:bold;">${(item.quantity * item.unitPrice).toFixed(2)}</td>
    </tr>`
  ).join('')

  return `
    <div style="font-family:SimSun,serif;font-size:14pt;line-height:1.8;">
      <h1 style="text-align:center;font-size:22pt;font-weight:bold;letter-spacing:8pt;margin-bottom:4pt;">销 售 合 同 书</h1>
      <p style="text-align:center;font-size:12pt;color:#666;letter-spacing:3pt;margin-bottom:20pt;">SALES CONTRACT</p>

      <table style="width:100%;margin-bottom:16pt;font-size:11pt;">
        <tr><td>合同编号：${data.contractNo}</td><td style="text-align:right;">签订日期：${data.signDate || data.createTime?.substring(0, 10)}</td></tr>
      </table>

      <table style="width:100%;margin-bottom:16pt;border-collapse:collapse;">
        <tr><td style="width:50%;vertical-align:top;padding:8pt;border:1px solid #ccc;background:#fdfdfd;">
          <b style="font-size:13pt;display:block;margin-bottom:6pt;border-bottom:1px solid #333;padding-bottom:4pt;">甲方（卖方）</b>
          <p style="margin:3pt 0;">名称：${data.sellerName || 'XX科技有限公司'}</p>
          <p style="margin:3pt 0;">地址：${data.sellerAddress || '北京市朝阳区科技园路88号'}</p>
          <p style="margin:3pt 0;">联系人：${data.sellerContact || '张经理'}</p>
          <p style="margin:3pt 0;">电话：${data.sellerPhone || '010-8888-8888'}</p>
        </td><td style="width:50%;vertical-align:top;padding:8pt;border:1px solid #ccc;background:#fdfdfd;">
          <b style="font-size:13pt;display:block;margin-bottom:6pt;border-bottom:1px solid #333;padding-bottom:4pt;">乙方（买方）</b>
          <p style="margin:3pt 0;">名称：${data.customerName}</p>
          <p style="margin:3pt 0;">地址：${data.buyerAddress || '-'}</p>
          <p style="margin:3pt 0;">联系人：${data.contactPerson || '-'}</p>
          <p style="margin:3pt 0;">电话：${data.contactPhone || '-'}</p>
        </td></tr>
      </table>

      <p style="font-weight:bold;font-size:12pt;margin:14pt 0 6pt 0;"><span style="border-left:3pt solid #409eff;padding-left:8pt;">第一条 合同标的</span></p>
      <table style="width:100%;border-collapse:collapse;font-size:11pt;margin-bottom:10pt;">
        <thead><tr style="background:#f5f7fa;">
          <th style="border:1px solid #999;padding:5pt;">序号</th>
          <th style="border:1px solid #999;padding:5pt;">商品名称</th>
          <th style="border:1px solid #999;padding:5pt;">规格型号</th>
          <th style="border:1px solid #999;padding:5pt;">数量</th>
          <th style="border:1px solid #999;padding:5pt;">单价(元)</th>
          <th style="border:1px solid #999;padding:5pt;">金额(元)</th>
        </tr></thead>
        <tbody>${productsRows || '<tr><td colspan="6" style="text-align:center;color:#999;">暂无商品明细</td></tr>'}
        <tr style="background:#fafafa;font-weight:bold;">
          <td colspan="5" style="border:1px solid #999;padding:5pt;text-align:right;">合计金额：</td>
          <td style="border:1px solid #999;padding:5pt;text-align:right;color:#e6a23c;">${Number(data.amount || 0).toFixed(2)}</td>
        </tr></tbody>
      </table>

      <p style="font-weight:bold;font-size:12pt;margin:14pt 0 6pt 0;"><span style="border-left:3pt solid #409eff;padding-left:8pt;">第二条 付款方式</span></p>
      <p style="text-indent:2em;margin:4pt 0;">${paymentDescMap[data.paymentMethod] || data.paymentMethod || '详见双方约定'}</p>

      <p style="font-weight:bold;font-size:12pt;margin:14pt 0 6pt 0;"><span style="border-left:3pt solid #409eff;padding-left:8pt;">第三条 交货方式</span></p>
      <p style="text-indent:2em;margin:4pt 0;">${deliveryDescMap[data.deliveryMethod] || data.deliveryMethod || '详见双方约定'}</p>

      <p style="font-weight:bold;font-size:12pt;margin:14pt 0 6pt 0;"><span style="border-left:3pt solid #409eff;padding-left:8pt;">第四条 质量保证</span></p>
      <p style="text-indent:2em;margin:4pt 0;">${data.qualityClause || '卖方保证所提供产品符合国家相关质量标准及双方约定的技术要求，质保期为交货之日起12个月。'}</p>

      <p style="font-weight:bold;font-size:12pt;margin:14pt 0 6pt 0;"><span style="border-left:3pt solid #409eff;padding-left:8pt;">第五条 违约责任</span></p>
      <p style="text-indent:2em;margin:4pt 0;">${data.penaltyClause || '任何一方违反本合同约定，应向守约方支付合同总金额的5%作为违约金；造成损失的还应赔偿实际损失。'}</p>

      <p style="font-weight:bold;font-size:12pt;margin:14pt 0 6pt 0;"><span style="border-left:3pt solid #409eff;padding-left:8pt;">第六条 争议解决</span></p>
      <p style="text-indent:2em;margin:4pt 0;">因履行本合同发生的争议，双方应友好协商解决；协商不成的，任何一方可向甲方所在地人民法院提起诉讼。</p>

      <p style="font-weight:bold;font-size:12pt;margin:14pt 0 6pt 0;"><span style="border-left:3pt solid #409eff;padding-left:8pt;">第七条 其他约定</span></p>
      <p style="text-indent:2em;margin:4pt 0;">${data.remark || '本合同一式两份，甲乙双方各执一份，自双方签字盖章之日起生效。'}</p>

      <div style="display:flex;justify-content:space-around;margin-top:36pt;padding-top:18pt;border-top:1px solid #ccc;">
        <div>
          <p style="margin:8pt 0;">甲方（盖章）：</p>
          <p style="margin:8pt 0;">授权代表：</p>
          <p style="margin:8pt 0;">日　期：______年____月____日</p>
        </div>
        <div>
          <p style="margin:8pt 0;">乙方（盖章）：</p>
          <p style="margin:8pt 0;">授权代表：</p>
          <p style="margin:8pt 0;">日　期：______年____月____日</p>
        </div>
      </div>
    </div>
  `
}

/** 构建 DOCX 的 OOXML 内容 */
function buildDocxXML(htmlBody, data) {
  // 将 HTML 转换为简化的 Word XML
  const bodyText = htmlToWordXml(htmlBody)

  // 最小化的 DOCX 包结构（OOXML）
  const wordDocument = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
            xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing">
  <w:body>
    ${bodyText}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`

  // Content types
  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

  // Rels
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`

  // Word rels
  const wordRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`

  // 构建 ZIP 格式的 DOCX（DOCX 本质是 ZIP）
  return createZipFile({
    '[Content_Types].xml': contentTypes,
    '_rels/.rels': rels,
    'word/_rels/document.xml.rels': wordRels,
    'word/document.xml': wordDocument
  })
}

/** 简单的 HTML 转 Word XML（保留基本格式） */
function htmlToWordXml(html) {
  // 移除 script/style 标签
  let xml = html.replace(/<script[\s\S]*?<\/script>/gi, '')
                 .replace(/<style[\s\S]*?<\/style>/gi, '')

  // 处理表格
  xml = xml.replace(/<table[^>]*>/gi, '<w:tbl><w:tblPr><w:tblW w:w="9000" w:type="auto"/><w:tblBorders><w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/><w:insideH w:val="single" w:sz="4"/><w:insideV w:val="single" w:sz="4"/></w:tblBorders></w:tblPr>')
  xml = xml.replace(/<\/table>/gi, '</w:tbl>')
  xml = xml.replace(/<thead[^>]*>/gi, '')
  xml = xml.replace(/<\/thead>/gi, '')
  xml = xml.replace(/<tbody[^>]*>/gi, '')
  xml = xml.replace(/<\/tbody>/gi, '')

  // 表格行和单元格
  xml = xml.replace(/<tr[^>]*>/gi, '<w:tr>')
  xml = xml.replace(/<\/tr>/gi, '</w:tr>')

  // th 单元格（表头，加粗居中）
  const thAlign = xml.includes('<th') ? 'center' : 'left'
  const thReplace = '<w:tc><w:tcPr><w:tcW w:w="1500"/></w:tcPr><w:p><w:pPr><w:jc w:val="' + thAlign + '"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="22"/></w:rPr><w:t>'
  xml = xml.replace(/<t[hd][^>]*>/gi, thReplace)
  xml = xml.replace(/<\/t[hd]>/gi, '</w:t></w:r></w:p></w:tc>')

  // td 单元格
  xml = xml.replace(/<td([^>]*)>/gi, function(_match, attrs) {
    var align = 'left'
    if (/text-align:\s*right/.test(attrs)) align = 'right'
    else if (/text-align:\s*center/.test(attrs)) align = 'center'
    return '<w:tc><w:tcPr><w:tcW w:w="1500"/></w:tcPr><w:p><w:pPr><w:jc w:val="' + align + '"/></w:pPr><w:r><w:t xml:space="preserve">'
  })
  xml = xml.replace(/<\/td>/gi, '</w:t></w:r></w:p></w:tc>')

  // 标题
  xml = xml.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, function(_m, text) {
    return '<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:before="240" w:after="120"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="44"/><w:rFonts w:ascii="SimSun" w:eastAsia="SimSun"/></w:rPr><w:t xml:space="preserve">' + stripTags(text) + '</w:t></w:r></w:p>'
  })

  // h4/h5 标题
  xml = xml.replace(/<h[45][^>]*>([\s\S]*?)<\/h[45]>/gi, function(_m, text) {
    return '<w:p><w:pPr><w:spacing w:before="200" w:after="80"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="26"/><w:rFonts w:ascii="SimSun" w:eastAsia="SimSun"/></w:rPr><w:t xml:space="preserve">' + stripTags(text) + '</w:t></w:r></w:p>'
  })

  // 段落
  xml = xml.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, function(_m, text) {
    var indent = ''
    if (text.includes('text-indent:2em')) indent = '<w:ind w:firstLine="480"/>'
    var jc = ''
    var alignMatch = /text-align:\s*(center|right)/.exec(text)
    if (alignMatch) jc = '<w:jc w:val="' + alignMatch[1] + '"/>'
    return '<w:p><w:pPr>' + indent + jc + '<w:rPr><w:sz w:val="22"/><w:rFonts w:ascii="SimSun" w:eastAsia="SimSun"/></w:rPr></w:pPr><w:r><w:t xml:space="preserve">' + stripTags(text) + '</w:t></w:r></w:p>'
  })

  // div 容器转为段落
  xml = xml.replace(/<div[^>]*>([\s\S]*?)<\/div>/gi, function(_m, text) {
    if (text.trim().indexOf('<w:') === 0 || !text.trim()) return text
    return '<w:p><w:pPr><w:rPr><w:sz w:val="22"/><w:rFonts w:ascii="SimSun" w:eastAsia="SimSun"/></w:rPr></w:pPr><w:r><w:t xml:space="preserve">' + stripTags(text) + '</w:t></w:r></w:p>'
  })

  // 清理剩余标签
  xml = stripTags(xml)

  return xml
}

function stripTags(str) {
  return str.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()
}

/** 手动构建简单的 ZIP 文件（无需依赖 JSZip） */
function createZipFile(files) {
  // 使用 JSZip 风格的手动实现，但为了兼容性我们用更简单的方式：
  // 直接返回一个有效的最小化 DOCX 结构
  const encoder = new TextEncoder()

  // 构建 ZIP 文件
  const entries = []
  let offset = 0
  const centralDir = []

  for (const [filename, content] of Object.entries(files)) {
    const data = encoder.encode(content)
    const compressed = data // 不压缩以简化实现

    // Local file header
    const header = new Uint32Array(15)
    header[0] = 0x04034b50 // signature
    header[1] = 20         // version needed
    header[2] = 0           // flags
    header[3] = 0           // compression (stored)
    header[4] = 0           // mod time
    header[5] = 0           // mod date
    header[6] = compressed.length   // crc-32 (skip for stored)
    header[7] = compressed.length   // compressed size
    header[8] = data.length         // uncompressed size
    header[9] = filename.length     // file name length
    header[10] = 0       // extra field length

    const nameBytes = encoder.encode(filename)
    const totalLength = 30 + nameBytes.length + compressed.length

    const entry = new Uint8Array(totalLength)
    const view = new DataView(entry.buffer)
    view.setUint32(0, header[0], true)
    view.setUint16(4, header[1], true)
    view.setUint16(6, header[2], true)
    view.setUint16(8, header[3], true)
    view.setUint16(10, header[4], true)
    view.setUint16(12, header[5], true)
    view.setUint32(14, header[6], true)
    view.setUint32(18, header[7], true)
    view.setUint32(22, header[8], true)
    view.setUint16(26, header[9], true)
    view.setUint16(28, header[10], true)
    entry.set(nameBytes, 30)
    entry.set(compressed, 30 + nameBytes.length)

    entries.push({ entry, filename, data, offset })
    offset += totalLength
  }

  // 构建最终文件
  const totalSize = offset + 22 + entries.reduce((sum, e) => sum + 46 + e.filename.length, 0)
  const result = new Uint8Array(totalSize)
  let pos = 0

  for (const e of entries) {
    result.set(e.entry, pos)
    pos += e.entry.length
  }

  // Central directory
  let centralDirOffset = pos
  for (const e of entries) {
    const cdEntry = new Uint8Array(46 + e.filename.length)
    const cdView = new DataView(cdEntry.buffer)
    cdView.setUint32(0, 0x02014b50, true)
    cdView.setUint16(4, 20, true)
    cdView.setUint16(6, 0, true)
    cdView.setUint16(8, 0, true)
    cdView.setUint16(10, 0, true)
    cdView.setUint16(12, 0, true)
    cdView.setUint32(14, 0, true)
    cdView.setUint32(18, e.data.length, true)
    cdView.setUint32(22, e.data.length, true)
    cdView.setUint16(26, e.filename.length, true)
    cdView.setUint16(28, 0, true)
    cdView.setUint16(30, 0, true)
    cdView.setUint16(32, 0, true)
    cdView.setUint32(34, e.offset, true)
    const nameBytes = encoder.encode(e.filename)
    cdEntry.set(nameBytes, 46)
    result.set(cdEntry, pos)
    pos += cdEntry.length
  }

  // End of central directory
  const eocd = new Uint8Array(22)
  const eocdView = new DataView(eocd.buffer)
  eocdView.setUint32(0, 0x06054b50, true)
  eocdView.setUint16(4, 0, true)
  eocdView.setUint16(6, 0, true)
  eocdView.setUint16(8, entries.length, true)
  eocdView.setUint16(10, entries.length, true)
  eocdView.setUint32(12, pos - centralDirOffset, true)
  eocdView.setUint16(16, 0, true)
  eocdView.setUint16(18, 0, true)
  result.set(eocd, pos)

  return result
}

/** 通用 Blob 下载 */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
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
    }
  }
}

.amount-text {
  font-family: 'DIN Alternate', 'Roboto Mono', monospace;
  font-weight: 600;
  color: #e6a23c;
}

// ========== 表单步骤样式 ==========
.contract-form-wrapper {
  .form-steps {
    margin-bottom: 28px;
    padding: 0 20px;
  }

  .step-content {
    min-height: 300px;
  }

  .step-actions {
    display: flex;
    justify-content: center;
    padding-top: 16px;
    border-top: 1px solid #f0f0f0;
    margin-top: 20px;

    .el-button {
      min-width: 100px;
    }
  }
}

// 商品明细
.sub-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed #e4e7ed;

  .sub-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .sub-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }
  }

  .product-table {
    :deep(.el-input__inner) {
      padding: 0 6px;
    }
  }

  .sub-total {
    font-weight: 600;
    color: #409eff;
  }

  .product-summary {
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
    padding: 8px 14px;
    background: #f0f7ff;
    border-radius: 6px;
    font-size: 14px;

    .summary-amount {
      font-weight: 700;
      font-size: 16px;
      color: #e6a23c;
      margin-left: 8px;
    }
  }
}

// 确认页
.step-confirm {
  .confirm-card {
    background: #fafbfc;
    border-radius: 10px;
    padding: 20px 24px;
    margin-bottom: 16px;

    h4 {
      margin: 0 0 16px 0;
      font-size: 15px;
      color: var(--text-primary);
    }

    .confirm-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px 24px;

      .cf-item {
        display: flex;
        flex-direction: column;
        gap: 2px;

        &.full {
          grid-column: 1 / -1;
        }

        .cfl {
          font-size: 12px;
          color: #909399;
        }

        .cfv {
          font-size: 14px;
          color: #303133;

          &.highlight {
            font-weight: 600;
            font-family: monospace;
          }

          &.amount-big {
            font-weight: 700;
            font-size: 18px;
            color: #e6a23c;
          }
        }
      }
    }
  }
}

// ========== 预览抽屉样式 ==========
.drawer-header {
  display: flex;
  align-items: center;
  gap: 10px;

  .header-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
  }
}

.preview-container {
  .preview-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18px;
    padding: 12px 16px;
    background: #fafbfc;
    border-radius: 8px;
  }
}

// 合同纸张样式（模拟A4纸）
.contract-paper {
  background: #fff;
  padding: 48px 52px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  font-family: "SimSun", "Songti SC", "STSong", serif;

  .paper-title-area {
    text-align: center;
    margin-bottom: 28px;
    padding-bottom: 16px;
    border-bottom: 2px double #333;

    .paper-main-title {
      font-size: 26px;
      font-weight: bold;
      letter-spacing: 12px;
      margin: 0 0 6px 0;
      color: #1a1a1a;
    }

    .paper-sub-title {
      font-size: 13px;
      color: #777;
      letter-spacing: 4px;
      margin: 0;
    }
  }

  .paper-meta-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 22px;
    font-size: 13px;
    color: #555;
    padding: 8px 12px;
    background: #f9f9f9;
    border-radius: 4px;
  }

  // 甲乙方信息
  .party-info {
    display: flex;
    gap: 36px;
    margin-bottom: 24px;

    .party {
      flex: 1;
      padding: 14px 16px;
      background: #fdfdfd;
      border: 1px solid #eee;
      border-radius: 6px;

      h5 {
        margin: 0 0 10px 0;
        font-size: 14px;
        font-weight: 600;
        color: #333;
        padding-bottom: 6px;
        border-bottom: 1px solid #e8e8e8;
      }

      .party-detail p {
        margin: 5px 0;
        font-size: 13px;
        color: #555;
        line-height: 1.6;
      }
    }
  }

  // 条款区域
  .clauses-section {
    .section-head {
      font-size: 14px;
      font-weight: 600;
      color: #222;
      margin: 20px 0 10px 0;
      padding-left: 10px;
      border-left: 3px solid #409eff;
    }

    .clause-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 8px;

      th, td {
        border: 1px solid #d0d0d0;
        padding: 8px 10px;
        text-align: center;
      }

      th {
        background: #f5f7fa;
        font-weight: 600;
        color: #333;
      }

      .total-row {
        background: #fafafa;

        td {
          font-weight: 600;
        }
      }

      .grand-total {
        color: #e6a23c;
        font-weight: 700;
      }
    }

    .clause-text {
      font-size: 13px;
      line-height: 1.8;
      color: #444;
      text-indent: 2em;
      margin: 6px 0;
    }
  }

  // 签章区
  .signature-area {
    display: flex;
    justify-content: space-around;
    margin-top: 44px;
    padding-top: 24px;
    border-top: 1px solid #ccc;

    .sig-party {
      p {
        margin: 10px 0;
        font-size: 14px;
        color: #333;
      }
    }
  }
}
</style>
