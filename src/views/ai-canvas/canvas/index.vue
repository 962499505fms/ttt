<template>
  <div class="canvas-page">
    <toolbar />
    <div class="canvas-content">
      <test-panel
        @message="handleWebSocketMessage"
        @load-snapshot="loadTestSnapshot"
        @clear="clearCanvas"
      />
      <div class="canvas-wrapper">
        <widget-canvas
          :widgetFactory="widgetFactory"
          :canvasManager="canvasManager"
          :conversationId="conversationId"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { CanvasManager, WidgetFactory, MessageDispatcher, A2UIDataHandler } from './core'
import HTTP from '@/service/apis'
import toolbar from './components/toolbar.vue'
import widgetCanvas from './components/widgetCanvas.vue'
import testPanel from './components/test.vue'

export default {
  name: "CanvasPage",
  components: {
    toolbar,
    widgetCanvas,
    testPanel
  },
  data() {
    return {
      canvasManager: null,
      widgetFactory: null,
      messageDispatcher: null,
      a2uiDataHandler: null,
      conversationId: null,
      loadingProgress: 0,
      isLoadingSnapshot: false,
      messageQueue: [],
      isProcessingQueue: false
    }
  },
  created() {
    this.initManagers()
  },
  methods: {
    initManagers() {
      // 1. 初始化 CanvasManager
      this.canvasManager = new CanvasManager({
        colNum: 12,
        minH: 7,
        fillMode: 'none'
      })
      
      // 2. 初始化 WidgetFactory
      this.widgetFactory = new WidgetFactory({
        minH: 7,
        widgetBaseUrl: '/widgets'
      })
      
      // 3. 初始化 A2UI 数据处理器
      this.a2uiDataHandler = new A2UIDataHandler()
      
      // 4. 初始化消息分发器
      this.messageDispatcher = new MessageDispatcher(
        this.a2uiDataHandler,
        this.widgetFactory,
        this.canvasManager
      )
    },
    
    /**
     * 设置会话ID
     * @param {string} conversationId - 会话ID
     */
    setConversationId(conversationId) {
      this.conversationId = conversationId
    },
    
    /**
     * 从快照加载数据
     * @param {string} conversationId - 会话ID
     * @returns {Promise<void>}
     */
    async loadFromSnapshot(conversationId) {
      if (this.isLoadingSnapshot) {
        console.warn('正在加载快照中，请稍后')
        return
      }
      
      try {
        this.isLoadingSnapshot = true
        this.loadingProgress = 0
        
        // 1. 获取快照数据
        const response = await HTTP.getCanvasSnapshot(conversationId)
        if (!response || !response.data) {
          console.warn('未获取到快照数据')
          return
        }
        
        // 2. CanvasManager 从快照加载
        this.canvasManager.loadFromSnapshots(response.data, (snapshot, position) => {
          // widgetId
          const widgetId = snapshot.propsSnap?.widgetId || 
                         snapshot.surfaceSnap?.updateComponents?.components?.[0]?.component
          
          if (!widgetId) return null
          
          const widget = this.widgetFactory.createWidgetConfig(
            snapshot.surfaceId,
            widgetId,
            snapshot.propsSnap,
            snapshot.surfaceIndex || 0,
            {
              conversationId: snapshot.conversationId,
              canvasId: snapshot.canvasId
            }
          )
          
          widget.x = position.x
          widget.y = position.y
          widget.surfaceGroup = snapshot.surfaceGroup
          widget.rendered = true
          
          // 设置快照数据
          widget.snap = {
            ...widget.snap,
            surfaceSnap: snapshot.surfaceSnap,
            surfaceGroup: snapshot.surfaceGroup
          }
          
          return widget
        })
        
        // 3. 设置会话ID
        this.conversationId = conversationId
        console.log('快照加载完成')
      } catch (error) {
        console.error('加载快照失败:', error)
      } finally {
        this.isLoadingSnapshot = false
      }
    },
    
    /**
     * 清空画布
     */
    clearCanvas() {
      this.canvasManager.clearAll()
      this.a2uiDataHandler.clearDataModels()
      this.loadingProgress = 0
    },
    
    /**
     * 处理 WebSocket 消息
     * @param {object} wsMessage - WebSocket 消息
     */
    handleWebSocketMessage(wsMessage) {
      this.messageQueue.push(wsMessage)
      this.processMessageQueue()
    },
    
    /**
     * 处理消息队列
     */
    async processMessageQueue() {
      if (this.isProcessingQueue) {
        return
      }
      
      this.isProcessingQueue = true
      
      try {
        while (this.messageQueue.length > 0) {
          const wsMessage = this.messageQueue.shift()
          await this.processWebSocketMessage(wsMessage)
        }
      } finally {
        this.isProcessingQueue = false
      }
    },
    
    /**
     * 处理单个 WebSocket 消息
     * @param {object} wsMessage - WebSocket 消息
     * @returns {Promise<void>}
     */
    async processWebSocketMessage(wsMessage) {
      if (wsMessage.type !== 'ui') {
        console.log('非UI消息:', wsMessage.type)
        return
      }
      
      const { conversationId, event } = wsMessage
      
      if (!event) {
        console.warn('WebSocket 消息缺少 event 字段')
        return
      }
      
      const { messageId, value, metadata } = event
      
      // preferredPlace 必须是 canvas
      if (metadata?.preferredPlace !== 'canvas') {
        console.log('preferredPlace 不是 canvas:', metadata?.preferredPlace)
        return
      }
      
      // 上下文信息
      const context = {
        conversationId: conversationId,
        canvasId: conversationId,
        surfaceGroup: metadata?.surfaceGroup || null,
        messageId: messageId
      }
      
      console.log('Canvas 处理消息:', { context, value })
      
      // A2UI 消息处理
      await this.messageDispatcher.handleMessage(value, { context })
    },
    
    /**
     * 加载测试快照
     * @param {string} conversationId - 会话ID
     * @param {Array} snapshotData - 快照数据
     * @returns {number} widget数量
     */
    loadTestSnapshot(conversationId, snapshotData) {
      this.clearCanvas()
      this.conversationId = conversationId
      
      // CanvasManager 从快照加载
      this.canvasManager.loadFromSnapshots(snapshotData, (snapshot, position) => {
        // widgetId
        const widgetId = snapshot.propsSnap?.widgetId || 
                       snapshot.surfaceSnap?.updateComponents?.components?.[0]?.component
        
        if (!widgetId) return null
        
        // 1. 初始化数据模型
        this.a2uiDataHandler.initDataModel(snapshot.surfaceId)
        
        // 2. 更新数据模型
        const updateDataModel = snapshot.surfaceSnap?.updateDataModel
        if (updateDataModel) {
          this.a2uiDataHandler.updateDataModel(
            snapshot.surfaceId,
            updateDataModel.path,
            updateDataModel.value
          )
        }
        
        const widget = this.widgetFactory.createWidgetConfig(
          snapshot.surfaceId,
          widgetId,
          snapshot.propsSnap,
          snapshot.surfaceIndex || 0,
          {
            conversationId: this.conversationId,
            canvasId: this.conversationId
          }
        )
        
        // 3. 解析组件配置
        const component = snapshot.surfaceSnap?.updateComponents?.components?.[0]
        if (component) {
          const { staticData, pathBindings } = this.a2uiDataHandler.parseComponentConfig(component)
          const resolvedData = this.a2uiDataHandler.resolvePathBindings(snapshot.surfaceId, pathBindings)
          
          // 4. 设置 widget 数据
          widget.data = { ...widget.data, ...staticData, ...resolvedData }
        }
        
        widget.x = position.x
        widget.y = position.y
        widget.surfaceGroup = snapshot.surfaceGroup
        widget.rendered = true
        
        // 设置快照数据
        widget.snap = {
          ...widget.snap,
          surfaceSnap: snapshot.surfaceSnap,
          surfaceGroup: snapshot.surfaceGroup
        }
        
        return widget
      })
      
      console.log('快照数据数量:', snapshotData.length, 'widget数量:', this.canvasManager.getWidgets().length)
      return snapshotData.length
    }
  }
}
</script>

<style lang="less" scoped>
.canvas-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7f9;
}

.canvas-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  .canvas-wrapper {
    flex: 1;
    padding: 0;
    overflow: hidden;
  }
}
</style>