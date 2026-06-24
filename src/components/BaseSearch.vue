<template>
  <div class="base-search" :class="{ collapsed: isCollapsed }">
    <el-form :model="searchForm" inline label-width="auto">
      <el-row :gutter="16">
        <el-col
          v-for="(item, index) in visibleItems"
          :key="item.prop"
          :span="item.span || 6"
        >
          <el-form-item :label="item.label">
            <el-input
              v-if="item.type === 'input' || !item.type"
              v-model="searchForm[item.prop]"
              :placeholder="t('common.inputPlaceholder') + item.label"
              clearable
              :prefix-icon="getInputIcon(item)"
              @keyup.enter="handleSearch"
            />
            <el-select
              v-else-if="item.type === 'select'"
              v-model="searchForm[item.prop]"
              :placeholder="t('common.selectPlaceholder') + item.label"
              clearable
              filterable
              style="width: 100%"
            >
              <el-option
                v-for="opt in item.options || []"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
            <el-date-picker
              v-else-if="item.type === 'date'"
              v-model="searchForm[item.prop]"
              type="date"
              :placeholder="t('common.selectPlaceholder') + item.label"
              :value-format="item.valueFormat || 'YYYY-MM-DD'"
              style="width: 100%"
            />
            <el-date-picker
              v-else-if="item.type === 'daterange'"
              v-model="searchForm[item.prop]"
              type="daterange"
              :range-separator="t('common.to')"
              :start-placeholder="t('common.startDate')"
              :end-placeholder="t('common.endDate')"
              :value-format="item.valueFormat || 'YYYY-MM-DD'"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>

        <!-- 操作按钮 -->
        <el-col :span="btnSpan">
          <el-form-item class="search-actions">
            <el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.search') }}</el-button>
            <el-button :icon="RefreshLeft" @click="handleReset">{{ t('common.reset') }}</el-button>
            <el-button
              v-if="needCollapse"
              text
              type="primary"
              @click="toggleCollapse"
              class="collapse-btn"
            >
              {{ isCollapsed ? t('common.expand') : t('common.collapse') }}
              <el-icon class="collapse-icon"><ArrowUp v-if="!isCollapsed" /><ArrowDown v-else /></el-icon>
            </el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, RefreshLeft, ArrowUp, ArrowDown } from '@element-plus/icons-vue'

const { t } = useI18n()

const props = defineProps({
  searchItems: {
    type: Array,
    required: true
  },
  defaultCollapsed: {
    type: Boolean,
    default: false
  },
  collapseRows: {
    type: Number,
    default: 2
  }
})

const emit = defineEmits(['search', 'reset'])

const isCollapsed = ref(props.defaultCollapsed)

// 初始化表单数据
const searchForm = reactive({})
props.searchItems.forEach((item) => {
  searchForm[item.prop] = item.defaultValue ?? ''
})

// 可见的搜索项
const visibleItems = computed(() => {
  if (!isCollapsed.value) return props.searchItems
  const count = props.collapseRows * 4
  return props.searchItems.slice(0, count)
})

// 是否需要折叠按钮
const needCollapse = computed(() => props.searchItems.length > props.collapseRows * 4)

// 按钮占位宽度
const btnSpan = computed(() => {
  if (isCollapsed.value && needCollapse.value) {
    const remainder = visibleItems.value.length % 4
    return (4 - remainder) * 6 || 24
  }
  return 6
})

// 获取输入框图标
function getInputIcon(item) {
  // 根据字段名返回对应图标（可选优化）
  return undefined
}

function handleSearch() {
  emit('search', { ...searchForm })
}

function handleReset() {
  props.searchItems.forEach((item) => {
    searchForm[item.prop] = item.defaultValue ?? ''
  })
  emit('reset')
}

function toggleCollapse() {
  isCollapsed.value = !isCollapsed.value
}

function getSearchForm() {
  return { ...searchForm }
}

defineExpose({ getSearchForm })
</script>

<style lang="scss" scoped>
.base-search {
  background: #fff;
  padding: 18px 18px 2px;
  border-radius: var(--border-radius-base);
  margin-bottom: 16px;
  box-shadow: var(--box-shadow-lighter);
  transition: all 0.25s ease;

  &.collapsed {
    padding-bottom: 14px;
  }

  :deep(.el-form-item) {
    margin-bottom: 16px;
    width: 100%;

    .el-form-item__label {
      color: var(--text-secondary);
      font-size: 13px;
      padding-right: 8px;
      white-space: nowrap;
      font-weight: 400;
    }
  }

  .search-actions {
    display: flex;
    align-items: center;
    gap: 10px;

    .collapse-btn {
      font-size: 13px;
      padding-left: 4px;
      padding-right: 4px;

      .collapse-icon {
        transition: transform 0.25s ease;
        margin-left: 2px;
      }
    }
  }

  // 输入框统一样式
  :deep(.el-input__wrapper),
  :deep(.el-select .el-input__wrapper),
  :deep(.el-date-editor .el-input__wrapper) {
    border-radius: 8px;
    box-shadow: 0 0 0 1px #dcdfe6 inset;
    transition: all 0.25s ease;

    &:hover {
      box-shadow: 0 0 0 1px var(--primary-color-light-5) inset;
    }

    &.is-focus {
      box-shadow: 0 0 0 1px var(--primary-color) inset !important;
    }
  }

  // 按钮样式
  :deep(.el-button) {
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.25s ease;
  }
}
</style>
