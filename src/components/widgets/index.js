import Vue from 'vue'

const isDev = process.env.NODE_ENV === 'development'

if (isDev) {
  // 自动注册所有Vue组件
  const requireComponent = require.context('.', true, /\.vue$/)
  requireComponent.keys().forEach(fileName => {
    const componentConfig = requireComponent(fileName)
    const component = componentConfig.default || componentConfig
    const componentName = fileName
      .split('/')
      .pop()
      .replace(/\.vue$/, '')
    
    if (component.name) {
      Vue.component(component.name, component)
      console.log(`[LocalWidget] 注册组件: ${component.name}`)
    } else {
      Vue.component(componentName, component)
      console.log(`[LocalWidget] 注册组件: ${componentName}`)
    }
  })
  
  // 加载本地小部件配置
  window.localWidgetConfigs = {}
  const requireJson = require.context('.', true, /canvasWidget\.json$/)
  
  requireJson.keys().forEach(fileName => {
    const config = requireJson(fileName)
    const configData = config.default || config
    let widgetId = configData.widgetId || configData.component
    
    if (!widgetId) {
      const parts = fileName.split('/').filter(part => part && part !== '.')
      widgetId = parts.length > 1 
        ? parts[parts.length - 2] 
        : parts[0].replace('.json', '')
    }
    
    if (widgetId) {
      window.localWidgetConfigs[widgetId] = configData
      console.log(`[LocalWidget] 加载配置: ${widgetId}`)
    }
  })
}

export default {}