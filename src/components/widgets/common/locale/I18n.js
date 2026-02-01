
import Vue from 'vue'
import VueI18n from 'vue-i18n'
import PuiZh from 'PUI/src/locale/lang/zh-CN'
import PuiEn from 'PUI/src/locale/lang/en-US'
import PuiJaJp from 'PUI/src/locale/lang/ja-JP'
import Zh from './Zh'
import En from './En'
import axios from 'axios'

const prefixKey = 'PLAT_unified_prefix'

Vue.locale = () => {
  let lang = 'zh'
  const localStorageLang = localStorage.getItem('currentLanguage') || localStorage.getItem('language') || 'zh'
  
  switch (localStorageLang) {
    case 'zh-CN':
      lang = 'zh'
      break
    case 'zh':
      lang = 'zh'
      break
    case 'en-US':
      lang = 'en'
      break
    case 'en':
      lang = 'en'
      break
  }
  
  const messages = {
    zh: { ...PuiZh, ...Zh },
    en: { ...PuiEn, ...En }
  }
  
  const i18n = new VueI18n({
    locale: lang,
    messages
  })
  
  if (localStorageLang !== 'zh' && localStorageLang !== 'en') {
    let loadedLanguageList = localStorage.getItem('thirdLanguageInstallStatus') || ''
    loadedLanguageList = JSON.parse(loadedLanguageList)
    
    if (loadedLanguageList && loadedLanguageList.some(item => item === 'UCP_BasePlat')) {
      loadLanguageAsync(localStorageLang)
    } else {
      i18n.locale = 'en'
    }
  }
  
  async function loadLanguageAsync(lang) {
    if (i18n.locale === lang && Object.keys(i18n.getLocaleMessage(lang)).length > 0) {
      return
    }
    
    let publicPath = localStorage.getItem(prefixKey) && process.env.NODE_ENV !== 'development' 
      ? localStorage.getItem(prefixKey) 
      : ''
    
    try {
      const response = await axios.get(
        `${publicPath}/kong/resources/language/${localStorageLang}/i18n/UCP_BasePlat/${localStorageLang}.js`
      )
      
      const sandbox = {}
      const script = new Function('context', `with(context){${response.data}return{iomWidget}}`)
      const language = script(sandbox)['iomWidget']
      
      i18n.setLocaleMessage(lang, { ...language, ...PuiJaJp })
      i18n.locale = lang
    } catch (error) {
      console.error(`Failed to load language file: ${lang}`, error)
    }
  }
  
  return i18n
}

Vue.use(VueI18n)

export default Vue.locale()