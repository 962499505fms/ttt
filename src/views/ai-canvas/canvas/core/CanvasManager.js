import HTTP from '@/service/apis'

class CanvasManager {
  constructor(options = {}) {
    this.colNum = options.colNum || 12
    this.minH = options.minH || 7
    this.fillMode = options.fillMode || 'none'
    this.widgets = new Map()
    this.collapsedPanels = new Map()
    this.eventListeners = new Map()
  }

  addWidget(widget) {
    if (!widget.surfaceId) {
      console.warn('addWidget: missing surfaceId')
      return null
    }
    this.widgets.set(widget.surfaceId, widget)
    this.emit('widget:added', widget)
    return widget
  }

  getWidget(surfaceId) {
    return this.widgets.get(surfaceId) || null
  }

  getWidgets() {
    return Array.from(this.widgets.values()).filter(w => !w.isGroup)
  }

  getGroups() {
    return Array.from(this.widgets.values()).filter(w => w.isGroup)
  }

  getAllItems() {
    return Array.from(this.widgets.values())
  }

  updateWidget(surfaceId, updates) {
    const widget = this.widgets.get(surfaceId)
    if (!widget) {
      console.warn(`updateWidget: Widget ${surfaceId} not found`)
      return null
    }
    Object.assign(widget, updates)
    this.emit('widget:updated', widget)
    return widget
  }

  removeWidget(surfaceId) {
    const widget = this.widgets.get(surfaceId)
    if (!widget) {
      return false
    }
    this.widgets.delete(surfaceId)
    this.emit('widget:removed', widget)
    return true
  }

  clearAll() {
    this.widgets.clear()
    this.emit('widgets:cleared')
  }

  getNextSurfaceIndex() {
    const widgets = this.getWidgets()
    if (widgets.length === 0) return 0
    return Math.max(...widgets.map(w => w.snap?.surfaceIndex ?? -1)) + 1
  }

  calculatePosition(newWidget, groupName = null) {
    const { w, h } = newWidget
    const existingWidgets = this.getAllItems()
    
    if (groupName) {
      return this.calculatePositionInGroup(existingWidgets, w, h, groupName)
    }
    
    switch (this.fillMode) {
      case 'none':
        return this.calculateNoFill(existingWidgets, w, h)
      case 'row-first':
        return this.calculateRowFirst(existingWidgets, w, h)
      case 'col-first':
        return this.calculateColFirst(existingWidgets, w, h)
      default:
        return this.calculateNoFill(existingWidgets, w, h)
    }
  }

  calculatePositionInGroup(widgets, w, h, groupName) {
    const groupId = `group-${groupName}`
    const group = this.getWidget(groupId)
    
    if (!group) {
      const maxY = this.getMaxY(widgets)
      return {
        x: 0,
        y: maxY + 2
      }
    }
    
    const groupWidgets = widgets.filter(w => !w.isGroup && w.surfaceGroup === groupName)
    const groupStartY = group.y + 1
    const nextGroup = this.getNextGroup(group)
    const groupEndY = nextGroup ? nextGroup.y : Infinity
    
    return this.findPositionInRange(groupWidgets, w, h, groupStartY, groupEndY)
  }

  getNextGroup(currentGroup) {
    const groups = this.getGroups()
    let nextGroup = null
    let minY = Infinity
    
    for (const group of groups) {
      if (group.y > currentGroup.y && group.y < minY) {
        nextGroup = group
        minY = group.y
      }
    }
    return nextGroup
  }

  findPositionInRange(widgets, w, h, startY, endY) {
    let y = startY
    const maxRows = 1000
    
    while (y < Math.min(endY, maxRows)) {
      for (let x = 0; x <= this.colNum - w; x++) {
        if (this.isPositionAvailable(widgets, x, y, w, h)) {
          return { x, y }
        }
      }
      y++
    }
    return { x: 0, y: startY }
  }

  getMaxY(widgets) {
    if (widgets.length === 0) return 0
    return Math.max(...widgets.map(w => w.y + (w.h || 1)))
  }

  calculateNoFill(widgets, w, h) {
    let x = 0, y = 0
    const maxRows = 1000
    
    while (y < maxRows) {
      for (x = 0; x <= this.colNum - w; x++) {
        if (this.isPositionAvailable(widgets, x, y, w, h)) {
          return { x, y }
        }
      }
      y++
    }
    return { x: 0, y: 0 }
  }

