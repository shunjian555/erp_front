<template>
  <div class="page-container">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card social-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value">{{ statistics.socialTotal }}</div>
              <div class="stat-label">社保总额(月)</div>
            </div>
            <el-icon :size="40" color="#409EFF"><OfficeBuilding /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card housing-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value" style="color: #67C23A">{{ statistics.housingTotal }}</div>
              <div class="stat-label">公积金总额(月)</div>
            </div>
            <el-icon :size="40" color="#67C23A"><House /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value" style="color: #E6A23C">{{ statistics.coverageRate }}%</div>
              <div class="stat-label">参保覆盖率</div>
            </div>
            <el-icon :size="40" color="#E6A23C"><UserFilled /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-value" style="color: #F56C6C">{{ statistics.pendingCount }}</div>
              <div class="stat-label">待处理事项</div>
            </div>
            <el-icon :size="40" color="#F56C6C"><Warning /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 政策参数配置卡片 -->
    <el-card shadow="never" class="mb-4">
      <template #header>
        <div class="card-header">
          <span>当前政策参数（{{ currentCity }}）</span>
          <el-button type="primary" size="small" :icon="Setting" @click="handleEditPolicy">修改参数</el-button>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <!-- 社会保险 -->
        <el-tab-pane label="社会保险" name="social">
          <el-table :data="socialPolicy" border size="small">
            <el-table-column prop="type" label="险种" width="120" fixed />
            <el-table-column prop="baseLabel" label="缴费基数说明" min-width="200" showOverflowTooltip />
            <el-table-column label="单位比例(%)" width="110" align="center">
              <template #default="{ row }">
                <el-tag>{{ row.companyRate }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="个人比例(%)" width="110" align="center">
              <template #default="{ row }">
                <el-tag type="warning">{{ row.personalRate }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="minBase" label="基数下限" width="120" align="right">
              <template #default="{ row }">
                ￥{{ row.minBase?.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="maxBase" label="基数上限" width="120" align="right">
              <template #default="{ row }">
                ￥{{ row.maxBase?.toLocaleString() }}
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="150" showOverflowTooltip />
          </el-table>
        </el-tab-pane>

        <!-- 住房公积金 -->
        <el-tab-pane label="住房公积金" name="housing">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="缴存比例范围">{{ housingPolicy.minRate }}% - {{ housingPolicy.maxRate }}%</el-descriptions-item>
            <el-descriptions-item label="默认单位比例">{{ housingPolicy.companyRate }}%</el-descriptions-item>
            <el-descriptions-item label="默认个人比例">{{ housingPolicy.personalRate }}%</el-descriptions-item>
            <el-descriptions-item label="缴存基数下限">￥{{ housingPolicy.minBase?.toLocaleString() }}</el-descriptions-item>
            <el-descriptions-item label="缴存基数上限">￥{{ housingPolicy.maxBase?.toLocaleString() }}</el-descriptions-item>
            <el-descriptions-item label="月最高缴存额(单位+个人)">
              <strong>￥{{ ((housingPolicy.maxBase * (housingPolicy.companyRate + housingPolicy.personalRate)) / 100).toFixed(0)?.toLocaleString() }}</strong>
            </el-descriptions-item>
            <el-descriptions-item label="提取条件" :span="2">{{ housingPolicy.withdrawCondition }}</el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <BaseSearch :search-items="searchItems" @search="handleSearch" @reset="handleReset" />

    <div class="table-toolbar">
      <div class="toolbar-left">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增参保</el-button>
        <el-button type="success" :icon="Check" plain @click="handleBatchPay">批量缴费</el-button>
        <el-button type="warning" :icon="Edit" plain @click="handleAdjustBase">基数调整</el-button>
        <el-button type="info" :icon="Download" plain @click="handleExport">导出报表</el-button>
        <el-button type="primary" :icon="Upload" plain @click="handleImport">导入数据</el-button>
      </div>
      <div class="toolbar-right">
        <el-button :icon="Refresh" circle @click="loadData" />
      </div>
    </div>

    <BaseTable
      :columns="columns"
      :table-data="tableData"
      :loading="loading"
      :total="pagination.total"
      :current-page="pagination.current"
      :page-size="pagination.pageSize"
      @selection-change="handleSelectionChange"
      @current-change="handlePageChange"
      @size-change="handleSizeChange"
    >
      <!-- 缴费基数列 -->
      <template #baseAmount="{ row }">
        <span class="money">￥{{ row.baseAmount.toLocaleString() }}</span>
      </template>

      <!-- 单位社保列 -->
      <template #companySocial="{ row }">
        <span class="money primary">￥{{ row.companySocial.toLocaleString() }}</span>
      </template>

      <!-- 个人社保列 -->
      <template #personalSocial="{ row }">
        <span class="money warning">￥{{ row.personalSocial.toLocaleString() }}</span>
      </template>

      <!-- 单位公积金列 -->
      <template #companyHousing="{ row }">
        <span class="money success">￥{{ row.companyHousing.toLocaleString() }}</span>
      </template>

      <!-- 个人公积金列 -->
      <template #personalHousing="{ row }">
        <span class="money info">￥{{ row.personalHousing.toLocaleString() }}</span>
      </template>

      <!-- 合计列 -->
      <template #totalAmount="{ row }">
        <strong class="money danger">￥{{ row.totalAmount.toLocaleString() }}</strong>
      </template>

      <!-- 状态列 -->
      <template #status="{ row }">
        <el-tag :type="getStatusType(row.status)">{{ row.status }}</el-tag>
      </template>

      <!-- 操作列 -->
      <template #action="{ row }">
        <MoreActions :items="rowActions(row)" :max="3" />
      </template>
    </BaseTable>

    <!-- 新增/编辑对话框 -->
    <BaseDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="950px"
      @confirm="handleSubmit"
      @cancel="handleCancel"
    >
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="140px">
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="员工姓名" prop="employeeId">
              <el-select v-model="formData.employeeId" filterable placeholder="请选择员工" style="width: 100%">
                <el-option
                  v-for="emp in employeeList"
                  :key="emp.id"
                  :label="`${emp.name} (${emp.deptName})`"
                  :value="emp.id"
                  :disabled="emp.hasInsurance"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="参保城市" prop="city">
              <el-select v-model="formData.city" placeholder="请选择城市" style="width: 100%">
                <el-option label="北京" value="北京" />
                <el-option label="上海" value="上海" />
                <el-option label="广州" value="广州" />
                <el-option label="深圳" value="深圳" />
                <el-option label="杭州" value="杭州" />
                <el-option label="南京" value="南京" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-divider content-position="left">社会保险设置</el-divider>
        <el-table :data="formData.socialItems" border size="small">
          <el-table-column prop="name" label="险种" width="100" />
          <el-table-column label="是否参保" width="90" align="center">
            <template #default="{ row }">
              <el-switch v-model="row.enabled" />
            </template>
          </el-table-column>
          <el-table-column label="缴费基数" width="160">
            <template #default="{ row }">
              <el-input-number
                v-model="row.base"
                :min="row.minBase"
                :max="row.maxBase"
                :precision="0"
                size="small"
                controls-position="right"
                style="width: 100%"
                :disabled="!row.enabled"
              />
            </template>
          </el-table-column>
          <el-table-column label="单位缴纳" width="130" align="right">
            <template #default="{ row }">
              <span v-if="row.enabled" class="money primary">￥{{ calcSocial(row.base, row.companyRate) }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="个人缴纳" width="130" align="right">
            <template #default="{ row }">
              <span v-if="row.enabled" class="money warning">￥{{ calcSocial(row.base, row.personalRate) }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
        </el-table>

        <el-divider content-position="left">住房公积金设置</el-divider>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="是否缴存">
              <el-switch v-model="formData.housingEnabled" active-text="是" inactive-text="否" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="缴存基数">
              <el-input-number
                v-model="formData.housingBase"
                :min="housingPolicy.minBase"
                :max="housingPolicy.maxBase"
                :precision="0"
                style="width: 100%"
                :disabled="!formData.housingEnabled"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="缴存比例(%)">
              <el-input-number
                v-model="formData.housingRate"
                :min="5"
                :max="12"
                :precision="0"
                style="width: 100%"
                :disabled="!formData.housingEnabled"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20" v-if="formData.housingEnabled">
          <el-col :span="12">
            <el-statistic title="单位月缴存额" :value="calcHousing(formData.housingBase, formData.housingRate)" precision="2">
              <template #prefix>￥</template>
            </el-statistic>
          </el-col>
          <el-col :span="12">
            <el-statistic title="个人月缴存额" :value="calcHousing(formData.housingBase, formData.housingRate)" precision="2">
              <template #prefix>￥</template>
            </el-statistic>
          </el-col>
        </el-row>

        <el-divider content-position="left">汇总信息</el-divider>
        <el-alert
          :title="`月度合计：单位缴纳 ￥${calcCompanyTotal()} | 个人缴纳 ￥${calcPersonalTotal()} | 总计 ￥${calcGrandTotal()}`"
          type="info"
          :closable="false"
          show-icon
        />

        <el-form-item label="生效日期" class="mt-4">
          <el-date-picker v-model="formData.effectiveDate" type="date" placeholder="选择日期" style="width: 100%" />
        </el-form-item>

        <el-form-item label="备注说明">
          <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="请输入备注信息" />
        </el-form-item>
      </el-form>
    </BaseDialog>

    <!-- 详情对话框 -->
    <BaseDialog v-model="detailVisible" title="社保公积金详情" width="1050px" :show-footer="false">
      <el-descriptions :column="3" border class="mb-4">
        <el-descriptions-item label="姓名">{{ detailData.employeeName }}</el-descriptions-item>
        <el-descriptions-item label="工号">{{ detailData.employeeNo }}</el-descriptions-item>
        <el-descriptions-item label="部门">{{ detailData.deptName }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ detailData.idCard }}</el-descriptions-item>
        <el-descriptions-item label="参保城市">{{ detailData.city }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(detailData.status)">{{ detailData.status }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="参保日期">{{ detailData.startDate }}</el-descriptions-item>
        <el-descriptions-item label="缴费基数">{{ detailData.baseAmount ? '￥' + detailData.baseAmount.toLocaleString() : '-' }}</el-descriptions-item>
        <el-descriptions-item label="最后更新">{{ detailData.updateTime }}</el-descriptions-item>
      </el-descriptions>

      <h4 class="mt-4 mb-2">社会保险明细</h4>
      <el-table :data="detailData.socialDetails || []" border size="small" class="mb-4">
        <el-table-column prop="name" label="险种" width="100" />
        <el-table-column prop="status" label="参保状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '正常' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="base" label="缴费基数" width="120" align="right">
          <template #default="{ row }">
            ￥{{ row.base?.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="companyRate" label="单位比例" width="90" align="center">
          <template #default="{ row }">{{ row.companyRate }}%</template>
        </el-table-column>
        <el-table-column prop="companyAmount" label="单位缴纳" width="120" align="right">
          <template #default="{ row }">
            <span class="money primary">￥{{ row.companyAmount?.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="personalRate" label="个人比例" width="90" align="center">
          <template #default="{ row }">{{ row.personalRate }}%</template>
        </el-table-column>
        <el-table-column prop="personalAmount" label="个人缴纳" width="120" align="right">
          <template #default="{ row }">
            <span class="money warning">￥{{ row.personalAmount?.toLocaleString() }}</span>
          </template>
        </el-table-column>
      </el-table>

      <h4 class="mt-2 mb-2">住房公积金明细</h4>
      <el-descriptions :column="2" border class="mb-4">
        <el-descriptions-item label="缴存状态">
          <el-tag :type="detailData.housingStatus === '正常' ? 'success' : 'info'">{{ detailData.housingStatus || '未缴存' }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="缴存基数">￥{{ detailData.housingBase?.toLocaleString() || '-' }}</el-descriptions-item>
        <el-descriptions-item label="单位比例">{{ detailData.housingCompanyRate || 0 }}%</el-descriptions-item>
        <el-descriptions-item label="个人比例">{{ detailData.housingPersonalRate || 0 }}%</el-descriptions-item>
        <el-descriptions-item label="单位月缴存">￥{{ detailData.companyHousing?.toLocaleString() || 0 }}</el-descriptions-item>
        <el-descriptions-item label="个人月缴存">￥{{ detailData.personalHousing?.toLocaleString() || 0 }}</el-descriptions-item>
      </el-descriptions>

      <h4 class="mt-2 mb-2">月度汇总</h4>
      <el-row :gutter="20" class="summary-section">
        <el-col :span="8">
          <el-statistic title="单位缴纳合计" :value="detailData.companyTotal" precision="2">
            <template #prefix>￥</template>
          </el-statistic>
        </el-col>
        <el-col :span="8">
          <el-statistic title="个人缴纳合计" :value="detailData.personalTotal" precision="2">
            <template #prefix>￥</template>
          </el-statistic>
        </el-col>
        <el-col :span="8">
          <el-statistic title="总计" :value="detailData.totalAmount" precision="2">
            <template #prefix>￥</template>
            <template #suffix>
              <el-tag type="danger" size="small">月度</el-tag>
            </template>
          </el-statistic>
        </el-col>
      </el-row>

      <h4 class="mt-4 mb-2">缴费记录</h4>
      <el-table :data="detailData.paymentHistory || []" border size="small">
        <el-table-column prop="period" label="缴费月份" width="110" />
        <el-table-column prop="companyAmount" label="单位缴纳" width="120" align="right">
          <template #default="{ row }">￥{{ row.companyAmount?.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="personalAmount" label="个人缴纳" width="120" align="right">
          <template #default="{ row }">￥{{ row.personalAmount?.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column prop="payStatus" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.payStatus === '已缴' ? 'success' : 'warning'" size="small">{{ row.payStatus }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="payTime" label="缴费时间" width="170" />
        <el-table-column prop="operator" label="操作人" width="100" />
      </el-table>
    </BaseDialog>

    <!-- 基数调整对话框 -->
    <BaseDialog v-model="adjustVisible" title="批量基数调整" width="700px" @confirm="handleAdjustSubmit">
      <el-alert
        title="将对选中的员工进行基数调整，调整后将在下月生效"
        type="warning"
        :closable="false"
        show-icon
        class="mb-4"
      />
      <el-form ref="adjustFormRef" :model="adjustForm" label-width="140px">
        <el-form-item label="调整类型" required>
          <el-radio-group v-model="adjustForm.type">
            <el-radio value="fixed">固定金额</el-radio>
            <el-radio value="increase">按比例上调</el-radio>
            <el-radio value="decrease">按比例下调</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="adjustForm.type === 'fixed'" label="新基数" required>
          <el-input-number v-model="adjustForm.newBase" :min="0" :precision="0" style="width: 100%" />
        </el-form-item>
        <el-form-item v-else label="调整比例(%)" required>
          <el-input-number v-model="adjustForm.rate" :min="1" :max="50" :precision="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="生效月份" required>
          <el-date-picker v-model="adjustForm.effectiveMonth" type="month" placeholder="选择月份" style="width: 100%" />
        </el-form-item>
        <el-form-item label="调整原因">
          <el-input v-model="adjustForm.reason" type="textarea" :rows="2" placeholder="如：年度基数核定、工资变动等" />
        </el-form-item>
      </el-form>
    </BaseDialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus,
  Delete,
  Refresh,
  Check,
  Edit,
  Download,
  Upload,
  Setting,
  OfficeBuilding,
  House,
  UserFilled,
  Warning,
} from '@element-plus/icons-vue'
import BaseSearch from '@/components/BaseSearch.vue'
import BaseTable from '@/components/BaseTable.vue'
import MoreActions from '@/components/MoreActions.vue'

// 每行操作按钮配置
function rowActions(row) {
  return [
    { label: '详情', type: 'primary', important: true, onClick: () => handleView(row) },
    { label: '调整', type: 'warning', important: true, onClick: () => handleEdit(row) },
    { label: '缴费', type: 'success', important: true, onClick: () => handlePay(row) },
    { label: '停保', type: 'danger', onClick: () => handleStopWithConfirm(row) }
  ]
}
function handleStopWithConfirm(row) {
  ElMessageBox.confirm('确定停保该员工吗？', '提示', { type: 'warning' })
    .then(() => handleStop(row.id))
    .catch(() => {})
}
import BaseDialog from '@/components/BaseDialog.vue'
import { getInsuranceList, saveInsurance, deleteInsurance, payInsurance } from '@/api/hr'

// 当前城市
const currentCity = ref('上海')

// 活动标签页
const activeTab = ref('social')

// 社保政策参数
const socialPolicy = ref([
  {
    type: '养老保险',
    baseLabel: '上年度月平均工资',
    companyRate: 16,
    personalRate: 8,
    minBase: 6520,
    maxBase: 34188,
    remark: '累计满15年可领取养老金',
  },
  {
    type: '医疗保险',
    baseLabel: '上年度月平均工资',
    companyRate: 9.5,
    personalRate: 2 + 0.5,
    minBase: 6520,
    maxBase: 34188,
    remark: '含基本医疗和大病互助，个人另付3元/月',
  },
  {
    type: '失业保险',
    baseLabel: '上年度月平均工资',
    companyRate: 0.5,
    personalRate: 0.5,
    minBase: 6520,
    maxBase: 34188,
    remark: '非因本人意愿中断就业可领取',
  },
  {
    type: '工伤保险',
    baseLabel: '行业基准费率',
    companyRate: [0.2, 0.4, 0.7, 0.9, 1.1, 1.3, 1.6, 1.9][0],
    personalRate: 0,
    minBase: 6520,
    maxBase: 34188,
    remark: '单位全额承担，个人不缴费',
  },
  {
    type: '生育保险',
    baseLabel: '上年度月平均工资',
    companyRate: 0.8,
    personalRate: 0,
    minBase: 6520,
    maxBase: 34188,
    remark: '与医疗保险合并征收，单位全额承担',
  },
])

// 公积金政策参数
const housingPolicy = reactive({
  minRate: 5,
  maxRate: 12,
  companyRate: 7,
  personalRate: 7,
  minBase: 2420,
  maxBase: 31014,
  withdrawCondition: '购买、建造、翻建、大修自住住房；偿还购房贷款本息；租房等情形可提取',
})

// 搜索项配置
const searchItems = [
  {
    prop: 'keyword',
    label: '关键词',
    type: 'input',
    placeholder: '搜索员工/工号',
  },
  {
    prop: 'deptName',
    label: '部门',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      { label: '技术部', value: '技术部' },
      { label: '销售部', value: '销售部' },
      { label: '财务部', value: '财务部' },
      { label: '行政部', value: '行政部' },
    ],
  },
  {
    prop: 'city',
    label: '参保城市',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      { label: '北京', value: '北京' },
      { label: '上海', value: '上海' },
      { label: '广州', value: '广州' },
      { label: '深圳', value: '深圳' },
    ],
  },
  {
    prop: 'status',
    label: '状态',
    type: 'select',
    options: [
      { label: '全部', value: '' },
      { label: '正常参保', value: '正常' },
      { label: '暂停', value: '暂停' },
      { label: '待缴费', value: '待缴费' },
    ],
  },
]

// 表格列配置
const columns = [
  { type: 'selection', width: 50, fixed: 'left' },
  { prop: 'employeeNo', label: '工号', width: 120, fixed: 'left' },
  { prop: 'employeeName', label: '姓名', width: 90, fixed: 'left' },
  { prop: 'deptName', label: '部门', width: 100 },
  { slot: 'baseAmount', label: '缴费基数', width: 130, align: 'right' },
  { slot: 'companySocial', label: '单位社保', width: 120, align: 'right' },
  { slot: 'personalSocial', label: '个人社保', width: 120, align: 'right' },
  { slot: 'companyHousing', label: '单位公积金', width: 120, align: 'right' },
  { slot: 'personalHousing', label: '个人公积金', width: 120, align: 'right' },
  { slot: 'totalAmount', label: '合计', width: 120, align: 'right' },
  { prop: 'city', label: '参保地', width: 80 },
  { slot: 'status', label: '状态', width: 90 },
  { prop: 'updateTime', label: '更新时间', width: 170 },
  { slot: 'action', label: '操作', width: 220, fixed: 'right' },
]

// 统计数据
const statistics = reactive({
  socialTotal: '¥458,600.00',
  housingTotal: '¥235,200.00',
  coverageRate: '98.5',
  pendingCount: '12',
})

// 数据状态
const loading = ref(false)
const tableData = ref([])
const selectedRows = ref([])
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
})

// 对话框状态
const dialogVisible = ref(false)
const dialogTitle = ref('新增参保')
const formRef = ref(null)
const formData = reactive({
  id: null,
  employeeId: '',
  city: '上海',
  effectiveDate: new Date(),
  remark: '',
  socialItems: [
    { name: '养老保险', enabled: true, base: 20000, minBase: 6520, maxBase: 34188, companyRate: 16, personalRate: 8 },
    { name: '医疗保险', enabled: true, base: 20000, minBase: 6520, maxBase: 34188, companyRate: 10, personalRate: 2.5 },
    { name: '失业保险', enabled: true, base: 20000, minBase: 6520, maxBase: 34188, companyRate: 0.5, personalRate: 0.5 },
    { name: '工伤保险', enabled: true, base: 20000, minBase: 6520, maxBase: 34188, companyRate: 0.2, personalRate: 0 },
    { name: '生育保险', enabled: true, base: 20000, minBase: 6520, maxBase: 34188, companyRate: 0.8, personalRate: 0 },
  ],
  housingEnabled: true,
  housingBase: 25000,
  housingRate: 7,
})

// 详情
const detailVisible = ref(false)
const detailData = ref({})

// 基数调整
const adjustVisible = ref(false)
const adjustFormRef = ref(null)
const adjustForm = reactive({
  type: 'fixed',
  newBase: null,
  rate: 5,
  effectiveMonth: new Date(),
  reason: '',
})

// 员工列表（模拟）
const employeeList = ref([
  { id: 1, name: '张三', deptName: '技术部', hasInsurance: false },
  { id: 2, name: '李四', deptName: '销售部', hasInsurance: false },
  { id: 3, name: '王五', deptName: '财务部', hasInsurance: false },
])

// 计算社保金额
function calcSocial(base, rate) {
  return Math.round((base * rate) / 100 * 100) / 100
}

// 计算公积金
function calcHousing(base, rate) {
  return Math.round((base * rate) / 100 * 100) / 100
}

// 计算单位合计
function calcCompanyTotal() {
  let total = 0
  formData.socialItems.forEach((item) => {
    if (item.enabled) total += calcSocial(item.base, item.companyRate)
  })
  if (formData.housingEnabled) total += calcHousing(formData.housingBase, formData.housingRate)
  return total.toFixed(2)
}

// 计算个人合计
function calcPersonalTotal() {
  let total = 0
  formData.socialItems.forEach((item) => {
    if (item.enabled) total += calcSocial(item.base, item.personalRate)
  })
  if (formData.housingEnabled) total += calcHousing(formData.housingBase, formData.housingRate)
  return total.toFixed(2)
}

// 计算总计
function calcGrandTotal() {
  return (parseFloat(calcCompanyTotal()) + parseFloat(calcPersonalTotal())).toFixed(2)
}

// 获取状态类型
function getStatusType(status) {
  const map = {
    '正常': 'success',
    '暂停': 'info',
    '待缴费': 'warning',
    '已停保': 'danger',
  }
  return map[status] || 'info'
}

// 加载数据
async function loadData() {
  loading.value = true
  try {
    const params = {
      page: pagination.current,
      pageSize: pagination.pageSize,
      ...searchParams.value,
    }
    const res = await getInsuranceList(params)
    tableData.value = res.data.list || []
    pagination.total = res.data.total || 0

    // 更新统计
    if (res.data.statistics) {
      Object.assign(statistics, res.data.statistics)
    }
  } catch (error) {
    console.error('加载失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索参数
const searchParams = ref({})

function handleSearch(params) {
  searchParams.value = params
  pagination.current = 1
  loadData()
}

function handleReset() {
  searchParams.value = {}
  pagination.current = 1
  loadData()
}

// 分页处理
function handlePageChange(page) {
  pagination.current = page
  loadData()
}

function handleSizeChange(size) {
  pagination.pageSize = size
  pagination.current = 1
  loadData()
}

// 选择变化
function handleSelectionChange(rows) {
  selectedRows.value = rows
}

// 编辑政策
function handleEditPolicy() {
  ElMessage.info('请联系系统管理员修改政策参数')
}

// 新增
function handleAdd() {
  dialogTitle.value = '新增参保'
  resetForm()
  dialogVisible.value = true
}

// 查看详情
function handleView(row) {
  detailData.value = {
    ...row,
    socialDetails: [
      { name: '养老保险', status: '正常', base: row.baseAmount, companyRate: 16, personalRate: 8, companyAmount: row.baseAmount * 0.16, personalAmount: row.baseAmount * 0.08 },
      { name: '医疗保险', status: '正常', base: row.baseAmount, companyRate: 10, personalRate: 2.5, companyAmount: row.baseAmount * 0.1, personalAmount: row.baseAmount * 0.025 },
      { name: '失业保险', status: '正常', base: row.baseAmount, companyRate: 0.5, personalRate: 0.5, companyAmount: row.baseAmount * 0.005, personalAmount: row.baseAmount * 0.005 },
      { name: '工伤保险', status: '正常', base: row.baseAmount, companyRate: 0.2, personalRate: 0, companyAmount: row.baseAmount * 0.002, personalAmount: 0 },
      { name: '生育保险', status: '正常', base: row.baseAmount, companyRate: 0.8, personalRate: 0, companyAmount: row.baseAmount * 0.008, personalAmount: 0 },
    ],
    housingStatus: '正常',
    housingBase: row.baseAmount,
    housingCompanyRate: 7,
    housingPersonalRate: 7,
    companyHousing: row.baseAmount * 0.07,
    personalHousing: row.baseAmount * 0.07,
    companyTotal: row.companySocial + row.companyHousing,
    personalTotal: row.personalSocial + row.personalHousing,
    paymentHistory: [
      { period: '2026-01', companyAmount: row.companySocial + row.companyHousing, personalAmount: row.personalSocial + row.personalHousing, payStatus: '已缴', payTime: '2026-01-15 10:30', operator: '系统自动' },
      { period: '2025-12', companyAmount: row.companySocial + row.companyHousing, personalAmount: row.personalSocial + row.personalHousing, payStatus: '已缴', payTime: '2025-12-15 09:20', operator: '系统自动' },
      { period: '2025-11', companyAmount: row.companySocial + row.companyHousing, personalAmount: row.personalSocial + row.personalHousing, payStatus: '已缴', payTime: '2025-11-17 11:00', operator: '系统自动' },
    ],
  }
  detailVisible.value = true
}

// 调整
function handleEdit(row) {
  dialogTitle.value = '调整参保信息'
  Object.assign(formData, {
    ...row,
    employeeId: row.id,
    city: row.city,
    socialItems: [
      { name: '养老保险', enabled: true, base: row.baseAmount, minBase: 6520, maxBase: 34188, companyRate: 16, personalRate: 8 },
      { name: '医疗保险', enabled: true, base: row.baseAmount, minBase: 6520, maxBase: 34188, companyRate: 10, personalRate: 2.5 },
      { name: '失业保险', enabled: true, base: row.baseAmount, minBase: 6520, maxBase: 34188, companyRate: 0.5, personalRate: 0.5 },
      { name: '工伤保险', enabled: true, base: row.baseAmount, minBase: 6520, maxBase: 34188, companyRate: 0.2, personalRate: 0 },
      { name: '生育保险', enabled: true, base: row.baseAmount, minBase: 6520, maxBase: 34188, companyRate: 0.8, personalRate: 0 },
    ],
    housingEnabled: true,
    housingBase: row.baseAmount,
    housingRate: 7,
  })
  dialogVisible.value = true
}

// 缴费
function handlePay(row) {
  ElMessageBox.confirm(
    `确定为 ${row.employeeName} 办理本月社保公积金缴费吗？`,
    '缴费确认',
    { type: 'warning' }
  ).then(async () => {
    try {
      await payInsurance(row.id)
      ElMessage.success('缴费成功')
      loadData()
    } catch (error) {
      console.error('缴费失败:', error)
    }
  })
}

// 停保
async function handleStop(id) {
  try {
    await deleteInsurance(id)
    ElMessage.success('已办理停保')
    loadData()
  } catch (error) {
    console.error('停保失败:', error)
  }
}

// 提交表单
async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const data = {
          ...formData,
          companySocial: calcCompanyTotal(),
          personalTotal: calcPersonalTotal(),
          totalAmount: calcGrandTotal(),
        }
        await saveInsurance(data)
        ElMessage.success(formData.id ? '更新成功' : '参保成功')
        dialogVisible.value = false
        loadData()
      } catch (error) {
        console.error('保存失败:', error)
      }
    }
  })
}

// 取消
function handleCancel() {
  dialogVisible.value = false
  resetForm()
}

// 重置表单
function resetForm() {
  Object.assign(formData, {
    id: null,
    employeeId: '',
    city: '上海',
    effectiveDate: new Date(),
    remark: '',
    socialItems: [
      { name: '养老保险', enabled: true, base: 20000, minBase: 6520, maxBase: 34188, companyRate: 16, personalRate: 8 },
      { name: '医疗保险', enabled: true, base: 20000, minBase: 6520, maxBase: 34188, companyRate: 10, personalRate: 2.5 },
      { name: '失业保险', enabled: true, base: 20000, minBase: 6520, maxBase: 34188, companyRate: 0.5, personalRate: 0.5 },
      { name: '工伤保险', enabled: true, base: 20000, minBase: 6520, maxBase: 34188, companyRate: 0.2, personalRate: 0 },
      { name: '生育保险', enabled: true, base: 20000, minBase: 6520, maxBase: 34188, companyRate: 0.8, personalRate: 0 },
    ],
    housingEnabled: true,
    housingBase: 25000,
    housingRate: 7,
  })
}

// 批量缴费
function handleBatchPay() {
  ElMessageBox.confirm(
    `确定批量缴纳选中的 ${selectedRows.value.length} 名员工的社保公积金吗？`,
    '批量缴费确认',
    { type: 'warning' }
  ).then(() => {
    ElMessage.success(`已提交 ${selectedRows.value.length} 条缴费申请`)
    loadData()
  })
}

// 基数调整
function handleAdjustBase() {
  if (!selectedRows.value.length) {
    ElMessage.warning('请先选择要调整的员工')
    return
  }
  adjustForm.type = 'fixed'
  adjustForm.newBase = null
  adjustForm.rate = 5
  adjustForm.effectiveMonth = new Date()
  adjustForm.reason = ''
  adjustVisible.value = true
}

// 提交基数调整
async function handleAdjustSubmit() {
  try {
    ElMessage.success(`已提交基数调整申请，影响 ${selectedRows.value.length} 名员工`)
    adjustVisible.value = false
    loadData()
  } catch (error) {
    console.error('调整失败:', error)
  }
}

// 导出
function handleExport() {
  ElMessage.success('正在导出社保公积金报表...')
}

// 导入
function handleImport() {
  ElMessage.info('导入功能开发中...')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
}
.mb-4 {
  margin-bottom: 16px;
}
.mt-2 {
  margin-top: 8px;
}
.mt-4 {
  margin-top: 16px;
}
.mb-2 {
  margin-bottom: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-card {
  border-left: 4px solid #409EFF;
}
.social-card {
  border-left-color: #409EFF;
}
.housing-card {
  border-left-color: #67C23A;
}
.stat-card:nth-child(3) {
  border-left-color: #E6A23C;
}
.stat-card:nth-child(4) {
  border-left-color: #F56C6C;
}

.stat-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.money {
  font-family: 'Courier New', monospace;
  font-weight: 500;
}
.money.primary {
  color: #409eff;
}
.money.success {
  color: #67c23a;
}
.money.warning {
  color: #e6a23c;
}
.money.danger {
  color: #f56c6c;
}
.money.info {
  color: #909399;
}

.summary-section {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  margin-top: 16px;
}
</style>
