import axiosService from './axios-service'

const commonUrl = '/visualization'
const canvasUrl = '/api/canvas'

export default {
  /**
   * 获取主题列表
   * @returns {Promise}
   */
  getThemesAPI() {
    return axiosService.get(`${commonUrl}/themes`)
  },

  /**
   * 保存画布快照
   * @param {string} conversationId - 对话ID
   * @param {Array} snapshots - 快照数据数组
   * @returns {Promise}
   */
  saveCanvasSnapshot(conversationId, snapshots) {
    return axiosService.put(`${canvasUrl}/${conversationId}/snap/props`, snapshots)
  },

  /**
   * 获取画布快照
   * @param {string} conversationId - 对话ID
   * @returns {Promise}
   */
  getCanvasSnapshot(conversationId) {
    return axiosService.get(`${canvasUrl}/${conversationId}/snap/props`)
  }
}