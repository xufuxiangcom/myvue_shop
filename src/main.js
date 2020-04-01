import Vue from 'vue'
import App from './App.vue'
import router from './router'
import './plugins/element.js'
import axios from 'axios'

// 字体图标全局样式
import './assets/fonts/iconfont.css'

// 全局样式
import './assets/css/global.css'
// 这样配置每个Vue组件都可以发起通过$http来发axios请求
Vue.prototype.$http = axios
// 配置请求地址的根路径
axios.defaults.baseURL = 'http://127.0.0.1:8888/api/private/v1/'
axios.interceptors.request.use(config => {
  // console.log(config)
  config.headers.Authorization = window.sessionStorage.getItem('token')
  // 在最后必须 return config
  return config
})

Vue.config.productionTip = false

new Vue({
  router,
  render: h => h(App)
}).$mount('#app')
