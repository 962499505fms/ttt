class MessageDispatcher {
  constructor(a2uiDataHandler, widgetFactory, canvasManager) {
    this.a2uiDataHandler = a2uiDataHandler;
    this.widgetFactory = widgetFactory;
    this.canvasManager = canvasManager;
    this.defaultBatchSize = 5;
    this.defaultBatchDelay = 100;
    this.pendingCreateSurface = new Map();
    this.currentContext = null;
  }

  async handleMessage(message, options = {}) {
    this.currentContext = options.context;
    
    try {
      if (Array.isArray(message)) {
        await this.handleMessageArray(message, options);
        return;
      }
      
      if (this.isBatchMessage(message)) {
        await this.handleBatchMessage(message);
      } else {
        await this.handleSingleMessage(message);
      }
    } finally {
      this.currentContext = null;
    }
  }

  async handleMessageArray(messages, options = {}) {
    if (!Array.isArray(messages) || messages.length === 0) {
      console.warn('Empty messages array');
      return;
    }
    
    const { 
      batchSize = this.defaultBatchSize, 
      batchDelay = this.defaultBatchDelay, 
      onProgress = null 
    } = options;
    
    const total = messages.length;
    let loaded = 0;
    
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      for (const msg of batch) {
        try {
          if (this.isBatchMessage(msg)) {
            await this.handleBatchMessage(msg);
          } else {
            await this.handleSingleMessage(msg);
          }
        } catch (error) {
          console.error('Error processing message:', error, msg);
        }
        
        loaded += batch.length;
        
        if (onProgress) {
          const percentage = Math.round((loaded / total) * 100);
          onProgress(loaded, total, percentage);
        }
        
        if (i + batchSize < messages.length && batchDelay > 0) {
          await this.delay(batchDelay);
        }
      }
    }
  }

  isBatchMessage(message) {
    const operationKeys = ['createSurface', 'updateComponents', 'updateDataModel', 'deleteSurface'];
    const presentKeys = operationKeys.filter(key => message[key] !== undefined);
    return presentKeys.length > 1;
  }

  async handleBatchMessage(message) {
    if (message.createSurface) {
      await this.processCreateSurface(message.createSurface);
    }
    
    if (message.updateComponents) {
      await this.processUpdateComponents(message.updateComponents);
    }
    
    if (message.updateDataModel) {
      await this.processUpdateDataModel(message.updateDataModel);
    }
    
    if (message.deleteSurface) {
      await this.processDeleteSurface(message.deleteSurface);
    }
  }

  async handleSingleMessage(message) {
    console.log('[MessageDispatcher] handleSingleMessage:', Object.keys(message));
    
    if (message.createSurface) {
      console.log('[MessageDispatcher] createSurface');
      await this.processCreateSurface(message.createSurface);
    } else if (message.updateComponents) {
      console.log('[MessageDispatcher] updateComponents');
      await this.processUpdateComponents(message.updateComponents);
    } else if (message.updateDataModel) {
      console.log('[MessageDispatcher] updateDataModel');
      await this.processUpdateDataModel(message.updateDataModel);
    } else if (message.deleteSurface) {
      console.log('[MessageDispatcher] deleteSurface');
      await this.processDeleteSurface(message.deleteSurface);
    } else {
      console.warn('[MessageDispatcher] Unknown message type:', message);
    }
  }

  async processCreateSurface(payload) {
    const { surfaceId } = payload;
    const context = this.currentContext;
    
    if (!surfaceId) {
      console.warn('createSurface: missing surfaceId');
      return;
    }
    
    this.a2uiDataHandler.initDataModel(surfaceId);
    
    this.pendingCreateSurface.set(surfaceId, {
      ...payload,
      surfaceGroup: context?.surfaceGroup || payload.surfaceGroup,
      conversationId: context?.conversationId,
      canvasId: context?.canvasId
    });
  }

  async processUpdateComponents(payload) {
    const { surfaceId, components } = payload;
    
    if (!surfaceId || !components) {
      console.warn('updateComponents: missing surfaceId or components');
      return;
    }
    
    for (const component of components) {
      const widgetId = component.component || component.id;
      
      if (!widgetId) {
        console.warn('updateComponents: missing widgetId');
        continue;
      }
      
      try {
        const widgetJsonConfig = await this.widgetFactory.loadWidget(widgetId);
        const createSurfacePayload = this.pendingCreateSurface.get(surfaceId);
        const groupName = createSurfacePayload?.surfaceGroup;
        const surfaceIndex = this.canvasManager.getNextSurfaceIndex();
        
        const context = {
          conversationId: createSurfacePayload?.conversationId,
          canvasId: createSurfacePayload?.canvasId
        };
        
        const widget = this.widgetFactory.createWidgetConfig(
          surfaceId,
          widgetId,
          widgetJsonConfig,
          surfaceIndex,
          context
        );
        
        const position = this.canvasManager.calculatePosition(
          { w: widget.w, h: widget.h },
          groupName
        );
        
        widget.x = position.x;
        widget.y = position.y;
        widget.component = component.component || widgetId;
        
        if (groupName) {
          widget.surfaceGroup = groupName;
          if (widget.snap) {
            widget.snap.surfaceGroup = groupName;
            this.canvasManager.addWidgetToGroup(widget);
          }
        }
        
        this.canvasManager.addWidget(widget);
        
        const { staticData, pathBindings } = this.a2uiDataHandler.parseComponentConfig(component);
        widget._pendingStaticData = staticData;
        widget._pathBindings = pathBindings;
        
        if (this.pendingCreateSurface.has(surfaceId)) {
          widget.snap.surfaceSnap = {
            createSurface: { ...createSurfacePayload }
          };
          this.pendingCreateSurface.delete(surfaceId);
        }
        
        widget.snap.surfaceSnap.updateComponents = { ...payload };
      } catch (error) {
        console.error(`Widget ${widgetId} error:`, error);
      }
    }
  }

  async processUpdateDataModel(payload) {
    const { surfaceId, path, value } = payload;
    
    console.log('[MessageDispatcher] updateDataModel:', surfaceId);
    
    if (!surfaceId) {
      console.warn('updateDataModel: missing surfaceId');
      return;
    }
    
    if (!path) {
      console.warn('updateDataModel: missing path');
      return;
    }
    
    if (value === undefined) {
      console.warn('updateDataModel: missing value');
      return;
    }
    
    this.a2uiDataHandler.updateDataModel(surfaceId, path, value);
    
    const widget = this.canvasManager.getWidget(surfaceId);
    console.log('[MessageDispatcher] widget:', widget, 'surfaceId:', surfaceId);
    
    if (widget) {
      widget.snap.surfaceSnap.updateDataModel = { path, value };
      
      const dataModel = this.a2uiDataHandler.getDataModel(surfaceId);
      const rootData = dataModel?.['/'] || {};
      let sizeChanged = false;
      
      if (rootData.w !== undefined && typeof rootData.w === 'number') {
        widget.w = rootData.w;
        sizeChanged = true;
      }
      
      if (rootData.h !== undefined && typeof rootData.h === 'number') {
        widget.h = rootData.h;
        sizeChanged = true;
      }
      
      if (sizeChanged) {
        console.log('[MessageDispatcher] Widget size changed:', { 
          surfaceId, 
          w: widget.w, 
          h: widget.h 
        });
      }
      
      const pendingStaticData = widget._pendingStaticData || {};
      const pathBindings = widget._pathBindings || [];
      const resolvedData = this.a2uiDataHandler.resolvePathBindings(surfaceId, pathBindings);
      const mergedData = { ...pendingStaticData, ...resolvedData };
      
      if (Object.keys(mergedData).length > 0) {
        widget.data = { ...widget.data, ...mergedData };
      }
      
      widget._pendingStaticData = {};
      
      if (!widget.rendered) {
        widget.rendered = true;
      }
      
      this.canvasManager.emit('widget:should-render', surfaceId);
    }
  }

  async processDeleteSurface(payload) {
    const { surfaceId } = payload;
    
    if (!surfaceId) {
      console.warn('deleteSurface: missing surfaceId');
      return;
    }
    
    this.canvasManager.removeWidget(surfaceId);
    this.a2uiDataHandler.removeDataModel(surfaceId);
    this.pendingCreateSurface.delete(surfaceId);
  }

  setBatchSize(batchSize) {
    this.defaultBatchSize = batchSize;
  }

  setBatchDelay(batchDelay) {
    this.defaultBatchDelay = batchDelay;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  clearPendingState() {
    this.pendingCreateSurface.clear();
    this.currentContext = null;
  }

  clearDataModels() {
    this.a2uiDataHandler.clearDataModels();
    this.clearPendingState();
  }
}

export default MessageDispatcher;