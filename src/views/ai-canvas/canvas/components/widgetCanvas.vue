<template>
  <div class="canvas-container">
    <div v-if="layout.length === 0" class="empty-state">
      <div class="empty-icon"></div>
      <h3>Widget</h3>
      <p>A2U</p>
    </div>
    <div v-else class="canvas-content">
      <timeline-overlay
        :rows="groupHeaders"
        :row-height="rowHeight"
        :margin="margin"
        :timeline-padding="timelinePadding"
        @toggle-row="onGroupToggle"
      />
      <grid-layout
        :layout="layout"
        :col-num="colNum"
        :row-height="rowHeight"
        :is-draggable="draggable"
        :is-resizable="resizable"
        :margin="margin"
        :vertical-compact="true"
        :use-css-transforms="true"
        :tool-mode="toolMode"
        @layout-updated="onLayoutUpdated"
      >
        <template v-for="item in layout">
          <!-- Group -->
          <grid-item
            v-if="item.type === 'group'"
            :key="item.i"
            :x="item.x"
            :y="item.y"
            :w="item.w"
            :h="item.h"
            :i="item.i"
            :is-draggable="false"
            :is-resizable="false"
            :tool-mode="toolMode"
            class="group-header-item"
            :class="{ 'is-collapsed': item.collapsed }"
          >
            <group-header
              :group-name="item.title"
              :collapsed="item.collapsed"
              :is-draggable="false"
              :widget-count="item.panelCount"
              @toggle="handleGroupToggle(item.i)"
              @rename="handleGroupRename(item.i, $event)"
              @delete="handleGroupDelete(item.i)"
            />
          </grid-item>

          <!-- Widget -->
          <grid-item
            v-else
            v-show="item.rendered"
            :key="item.surfaceId"
            :x="item.x"
            :y="item.y"
            :w="item.w || 4"
            :h="item.h || 7"
            :i="item.surfaceId"
            :is-resizable="item.resizable"
            :is-draggable="item.draggable !== false"
            :tool-mode="toolMode"
            :default-title="item?.data?.title"
            @resize="resizeEvent"
            @resized="resizedEvent"
            @moved="onWidgetMoved"
          >
            <template v-slot:header>
              <p-tooltip v-if="item?.titleTip" class="other-title" :content="item?.titleTip">
                <p-icon type="pui-help"></p-icon>
              </p-tooltip>
            </template>
            <widget-render
              :widget-id="item.widgetId"
              :surface-id="item.surfaceId"
              :data="item.data"
              :config="item.snap.propsSnap"
              :resize="resize"
              :lang="language"
              :theme="themeId"
              :animation-type="animationType"
            />
          </grid-item>
        </template>
      </grid-layout>
    </div>
  </div>
</template>

<script>
import { GridItem, GridLayout } from '@/components/vue-grid-layout/index'
import GroupHeader from './GroupHeader.vue'
import TimelineOverlay from './TimelineOverlay.vue'

