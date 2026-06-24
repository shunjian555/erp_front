<template>
  <el-form
    ref="formRef"
    :model="formData"
    :rules="formRules"
    :label-width="labelWidth"
    :label-position="labelPosition"
    :disabled="disabled"
  >
    <el-row :gutter="gutter">
      <el-col
        v-for="(item, index) in formItems"
        :key="item.prop"
        :span="item.span || 24 / colCount"
      >
        <el-form-item :label="item.label" :prop="item.prop">
          <!-- 输入框 -->
          <el-input
            v-if="item.type === 'input' || !item.type"
            v-model="formData[item.prop]"
            :placeholder="item.placeholder || t('common.inputPlaceholder') + item.label"
            :maxlength="item.maxlength"
            :show-word-limit="!!item.maxlength"
            :disabled="item.disabled"
            clearable
          />
          <!-- 文本域 -->
          <el-input
            v-else-if="item.type === 'textarea'"
            v-model="formData[item.prop]"
            type="textarea"
            :placeholder="item.placeholder || t('common.inputPlaceholder') + item.label"
            :rows="item.rows || 3"
            :maxlength="item.maxlength"
            :show-word-limit="!!item.maxlength"
            :disabled="item.disabled"
          />
          <!-- 选择器 -->
          <el-select
            v-else-if="item.type === 'select'"
            v-model="formData[item.prop]"
            :placeholder="item.placeholder || t('common.selectPlaceholder') + item.label"
            :multiple="item.multiple"
            :disabled="item.disabled"
            :filterable="item.filterable !== false"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="opt in item.options || []"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
          <!-- 日期选择器 -->
          <el-date-picker
            v-else-if="item.type === 'date' || item.type === 'datetime'"
            v-model="formData[item.prop]"
            :type="item.type"
            :placeholder="item.placeholder || t('common.selectPlaceholder') + item.label"
            :format="item.format || (item.type === 'date' ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm:ss')"
            :value-format="item.valueFormat || (item.type === 'date' ? 'YYYY-MM-DD' : 'YYYY-MM-DD HH:mm:ss')"
            :disabled="item.disabled"
            style="width: 100%"
          />
          <!-- 单选 -->
          <el-radio-group
            v-else-if="item.type === 'radio'"
            v-model="formData[item.prop]"
            :disabled="item.disabled"
          >
            <el-radio
              v-for="opt in item.options || []"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </el-radio>
          </el-radio-group>
          <!-- 多选框 -->
          <el-checkbox-group
            v-else-if="item.type === 'checkbox'"
            v-model="formData[item.prop]"
            :disabled="item.disabled"
          >
            <el-checkbox
              v-for="opt in item.options || []"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </el-checkbox>
          </el-checkbox-group>
          <!-- 数字输入 -->
          <el-input-number
            v-else-if="item.type === 'number'"
            v-model="formData[item.prop]"
            :min="item.min"
            :max="item.max"
            :precision="item.precision"
            :disabled="item.disabled"
            controls-position="right"
            style="width: 100%"
          />
          <!-- 开关 -->
          <el-switch
            v-else-if="item.type === 'switch'"
            v-model="formData[item.prop]"
            :active-text="item.activeText"
            :inactive-text="item.inactiveText"
            :disabled="item.disabled"
          />
          <!-- 自定义插槽 -->
          <slot
            v-else-if="item.type === 'slot'"
            :name="item.prop"
            :form-data="formData"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  },
  formItems: {
    type: Array,
    required: true
  },
  formRules: {
    type: Object,
    default: () => ({})
  },
  labelWidth: {
    type: String,
    default: '100px'
  },
  labelPosition: {
    type: String,
    default: 'right'
  },
  colCount: {
    type: Number,
    default: 1
  },
  gutter: {
    type: Number,
    default: 16
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const formRef = ref(null)
const formData = ref({ ...props.modelValue })

// 同步外部数据
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      formData.value = { ...val }
    }
  },
  { deep: true }
)

// 向外同步数据
watch(formData, (val) => {
  emit('update:modelValue', val)
}, { deep: true })

onMounted(() => {
  formData.value = { ...props.modelValue }
})

// 表单验证
async function validate() {
  return formRef.value?.validate()
}

// 重置表单
function resetFields() {
  formRef.value?.resetFields()
  formData.value = {}
}

// 获取表单数据
function getFormData() {
  return formData.value
}

// 设置表单数据
function setFormData(data) {
  formData.value = { ...data }
}

defineExpose({
  validate,
  resetFields,
  getFormData,
  setFormData,
  formRef
})
</script>
