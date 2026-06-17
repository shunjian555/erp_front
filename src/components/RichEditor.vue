<template>
  <div class="rich-editor">
    <Toolbar :editor="editorRef" :defaultConfig="toolbarConfig" mode="default" />
    <Editor
      :defaultConfig="editorConfig"
      mode="default"
      :modelValue="modelValue"
      @onCreated="handleCreated"
      @onChange="handleChange"
    />
  </div>
</template>

<script setup>
import { ref, shallowRef, onBeforeUnmount } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import '@wangeditor/editor/dist/css/style.css'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '请输入内容...' }
})

const emit = defineEmits(['update:modelValue'])

const editorRef = shallowRef(null)
const toolbarConfig = {}
const editorConfig = ref({
  placeholder: props.placeholder,
  MENU_CONF: {}
})

// 编辑器创建完成
function handleCreated(editor) {
  editorRef.value = editor
}

// 内容变化
function handleChange(editor) {
  emit('update:modelValue', editor.getHtml())
}

// 组件销毁时，也及时销毁编辑器
onBeforeUnmount(() => {
  if (editorRef.value) {
    editorRef.value.destroy()
  }
})
</script>

<style lang="scss" scoped>
.rich-editor {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;

  &:focus-within {
    border-color: #409eff;
  }

  // toolbar 样式微调
  :deep(.w-e-toolbar) {
    border-bottom: 1px solid #dcdfe6;
  }

  // 编辑区域最小高度
  :deep(.w-e-text-container) {
    min-height: 300px;
  }
}
</style>