export default {
  name: 'GridCanvas',
  components: {
    GridItem,
    GridLayout,
    GroupHeader,
    TimelineOverlay,
    widgetRender: () => import('./widgetRender.vue')
  },
  props: {
    /** Widget工厂 */
    widgetFactory: {
      type: Object,
      default: null
    },
    /** 画布管理器 */
    canvasManager: {
      type: Object,
      default: null
    },
    /** 对话ID */
    conversationId: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      layout: [],
      draggable: true,
      resizable: true,
      toolMode: 'none',
      minW: 2,
      colNum: 12,
      rowHeight: 30,
      resize: true,
      animationType: 'scale-up',
      margin: [8, 8],
      timelinePadding: 20
    }
  },
  computed: {
    language() {
      return localStorage.getItem('language') || 'zh-CN'
    },
    themeId() {
      return localStorage.getItem('themeId') || 'light'
    },
    /** 组头信息 */
    groupHeaders() {
      return this.layout.filter(item => item.type === 'group')
    }
  },
  watch: {
    canvasManager: {
      handler(newVal) {
        if (newVal) {
          this.initManagers()
        }
      },
      immediate: true
    }
  },
  mounted() {
    window.colNum = this.colNum
    window.minW = this.minW
    this.initRowH()
    window.addEventListener('resize', () => {
      this.resizeWin(true)
    })
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.resizeWin)
    this.cleanupManagers()
  },
  methods: {
    initManagers() {
      if (!this.canvasManager) return
      // CanvasManager 事件监听
      this.canvasManager.on('widget:added', this.onWidgetAdded)
      this.canvasManager.on('widget:updated', this.onWidgetUpdated)
      this.canvasManager.on('widget:removed', this.onWidgetRemoved)
      this.canvasManager.on('widgets:cleared', this.onWidgetsCleared)
      this.canvasManager.on('widget:should-render', this.onWidgetShouldRender)
      this.canvasManager.on('group:collapsed', this.onGroupCollapseChanged)
      this.canvasManager.on('group:expanded', this.onGroupCollapseChanged)
      this.canvasManager.on('group:created', this.onGroupCreated)
      this.canvasManager.on('group:deleted', this.onGroupDeleted)
      this.updateLayout()
    },
    cleanupManagers() {
      if (this.canvasManager) {
        this.canvasManager.off('widget:added', this.onWidgetAdded)
        this.canvasManager.off('widget:updated', this.onWidgetUpdated)
        this.canvasManager.off('widget:removed', this.onWidgetRemoved)
        this.canvasManager.off('widgets:cleared', this.onWidgetsCleared)
        this.canvasManager.off('widget:should-render', this.onWidgetShouldRender)
        this.canvasManager.off('group:collapsed', this.onGroupCollapseChanged)
        this.canvasManager.off('group:expanded', this.onGroupCollapseChanged)
        this.canvasManager.off('group:created', this.onGroupCreated)
        this.canvasManager.off('group:deleted', this.onGroupDeleted)
      }
    },
    /** 更新布局，根据CanvasManager的数据 */
    updateLayout() {
      if (!this.canvasManager) return
      // 判断是否有分组
      const hasGroups = this.canvasManager.getGroups().length > 0
      if (hasGroups) {
        // 有分组，使用分组布局
        this.updateGroupLayout()
      } else {
        const widgets = this.canvasManager.getWidgets()
        this.updateSimpleLayout(widgets)
      }
    },
    /** 更新分组布局，包含组和面板 */
    updateGroupLayout() {
      const layout = this.canvasManager.generateLayout()
      this.layout = layout.map(item => {
        if (item.type === 'panel') {
          return {
            ...item,
            type: 'panel',
            data: { ...item.data },
            snap: {
              ...item.snap,
              propsSnap: { ...item.snap.propsSnap }
            },
            resizable: item.snap?.propsSnap?.resizable !== false
          }
        }
        return item
      })
    },
    /** 更新简单布局，仅小部件 */
    updateSimpleLayout(widgets) {
      const sortedWidgets = [...widgets].sort((a, b) => {
        if (a.y !== b.y) return a.y - b.y
        return a.x - b.x
      })
      this.layout = sortedWidgets.map(widget => ({
        ...widget,
        type: 'widget',
        data: { ...widget.data },
        snap: {
          ...widget.snap,
          propsSnap: { ...widget.snap.propsSnap }
        },
        resizable: widget.snap.propsSnap?.resizable !== false
      }))
    },
    /** TimelineOverlay 触发的分组切换 */
    onGroupToggle(groupId) {
      if (!this.canvasManager) return
      this.canvasManager.toggleGroup(groupId)
      this.updateLayout()
    },
    /** GroupHeader 触发的分组切换 */
    handleGroupToggle(groupId) {
      if (!this.canvasManager) return
      this.canvasManager.toggleGroup(groupId)
      this.updateLayout()
    },
    /** GroupHeader 触发的重命名
     * @param {string} groupId - 分组ID
     * @param {object} event - {oldName, newName}
     */
    handleGroupRename(groupId, event) {
      if (!this.canvasManager) return
      const success = this.canvasManager.renameGroup(groupId, event.newName)
      if (success) {
        console.log(`Group renamed ${groupId} -> group-${event.newName}`)
        this.updateLayout()
      }
    },
    /** GroupHeader 触发的删除 */
    handleGroupDelete(groupId) {
      if (!this.canvasManager) return
      const success = this.canvasManager.deleteGroup(groupId)
      if (success) {
        console.log(`Group deleted ${groupId}`)
        this.updateLayout()
      }
    },
    /** 分组折叠状态改变 */
    onGroupCollapseChanged({ groupId }) {
      console.log(`Group ${groupId} collapse state changed`)
      this.updateLayout()
    },
    /** 分组创建 */
    onGroupCreated(group) {
      console.log(`Group created: ${group.surfaceId}`)
      this.updateLayout()
    },
    /** 分组删除 */
    onGroupDeleted({ groupId }) {
      console.log(`Group deleted ${groupId}`)
      this.updateLayout()
    },
    /** 小部件移动事件，用于处理分组逻辑 */
    onWidgetMoved(i, newX, newY) {
      const widget = this.canvasManager.getWidget(i)
      if (!widget) return
      console.log('[onWidgetMoved] Widget', {
        surfaceId: i,
        oldPosition: { x: widget.x, y: widget.y },
        newPosition: { x: newX, y: newY }
      })
      widget.x = newX
      widget.y = newY
      // 计算新的分组
      const targetGroup = this.canvasManager.getGroupForPanel(newY)
      const newGroupName = targetGroup ? targetGroup.title : null
      const oldGroupName = widget.surfaceGroup
      console.log('[onWidgetMoved] Group', {
        targetGroupName: newGroupName,
        oldGroupName: oldGroupName,
        groupChanged: newGroupName !== oldGroupName
      })
      // 更新分组
      if (newGroupName !== oldGroupName) {
        widget.surfaceGroup = newGroupName
        if (widget.snap) {
          widget.snap.surfaceGroup = newGroupName
        }
      }
      this.saveSnapshot()
      console.log('[onWidgetMoved]', {
        surfaceId: i,
        position: { x: widget.x, y: widget.y },
        surfaceGroup: widget.surfaceGroup
      })
    },
    /** 保存快照 */
    async saveSnapshot() {
      if (!this.canvasManager || !this.conversationId) {
        console.warn('saveSnapshot: canvasManager or conversationId missing')
        return
      }
      try {
        await this.canvasManager.saveSnapshot(this.conversationId)
        console.log('Snapshot saved')
      } catch (error) {
        console.error(error)
      }
    },
    onWidgetAdded(widget) {
      console.log('Widget added', widget.surfaceId)
      this.updateLayout()
    },
    onWidgetUpdated(widget) {
      console.log('Widget updated', widget.surfaceId)
      this.updateLayout()
    },
    onWidgetShouldRender({ surfaceId }) {
      console.log('Widget should render', surfaceId)
      this.updateLayout()
    },
    onWidgetRemoved(widget) {
      console.log('Widget removed', widget.surfaceId)
      this.updateLayout()
    },
    onWidgetsCleared() {
      console.log('All widgets cleared')
      this.layout = []
    },
    onLayoutUpdated(newLayout) {
      newLayout.forEach(item => {
        if (item.type === 'group') return
        const widget = this.canvasManager.getWidget(item.i)
        if (widget) {
          widget.x = item.x
          widget.y = item.y
          widget.w = item.w
          widget.h = item.h
        }
      })
    },
    resizeWin(isWin = false) {
      if (isWin) {
        this.initRowH()
      }
      setTimeout(() => {
        this.resize = !this.resize
      }, 1)
    },
    initRowH() {
      let autoWidth = this.colNum || 12
      const container = document.querySelector('.canvas-container')
      if (!container) return
      let rowHeight = Math.floor(container.clientWidth / autoWidth * this.minW * 0.618 * 2)
      this.rowHeight = Math.floor(rowHeight / 9)
    },
    resizeEvent(i, newH, newW, newHPx, newWPx) {
      console.log('RESIZE', {
        i,
        newH,
        newW,
        newHPx,
        newWPx
      })
      this.resizeWin()
    },
    resizedEvent(i, newH, newW, newHPx, newWPx) {
      console.log('RESIZE_END', {
        i,
        newH,
        newW,
        newHPx,
        newWPx
      })
      this.resizeWin()
      this.saveSnapshot()
    }
  }
}
</script>

