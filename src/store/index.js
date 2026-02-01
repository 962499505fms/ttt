import Vue from 'vue'
import Vuex from 'vuex'
// import user from './modules/user'
import createLogger from 'vuex/dist/logger'

Vue.use(Vuex)

const isDev = process.env.NODE_ENV === 'development'

const store = new Vuex.Store({
  modules: {
    // user
  },
  plugins: isDev ? [createLogger()] : [],
  strict: false // 在开发环境中开启严格模式，生产环境关闭
})

export default store