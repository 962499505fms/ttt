import axios from 'axios'

const prefixKey = 'PLAT_unified_prefix'
const basePath = localStorage.getItem(prefixKey)
const isDev = process.env.NODE_ENV === 'development'
let publicPath = basePath && !isDev ? basePath : ''

if (isDev) {
  // cookie
  // require('@/libs/getCookieByAutodev/autoCookie.js')
}

const axiosInstance = axios.create({
  baseURL: publicPath
})

axiosInstance.interceptors.request.use(
  config => {
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

axiosInstance.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    const response = error.response
    if (response && response.status === 401) {
      window.location.href = `${publicPath}/central/resNoPermission.html`
      return;
    }
    error.response.data.message && optMsg.fail(error.response.data.message);
    return Promise.reject(error)
  }
);

export default axiosInstance