<style lang="less">
@import '../styles/widget-animations.css';
@import '../styles/group-timeline.less';
</style>

<style lang="less" scoped>
.canvas-container {
  height: 100%;
  background: #f8f9fa;
  overflow: auto;
}

.canvas-content {
  position: relative;
  height: 100%;
  padding-left: 20px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6c757d;

  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
    opacity: 0.6;
  }

  h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 14px;
    opacity: 0.8;
  }
}

.vue-grid-layout {
  height: 100%;
  position: relative;
}

.vue-grid-item {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  border: 1px solid #e8e8e8;
}

/* Group */
.group-header-item {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
  overflow: visible !important;

  &.is-collapsed {
    /* collapsed styles */
  }
}

.widget-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.widget-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;

  h4 {
    margin: 0 0 4px 0;
    font-size: 16px;
    font-weight: 600;
  }

  .widget-id {
    font-size: 12px;
    opacity: 0.8;
    font-family: monospace;
  }
}

.widget-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.data-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.data-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #007bff;
}

.data-label {
  font-weight: 600;
  color: #495057;
  min-width: 100px;
  font-size: 13px;
}

.data-value {
  flex: 1;
  color: #6c757d;
  font-size: 13px;
  line-height: 1.4;
}

.no-data {
  color: #adb5bd;
  font-style: italic;
  text-align: center;
  padding: 20px;
}
</style>