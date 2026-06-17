import { defineStore } from 'pinia'
import { ref } from 'vue'
import { generateId } from '@/utils'

export const useTagsViewStore = defineStore('tagsView', () => {
  const visitedViews = ref([])
  const cachedViews = ref([])

  // 添加视图
  function addView(view) {
    addVisitedView(view)
    addCachedView(view)
  }

  // 添加已访问视图
  function addVisitedView(view) {
    if (visitedViews.value.some((v) => v.path === view.path)) return
    visitedViews.value.push(Object.assign({}, view, {
      title: view.meta?.title || 'no-name',
      id: generateId()
    }))
  }

  // 添加缓存视图
  function addCachedView(view) {
    if (view.meta?.keepAlive && !cachedViews.value.includes(view.name)) {
      cachedViews.value.push(view.name)
    }
  }

  // 删除视图
  function delView(view) {
    delVisitedView(view)
    delCachedView(view)
  }

  // 删除已访问视图
  function delVisitedView(view) {
    const index = visitedViews.value.findIndex((v) => v.path === view.path)
    if (index > -1) {
      visitedViews.value.splice(index, 1)
    }
  }

  // 删除缓存视图
  function delCachedView(view) {
    const index = cachedViews.value.indexOf(view.name)
    if (index > -1) {
      cachedViews.value.splice(index, 1)
    }
  }

  // 关闭其他
  function delOthersViews(view) {
    visitedViews.value = visitedViews.value.filter((v) => v.path === view.path || v.meta?.affix)
    cachedViews.value = cachedViews.value.filter(
      (name) => name === view.name || view.meta?.affix
    )
  }

  // 关闭全部
  function delAllViews() {
    const affixTags = visitedViews.value.filter((tag) => tag.meta?.affix)
    visitedViews.value = affixTags
    cachedViews.value = affixTags.map((tag) => tag.name)
  }

  // 更新视图
  function updateVisitedView(view) {
    for (let v of visitedViews.value) {
      if (v.path === view.path) {
        Object.assign(v, view)
        break
      }
    }
  }

  return {
    visitedViews,
    cachedViews,
    addView,
    addVisitedView,
    addCachedView,
    delView,
    delVisitedView,
    delCachedView,
    delOthersViews,
    delAllViews,
    updateVisitedView
  }
})
