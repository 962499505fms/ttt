class A2UIDataHandler {
  constructor() {
    this.dataModels = new Map()
  }

  initDataModel(surfaceId) {
    this.dataModels.set(surfaceId, {})
  }

  updateDataModel(surfaceId, path, value) {
    const dataModel = this.dataModels.get(surfaceId)
    if (!dataModel) {
      console.warn(`DataModel for ${surfaceId} not found`)
      return
    }
    this.setValueByPath(dataModel, path, value)
  }

  getDataModel(surfaceId) {
    return this.dataModels.get(surfaceId) || null
  }

  removeDataModel(surfaceId) {
    this.dataModels.delete(surfaceId)
  }

  clearDataModels() {
    this.dataModels.clear()
  }

  hasDataModel(surfaceId) {
    return this.dataModels.has(surfaceId)
  }

  getValueByPath(surfaceId, path) {
    const dataModel = this.dataModels.get(surfaceId)
    if (!dataModel) return null
    return this.getValueByPathInternal(dataModel, path)
  }

  hasPath(surfaceId, path) {
    const value = this.getValueByPath(surfaceId, path)
    return value !== undefined && value !== null
  }

  resolvePathBindings(surfaceId, pathBindings) {
    if (!pathBindings || Object.keys(pathBindings).length === 0) {
      return {}
    }
    
    const resolved = {}
    for (const [key, bindingPath] of Object.entries(pathBindings)) {
      const value = this.getValueByPath(surfaceId, bindingPath)
      if (value !== undefined) {
        resolved[key] = value
      }
    }
    return resolved
  }

  joinPath(basePath, relativePath) {
    const baseKeys = this.parsePath(basePath)
    const relativeKeys = this.parsePath(relativePath)
    return '/' + [...baseKeys, ...relativeKeys].join('/')
  }

  getChildPaths(surfaceId, path) {
    const value = this.getValueByPath(surfaceId, path)
    if (!value || typeof value !== 'object') return []
    
    return Object.keys(value).map(key => {
      return path.endsWith('/') ? `${path}${key}` : `${path}/${key}`
    })
  }

  parseComponentConfig(component) {
    const staticData = {}
    const pathBindings = {}
    
    for (const [key, value] of Object.entries(component)) {
      if (key === 'id' || key === 'component') continue
      
      if (value && typeof value === 'object' && value.path) {
        pathBindings[key] = value.path
      } else {
        staticData[key] = value
      }
    }
    
    return { staticData, pathBindings }
  }

  resolveComponentPaths(surfaceId, component) {
    const dataModel = this.dataModels.get(surfaceId)
    if (!dataModel) return component
    
    const resolved = {}
    for (const [key, value] of Object.entries(component)) {
      if (value && typeof value === 'object' && value.path) {
        const resolvedValue = this.getValueByPathInternal(dataModel, value.path)
        resolved[key] = resolvedValue
      } else {
        resolved[key] = value
      }
    }
    return resolved
  }

  parsePath(path) {
    if (!path) return []
    return path.split('/').filter(key => key !== '')
  }

  getValueByPathInternal(dataModel, path) {
    if (!path || !dataModel) return null
    
    try {
      const keys = this.parsePath(path)
      if (keys.length === 0) {
        return dataModel['/']
      }
      
      let current = dataModel['/']
      for (const key of keys) {
        if (!current || typeof current !== 'object') {
          return null
        }
        current = current[key]
      }
      return current
    } catch (error) {
      console.error(`Error getting value by path: ${path}`, error)
      return null
    }
  }

  setValueByPath(dataModel, path, value) {
    if (!path || !dataModel) return
    
    try {
      const keys = this.parsePath(path)
      if (keys.length === 0) {
        if (typeof value === 'object' && value !== null) {
          dataModel['/'] = { ...dataModel['/'], ...value }
        } else {
          dataModel['/'] = value
        }
        return
      }
      
      if (!dataModel['/']) {
        dataModel['/'] = {}
      }
      
      let current = dataModel['/']
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]] || typeof current[keys[i]] !== 'object') {
          current[keys[i]] = {}
        }
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
    } catch (error) {
      console.error(`Error setting value by path: ${path}`, error)
    }
  }

  removeValueByPath(dataModel, path) {
    if (!path || !dataModel) return
    
    try {
      const keys = this.parsePath(path)
      if (keys.length === 0) {
        dataModel['/'] = {}
        return
      }
      
      let current = dataModel['/']
      if (!current) return
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) return
        current = current[keys[i]]
      }
      
      delete current[keys[keys.length - 1]]
    } catch (error) {
      console.error(`Error removing value by path: ${path}`, error)
    }
  }
}

export default A2UIDataHandler