  calculateRowFirst(widgets, w, h) {
    const rowFillResult = this.tryFillInRow(widgets, w, h)
    if (rowFillResult) return rowFillResult
    
    const colFillResult = this.tryFillInColumn(widgets, w, h)
    if (colFillResult) return colFillResult
    
    return this.calculateNoFill(widgets, w, h)
  }

  calculateColFirst(widgets, w, h) {
    const colFillResult = this.tryFillInColumn(widgets, w, h)
    if (colFillResult) return colFillResult
    
    const rowFillResult = this.tryFillInRow(widgets, w, h)
    if (rowFillResult) return rowFillResult
    
    return this.calculateNoFill(widgets, w, h)
  }

  tryFillInRow(widgets, w, h) {
    for (const widget of widgets) {
      const { x, y, w: ww } = widget
      if (x + ww + w <= this.colNum) {
        const newX = x + ww
        if (this.isPositionAvailable(widgets, newX, y, w, h)) {
          return { x: newX, y }
        }
      }
    }
    return null
  }

  tryFillInColumn(widgets, w, h) {
    for (const widget of widgets) {
      const { x, y, h: wh } = widget
      const newY = y + wh
      if (this.isPositionAvailable(widgets, x, newY, w, h)) {
        return { x, y: newY }
      }
    }
    return null
  }

  isPositionAvailable(widgets, x, y, w, h) {
    for (const widget of widgets) {
      const { x: wx, y: wy, w: ww, h: wh } = widget
      if (x < wx + ww && x + w > wx && y < wy + wh && y + h > wy) {
        return false
      }
    }
    return true
  }

