const registerWidgets = Vue => {
  const requireComponent = require.context(
    '@/components/widgets',
    true,
    /\w+\.vue$/
  )
  
  requireComponent.keys().forEach(fileName => {
    const fileNameWithoutExt = fileName.split('/').pop().replace(/\.\w+$/, '')
    
    if (fileNameWithoutExt.indexOf('canvas-') === -1) {
      return
    }
    
    const componentConfig = requireComponent(fileName)
    const componentName = fileNameWithoutExt
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('')
    
    Vue.component(componentName, componentConfig.default || componentConfig)
  })
}

export { registerWidgets }
export default registerWidgets