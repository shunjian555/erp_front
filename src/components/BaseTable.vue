<template>
  <div class="base-table">
    <el-table
      ref="tableRef"
      v-loading="loading"
      :data="tableData"
      :border="border"
      :stripe="stripe"
      :row-key="rowKey"
      :default-sort="defaultSort || undefined"
      :height="height"
      :max-height="maxHeight"
      :show-summary="showSummary"
      :summary-method="summaryMethod"
      :header-cell-class-name="'table-header-cell'"
      :row-class-name="rowClassName"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
      @row-click="handleRowClick"
    >
      <!-- 多选列 -->
      <el-table-column
        v-if="showSelection"
        type="selection"
        width="50"
        align="center"
        reserve-selection
      />

      <!-- 序号列 -->
      <el-table-column
        v-if="showIndex"
        type="index"
        label="#"
        width="56"
        align="center"
        :index="indexMethod"
      />

      <!-- 动态列 -->
      <template v-for="column in visibleColumns" :key="column.prop">
        <el-table-column
          :prop="column.prop"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth || 120"
          :fixed="column.fixed"
          :sortable="column.sortable"
          :align="column.align || 'center'"
          :show-overflow-tooltip="column.showOverflowTooltip !== false"
          :formatter="column.formatter"
        >
          <template #default="{ row, $index }" v-if="column.slot">
            <slot :name="column.slot" :row="row" :index="$index" />
          </template>
        </el-table-column>
      </template>

      <!-- 操作列 -->
      <el-table-column
        v-if="$slots.operation"
        :label="t('common.operation')"
        :width="operationWidth || '180'"
        fixed="right"
        align="center"
        class-name="operation-column"
      >
        <template #default="{ row, $index }">
          <slot name="operation" :row="row" :index="$index" />
        </template>
      </el-table-column>

      <!-- 空数据 -->
      <template #empty>
        <BaseEmpty />
      </template>
    </el-table>

    <!-- 分页 -->
    <div v-if="showPagination && total > 0" class="pagination-wrapper">
      <div class="pagination-info">
        {{ t('common.total') }} <span class="total-num">{{ total }}</span> {{ t('common.items') }}
      </div>
      <el-pagination
        :current-page="currentPage"
        :page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="sizes, prev, pager, next, jumper"
        background
        :pager-count="5"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseEmpty from './BaseEmpty.vue'

const { t } = useI18n()

const props = defineProps({
  tableData: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  },
  border: {
    type: Boolean,
    default: true
  },
  stripe: {
    type: Boolean,
    default: true
  },
  rowKey: {
    type: [String, Function],
    default: 'id'
  },
  defaultSort: {
    type: Object,
    default: null
  },
  height: {
    type: [String, Number],
    default: undefined
  },
  maxHeight: {
    type: [String, Number],
    default: undefined
  },
  showSelection: {
    type: Boolean,
    default: false
  },
  showIndex: {
    type: Boolean,
    default: false
  },
  showPagination: {
    type: Boolean,
    default: true
  },
  total: {
    type: Number,
    default: 0
  },
  currentPage: {
    type: Number,
    default: 1
  },
  pageSize: {
    type: Number,
    default: 10
  },
  operationWidth: {
    type: [String, Number],
    default: 180
  },
  showSummary: {
    type: Boolean,
    default: false
  },
  summaryMethod: {
    type: Function,
    default: null
  }
})

const emit = defineEmits([
  'update:currentPage',
  'update:pageSize',
  'selection-change',
  'sort-change',
  'row-click',
  'size-change',
  'current-change'
])

const tableRef = ref(null)

// 过滤可见的列
const visibleColumns = computed(() => {
  return props.columns.filter((col) => col.visible !== false)
})

// 行样式
function rowClassName({ rowIndex }) {
  return `table-row-${rowIndex % 2}`
}

// 序号方法（考虑分页）
function indexMethod(index) {
  return (props.currentPage - 1) * props.pageSize + index + 1
}

function handleSelectionChange(selection) {
  emit('selection-change', selection)
}

function handleSortChange({ column, prop, order }) {
  emit('sort-change', { column, prop, order })
}

function handleRowClick(row, column, event) {
  emit('row-click', row, column, event)
}

function handleSizeChange(val) {
  emit('update:pageSize', val)
  emit('size-change', val)
}

function handleCurrentChange(val) {
  emit('update:currentPage', val)
  emit('current-change', val)
}

function clearSelection() {
  tableRef.value?.clearSelection()
}

defineExpose({
  clearSelection,
  $el: tableRef
})
</script>

<style lang="scss" scoped>
.base-table {
  background: #fff;
  border-radius: var(--border-radius-base);
  overflow: hidden;

  .pagination-wrapper {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 18px;
    border-top: 1px solid var(--border-color-lighter);

    .pagination-info {
      font-size: 13px;
      color: var(--text-secondary);

      .total-num {
        color: var(--primary-color);
        font-weight: 600;
        margin: 0 3px;
      }
    }

    :deep(.el-pagination) {
      flex-wrap: wrap;

      .btn-prev,
      .btn-next,
      .el-pager li {
        border-radius: 6px;
        transition: all 0.2s;

        &.is-active {
          font-weight: 600;
        }
      }
    }
  }
}
</style>

<!-- 表格全局样式（非scoped，影响所有表格） -->
<style lang="scss">
.table-header-cell {
  background-color: #fafafa !important;
  color: #606266 !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  padding: 8px 0 !important;
}

.operation-column {
  .cell {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }
}

.el-table {
  --el-table-border-color: #f0f0f0;
  --el-table-header-bg-color: #fafafa;
  --el-table-row-hover-bg-color: #f5f7fa;

  th.el-table__cell {
    user-select: none;
  }

  // 行悬停效果优化
  tr:hover > td.el-table__cell {
    transition: background-color 0.2s ease;
  }
}
</style>
