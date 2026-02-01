<template>
  <div class="widget-base-log" :class="theme">
    <!-- 日志统计图子组件 -->
    <log-chart
      class="log-chart-section"
      :chart-data="chartData"
      :levels="levels"
      :theme="theme"
      :theme-config="themeConfig"
      :resize="resize"
    />

    <!-- 日志列表子组件 -->
    <log-table
      class="log-table-section"
      :logs="logs"
      :columns="tableColumns"
      :theme="theme"
      :theme-config="themeConfig"
    />
  </div>
</template>

<script>
import LogChart from './LogChart.vue'
import LogTable from './LogTable.vue'
import { themeConfig } from '../common/chartTheme'

export default {
  name: 'canvas-base-log',
  components: {
    LogChart,
    LogTable
  },
  props: ['data', 'surfaceId', 'resize', 'theme', 'lang', 'config', 'chart-height', 'chart-width'],
  computed: {
    widgetData() {
      try {
        return JSON.parse(this.data)
      } catch (e) {
        return {}
      }
    },
    themeConfig() {
      return themeConfig[this.theme]
    },
    logs() {
      return this.widgetData?.logs || []
    },
    tableColumns() {
      // 默认列配置（无 width，自适应）
      const defaultColumns = [
        { key: 'level', title: this.$t('logLevel') },
        { key: 'source', title: this.$t('logSource') },
        { key: 'timestamp', title: this.$t('logTimestamp') },
        { key: 'content', title: this.$t('logContent') }
      ]
      return this.widgetData?.columns?.length > 0
        ? this.widgetData.columns
        : defaultColumns
    },
    levels() {
      // 从logs中提取所有级别
      return [...new Set(this.logs.map(log => log.level).filter(Boolean))]
    },
    chartData() {
      return this.aggregateLogsByTime(this.logs)
    }
  },
  methods: {
    // 智能时间聚合：根据数据时间跨度自动选择聚合粒度
    aggregateLogsByTime(logs) {
      if (!logs || logs.length === 0) return []

      // 获取时间范围
      const timestamps = logs.map(log => new Date(log.timestamp).getTime()).filter(t => !isNaN(t))
      if (timestamps.length === 0) return []

      const minTime = Math.min(...timestamps)
      const maxTime = Math.max(...timestamps)
      const timeSpan = maxTime - minTime

      // 根据时间跨度选择聚合粒度
      let interval
      if (timeSpan <= 3600000) { // 1小时内
        interval = 10 * 60 * 1000 // 10分钟
      } else if (timeSpan <= 86400000) { // 1天内
        interval = 30 * 60 * 1000 // 30分钟
      } else {
        interval = 60 * 60 * 1000 // 1小时
      }

      const timeMap = {}
      const allLevels = this.levels

      logs.forEach(log => {
        const date = new Date(log.timestamp)
        if (isNaN(date.getTime())) return

        const roundedTime = Math.floor(date.getTime() / interval) * interval
        const timeKey = new Date(roundedTime).toLocaleTimeString('zh-CN', {
          hour: '2-digit',
          minute: '2-digit'
        })

        if (!timeMap[timeKey]) {
          timeMap[timeKey] = { time: timeKey }
          allLevels.forEach(level => {
            timeMap[timeKey][level] = 0
          })
        }
        if (log.level && timeMap[timeKey][log.level] !== undefined) {
          timeMap[timeKey][log.level]++
        }
      })

      return Object.values(timeMap).sort((a, b) => a.time.localeCompare(b.time))
    }
  }
}
</script>

<style lang="less" scoped>
.widget-base-log {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .log-chart-section {
    height: 40%;
    min-height: 150px;
    flex-shrink: 0;
  }

  .log-table-section {
    flex: 1;
    overflow: hidden;
  }
}
</style>
