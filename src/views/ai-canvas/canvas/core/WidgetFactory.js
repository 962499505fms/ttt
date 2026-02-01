import Vue from 'vue'

class WidgetFactory {
  constructor(options = {}) {
    this.minH = options.minH || 7
    this.widgetBaseUrl = options.widgetBaseUrl || '/widgets'
    this.registeredComponents = new Map()
    this.configCache = new Map()
    this.loadedScripts = new Set()
    this.isDev = process.env.NODE_ENV === 'development'
  }

  createWidgetConfig(surfaceId, widgetId, widgetJsonConfig, surfaceIndex = 0, context = {}) {
    const { w, h, minH, maxH, ...staticConfig } = widgetJsonConfig
    const widget = {
      surfaceId,
      widgetId,
      component: widgetId,
      i: surfaceId + '_' + widgetId,
      x: 0,
      y: 0,
      w: w || 4,
      h: h || this.minH,
      rendered: false,
      status: 'loaded',
      surfaceGroup: null,
      snap: {
        conversationId: context.conversationId || null,
        canvasId: context.canvasId || null,
        surfaceId,
        surfaceIndex,
        surfaceGroup: null,
        surfaceSnap: {
          createSurface: null,
          updateComponents: null,
          updateDataModel: null
        },
        propsSnap: {
          ...staticConfig,
          minH,
          maxH
        }
      },
      data: {},
      _pathBindings: {},
      _pendingStaticData: {}
    }
    return widget
  }

  registerComponent(name, component) {
    try {
      if (this.isComponentRegistered(name)) {
        console.warn(`组件 ${name} 已注册，跳过`)
        return true
      }
      
      if (!Vue.component(name, component)) {
        throw new Error(`注册组件 ${name} 失败`)
      }
      
      this.registeredComponents.set(name, component)
      return true
    } catch (error) {
      console.error(`注册组件 ${name} 时发生错误`, error)
      return false
    }
  }

  isComponentRegistered(name) {
    return this.registeredComponents.has(name)
  }

  getComponent(name) {
    return this.registeredComponents.get(name) || null
  }

  getRegisteredComponentNames() {
    return Array.from(this.registeredComponents.keys())
  }

  getRegisteredComponentCount() {
    return this.registeredComponents.size
  }

  async loadWidget(widgetId) {
    try {
      const widgetConfig = await this.loadConfig(widgetId)
      
      if (!this.isDev) {
        const jsUrl = `${this.widgetBaseUrl}/${widgetId}.js`
        await this.loadScript(jsUrl)
      }
      
      return widgetConfig
    } catch (error) {
      console.error(`加载小部件 ${widgetId} 时发生错误`, error)
      throw new Error(`小部件 ${widgetId} 加载失败: ${error.message}`)
    }
  }

  async loadConfig(widgetId) {
    if (this.configCache.has(widgetId)) {
      return this.configCache.get(widgetId)
    }

    let config
    if (this.isDev && window.localWidgetConfigs && window.localWidgetConfigs[widgetId]) {
      config = window.localWidgetConfigs[widgetId]
      console.log(`[WidgetFactory] 使用本地配置 ${widgetId}`)
    } else {
      const configUrl = `${this.widgetBaseUrl}/${widgetId}.json`
      config = await this.fetchJson(configUrl)
      console.log(`[WidgetFactory] 加载配置 ${widgetId}`)
    }

    this.configCache.set(widgetId, config)
    return config
  }

  async loadScript(url) {
    if (this.isDev) {
      console.log(`[WidgetFactory] 开发模式跳过加载 JS: ${url}`)
      return
    }

    return new Promise((resolve, reject) => {
      try {
        if (this.loadedScripts.has(url)) {
          resolve()
          return
        }

        const script = document.createElement('script')
        script.src = url
        script.async = true
        script.onload = () => {
          this.loadedScripts.add(url)
          resolve()
        }
        script.onerror = () => {
          reject(new Error(`脚本 ${url} 加载失败`))
        }
        document.head.appendChild(script)
      } catch (error) {
        reject(error)
      }
    })
  }

  async loadBatch(widgetIds, maxConcurrency = 3) {
    const results = []
    const executing = []

    for (const widgetId of widgetIds) {
      const promise = this.loadWidget(widgetId)
        .then(result => {
          executing.splice(executing.indexOf(promise), 1)
          return result
        })
        .catch(error => {
          executing.splice(executing.indexOf(promise), 1)
          console.error(`小部件 ${widgetId} 加载失败`, error)
          return null
        })
      
      results.push(promise)
      executing.push(promise)

      if (executing.length >= maxConcurrency) {
        await Promise.race(executing)
      }
    }

    return Promise.all(results)
  }

  async fetchJson(url) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      console.error(`获取 JSON ${url} 失败`, error)
      throw error
    }
  }

  clearConfigCache(widgetId) {
    if (widgetId) {
      this.configCache.delete(widgetId)
    } else {
      this.configCache.clear()
    }
  }

  getCachedConfigCount() {
    return this.configCache.size
  }

  getLoadedScriptCount() {
    return this.loadedScripts.size
  }
}

export default WidgetFactory