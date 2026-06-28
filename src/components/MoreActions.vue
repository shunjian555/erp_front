<template>
  <div class="more-actions">
    <template v-for="(item, idx) in visibleItems" :key="idx">
      <el-button
        v-if="!item.hidden"
        :type="item.type || 'primary'"
        :icon="item.icon"
        link
        size="small"
        :disabled="item.disabled"
        @click="item.onClick && item.onClick()"
      >
        {{ item.label }}
      </el-button>
    </template>
    <el-dropdown v-if="hiddenItems.length" trigger="click" @command="handleCommand">
      <el-button type="primary" link size="small">
        {{ t('common.moreActions') }}<el-icon class="el-icon--right"><ArrowDown /></el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="(item, idx) in hiddenItems"
            :key="idx"
            :command="idx"
            :disabled="item.disabled"
          >
            <el-icon v-if="item.icon" class="more-actions-icon"><component :is="item.icon" /></el-icon>
            {{ item.label }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  /**
   * 按钮列表
   * [{ label, type, icon, onClick, hidden, disabled, important? }]
   * - important: true 表示强制展示在前面（不计入3个限制）
   */
  items: { type: Array, default: () => [] },
  /**
   * 超过该数量则折叠到更多下拉（更多按钮本身也算1个）
   * 默认 2，即：2个按钮 + 更多 = 最多3个
   */
  max: { type: Number, default: 2 }
})

const importantItems = computed(() => props.items.filter((i) => i.important && !i.hidden))
const normalItems = computed(() => props.items.filter((i) => !i.important && !i.hidden))

// 剩余可展示的数量
const remain = computed(() => Math.max(0, props.max - importantItems.value.length))
const visibleNormal = computed(() => normalItems.value.slice(0, remain.value))
const hiddenItems = computed(() => normalItems.value.slice(remain.value))

const visibleItems = computed(() => [...importantItems.value, ...visibleNormal.value])

function handleCommand(idx) {
  const item = hiddenItems.value[idx]
  item?.onClick && item.onClick()
}
</script>

<style lang="scss" scoped>
.more-actions {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-wrap: nowrap;
  .more-actions-icon {
    margin-right: 4px;
    vertical-align: middle;
  }
}
</style>