  recalculateLayout() {
    const widgets = this.getWidgets()
    const result = []
    const sortedWidgets = [...widgets].sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y
      return a.x - b.x
    })
    
    for (const widget of sortedWidgets) {
      const position = this.calculatePosition(widget, widget.surfaceGroup)
      result.push({ ...widget, ...position })
    }
    return result
  }

  createGroup(title, y = 0) {
    const groupId = `group-${title}`
    const existing = this.getWidget(groupId)
    
    if (existing) {
      console.warn(`Group "${title}" already exists`)
      return existing
    }
    
    const group = {
      surfaceId: groupId,
      isGroup: true,
      title: title,
      i: groupId,
      x: 0,
      y: y,
      w: 12,
      h: 1,
      collapsed: false
    }
    
    this.addWidget(group)
    this.emit('group:created', group)
    return group
  }

  deleteGroup(groupId) {
    const group = this.getGroup(groupId)
    if (!group) return false
    
    if (group.collapsed) {
      this.expandGroup(groupId)
    }
    
    const panels = this.getPanelsInGroup(groupId)
    panels.forEach(panel => {
      panel.surfaceGroup = null
      if (panel.snap) {
        panel.snap.surfaceGroup = null
      }
    })
    
    this.removeWidget(groupId)
    this.collapsedPanels.delete(groupId)
    this.emit('group:deleted', { groupId, panels })
    return true
  }

  renameGroup(groupId, newTitle) {
    const group = this.getGroup(groupId)
    if (!group) return false
    
    const newGroupId = `group-${newTitle}`
    if (this.getWidget(newGroupId) && newGroupId !== groupId) {
      console.warn(`Group "${newTitle}" already exists`)
      return false
    }
    
    const oldTitle = group.title
    group.title = newTitle
    group.surfaceId = newGroupId
    group.i = newGroupId
    
    this.removeWidget(groupId)
    this.addWidget(group)
    
    const panels = this.getPanelsInGroup(newGroupId)
    panels.forEach(panel => {
      panel.surfaceGroup = newTitle
      if (panel.snap) {
        panel.snap.surfaceGroup = newTitle
      }
    })
    
    if (this.collapsedPanels.has(groupId)) {
      const data = this.collapsedPanels.get(groupId)
      this.collapsedPanels.delete(groupId)
      this.collapsedPanels.set(newGroupId, data)
    }
    
    this.emit('group:renamed', {
      oldGroupId: groupId,
      newGroupId,
      oldTitle,
      newTitle
    })
    return true
  }

  collapseGroup(groupId) {
    const group = this.getGroup(groupId)
    if (!group || group.collapsed) return
    
    const panels = this.getPanelsInGroup(groupId)
    this.collapsedPanels.set(groupId, panels.map(panel => ({
      surfaceId: panel.surfaceId,
      x: panel.x,
      y: panel.y,
      w: panel.w,
      h: panel.h
    })))
    
    group.collapsed = true
    this.emit('group:collapsed', { groupId, panelCount: panels.length })
  }

  expandGroup(groupId) {
    const group = this.getGroup(groupId)
    if (!group || !group.collapsed) return
    
    const savedPanels = this.collapsedPanels.get(groupId) || []
    savedPanels.forEach(savedPanel => {
      const panel = this.getWidget(savedPanel.surfaceId)
      if (panel) {
        panel.x = savedPanel.x
        panel.y = savedPanel.y
      }
    })
    
    this.collapsedPanels.delete(groupId)
    group.collapsed = false
    this.emit('group:expanded', groupId)
  }

  toggleGroup(groupId) {
    const group = this.getGroup(groupId)
    if (!group) return false
    
    if (group.collapsed) {
      this.expandGroup(groupId)
      return true
    } else {
      this.collapseGroup(groupId)
      return false
    }
  }

  isCollapsed(groupId) {
    const group = this.getGroup(groupId)
    return group ? group.collapsed : false
  }

  getGroupForPanel(panelY) {
    const groups = this.getGroups()
    let nearestGroup = null
    let nearestY = -1
    
    for (const group of groups) {
      if (group.y < panelY && group.y > nearestY) {
        nearestGroup = group
        nearestY = group.y
      }
    }
    return nearestGroup
  }

  getPanelsInGroup(groupId) {
    const group = this.getGroup(groupId)
    if (!group) return []
    
    const nextGroup = this.getNextGroup(group)
    const maxY = nextGroup ? nextGroup.y : Infinity
    
    return this.getWidgets().filter(widget => {
      return widget.y > group.y && widget.y < maxY
    })
  }

  getGroup(groupId) {
    const widget = this.getWidget(groupId)
    return widget && widget.isGroup ? widget : null
  }

  getGroupByTitle(title) {
    return this.getGroup(`group-${title}`)
  }

  getSortedGroups() {
    return this.getGroups().sort((a, b) => a.y - b.y)
  }

  getUngroupedPanels() {
    const allWidgets = this.getWidgets()
    const sortedGroups = this.getSortedGroups()
    
    return allWidgets.filter(widget => {
      for (let i = 0; i < sortedGroups.length; i++) {
        const group = sortedGroups[i]
        const nextGroup = sortedGroups[i + 1]
        const maxY = nextGroup ? nextGroup.y : Infinity
        
        if (widget.y > group.y && widget.y < maxY) {
          return false
        }
      }
      return true
    })
  }

  addWidgetToGroup(widget) {
    const groupName = widget.surfaceGroup || (widget.snap && widget.snap.surfaceGroup)
    if (!groupName) return
    
    let group = this.getGroupByTitle(groupName)
    if (!group) {
      const groupY = Math.max(0, widget.y - 1)
      group = this.createGroup(groupName, groupY)
    }
    
    if (widget.y <= group.y) {
      widget.y = group.y + 1
    }
  }

  generateLayout() {
    const layout = []
    const sortedGroups = this.getSortedGroups()
    
    for (const group of sortedGroups) {
      const panelCount = group.collapsed 
        ? (this.collapsedPanels.get(group.surfaceId) || []).length 
        : this.getPanelsInGroup(group.surfaceId).length
      
      layout.push({
        type: 'group',
        i: group.surfaceId,
        x: group.x,
        y: group.y,
        w: group.w,
        h: group.h,
        title: group.title,
        collapsed: group.collapsed,
        panelCount: panelCount,
        static: true,
        isResizable: false,
        isDraggable: false
      })
      
      if (!group.collapsed) {
        const panels = this.getPanelsInGroup(group.surfaceId)
        for (const panel of panels) {
          layout.push({
            ...panel,
            type: 'panel',
            i: panel.surfaceId,
            rendered: panel.rendered
          })
        }
      }
    }
    
    const ungroupedPanels = this.getUngroupedPanels()
    for (const panel of ungroupedPanels) {
      layout.push({
        ...panel,
        type: 'panel',
        i: panel.surfaceId,
        rendered: panel.rendered
      })
    }
    
    layout.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y
      return a.x - b.x
    })
    
    return layout
  }

  findPositionInGroup(group, w, h) {
    if (!group) {
      return { x: 0, y: 1 }
    }
    
    const panels = this.getPanelsInGroup(group.surfaceId)
    if (panels.length === 0) {
      return { x: 0, y: group.y + 1 }
    }
    
    let maxBottom = group.y + 1
    panels.forEach(panel => {
      const bottom = panel.y + panel.h
      if (bottom > maxBottom) {
        maxBottom = bottom
      }
    })
    
    for (let y = group.y + 1; y < maxBottom; y++) {
      for (let x = 0; x <= this.colNum - w; x++) {
        if (this.canPlaceAt(panels, x, y, w, h)) {
          return { x, y }
        }
      }
    }
    
    return { x: 0, y: maxBottom }
  }

  canPlaceAt(panels, x, y, w, h) {
    for (const panel of panels) {
      const overlapX = x < panel.x + panel.w && x + w > panel.x
      const overlapY = y < panel.y + panel.h && y + h > panel.y
      if (overlapX && overlapY) {
        return false
      }
    }
    return true
  }

  clearGroups() {
    const groups = this.getGroups()
    groups.forEach(group => {
      this.removeWidget(group.surfaceId)
    })
    this.collapsedPanels.clear()
    this.emit('groups:cleared')
  }

  calculateSurfaceIndexes() {
    const widgets = this.getWidgets()
    widgets.sort((a, b) => {
      if (a.x !== b.x) return a.x - b.x
      return a.y - b.y
    })
    
    widgets.forEach((widget, index) => {
      if (widget.snap) {
        widget.snap.surfaceIndex = index
      }
    })
    return widgets
  }

  async saveSnapshot(conversationId) {
    if (!conversationId) {
      console.warn('saveSnapshot: conversationId required')
      return
    }
    
    try {
      const widgets = this.calculateSurfaceIndexes()
      widgets.forEach(widget => {
        if (widget.snap && widget.snap.propsSnap) {
          widget.snap.propsSnap.x = widget.x
          widget.snap.propsSnap.y = widget.y
          widget.snap.propsSnap.w = widget.w
          widget.snap.propsSnap.h = widget.h
        }
      })
      
      const snapshots = widgets.map(widget => widget.snap)
      console.log('snapshots', snapshots)
      await HTTP.saveCanvasSnapshot(conversationId, snapshots)
      this.emit('snapshot:saved', { conversationId, count: snapshots.length })
    } catch (error) {
      console.error('保存快照失败', error)
      this.emit('snapshot:error', { conversationId, error })
    }
  }

  loadFromSnapshots(snapshots, createWidgetFn) {
    if (!Array.isArray(snapshots) || snapshots.length === 0) {
      console.warn('loadFromSnapshots: no snapshots')
      return
    }
    
    const sorted = [...snapshots].sort((a, b) => 
      (a.surfaceIndex ?? 0) - (b.surfaceIndex ?? 0)
    )
    
    const groupNames = new Set()
    sorted.forEach(snapshot => {
      if (snapshot.surfaceGroup) {
        groupNames.add(snapshot.surfaceGroup)
      }
    })
    
    let currentY = 0
    const groupYMap = new Map()
    
    groupNames.forEach(groupName => {
      const groupId = `group-${groupName}`
      const group = {
        surfaceId: groupId,
        isGroup: true,
        title: groupName,
        x: 0,
        y: currentY,
        w: 12,
        h: 1,
        collapsed: false
      }
      
      this.addWidget(group)
      groupYMap.set(groupName, currentY)
      currentY += 1
      
      const groupWidgets = sorted.filter(s => s.surfaceGroup === groupName)
      if (groupWidgets.length > 0) {
        const maxH = Math.max(...groupWidgets.map(s => s.propsSnap?.h || 7))
        currentY += maxH
      }
    })
    
    for (const snapshot of sorted) {
      const { propsSnap, surfaceGroup } = snapshot
      let position
      
      if (propsSnap?.x !== undefined && propsSnap?.y !== undefined) {
        position = {
          x: propsSnap.x,
          y: propsSnap.y
        }
      } else {
        position = this.calculatePosition(
          { w: propsSnap?.w || 4, h: propsSnap?.h || 7 },
          surfaceGroup
        )
      }
      
      if (createWidgetFn) {
        const widget = createWidgetFn(snapshot, position)
        if (widget) {
          this.addWidget(widget)
        }
      }
    }
    
    this.emit('snapshot:loaded', { count: sorted.length })
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event).push(callback)
  }

  off(event, callback) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  emit(event, data) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`${event} event handler error`, error)
        }
      })
    }
  }
}

export default CanvasManager