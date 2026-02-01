<template>
  <div class="log-chart">
    <div v-if="!noData" ref="chartRef" class="chart-container"></div>
    <div v-else class="no-data">
      <span>{{ $t('logNoData') }}</span>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer
])

export default {
  name: 'LogChart',
  props: {
    chartData: { type: Array, default: () => [] },
    levels: { type: Array, default: () => [] },
    theme: { type: String, default: 'star' },
    themeConfig: { type: Object, default: () => ({}) },
    resize: { type: [Number, String], default: 0 }
  },
  data() {
    return {
      instance: null,
      noData: false,
      levelColors: {
        ERROR: '#ff6b6b',
        WARNING: '#ffc107',
        INFO: '#17a2b8',
        DEBUG: '#28a745',
        CRITICAL: '#dc3545',
        TRACE: '#6c757d'
      }
    }
  },
  watch: {
    chartData: {
      handler() {
        this.$nextTick(() => this.initChart())
      },
      deep: true
    },
    resize() {
      this.resizeChart()
    }
  },
  mounted() {
    this.$nextTick(() => this.initChart())
  },
  beforeDestroy() {
    this.instance && this.instance.dispose()
  },
  methods: {
    initChart() {
      if (!this.chartData || this.chartData.length === 0) {
        this.noData = true
        return
      }
      this.noData = false

      // 需要等待 noData 变化后 DOM 更新完成再初始化图表
      this.$nextTick(() => {
        if (!this.$refs.chartRef) return

        if (this.instance) {
          this.instance.dispose()
        }

        this.instance = echarts.init(this.$refs.chartRef)
        const option = this.buildChartOption()
        this.instance.setOption(option)
      })
    },
    resizeChart() {
      this.instance && this.instance.resize()
    },
    buildChartOption() {
      const chartData = this.chartData
      const timeData = chartData.map(item => item.time)
      const fnColor = this.themeConfig?.fnColor || '#666'
      const girdBdColor = this.themeConfig?.girdBdColor || 'rgba(128,128,128,0.2)'
      
      // 根据数据量动态调整柱子宽度
      const dataLen = timeData.length
      const barWidth = dataLen > 6 ? '50%' : '40%'

      return {
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          confine: true
        },
        legend: {
          orient: 'vertical',
          right: 10,
          top: 'center',
          data: this.levels,
          textStyle: { color: fnColor }
        },
        grid: {
          left: '1%',
          right: '15%',
          bottom: '3%',
          top: '8%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: timeData,
          axisTick: {
            show: false,
            alignWithLabel: true
          },
          axisLabel: { 
            color: fnColor,
            fontSize: 11
          },
          axisLine: { 
            show: true,
            lineStyle: { 
              type: 'dashed',
              color: girdBdColor 
            } 
          },
          splitLine: {
            show: false
          }
        },
        yAxis: {
          type: 'value',
          axisTick: {
            show: false
          },
          axisLabel: { 
            color: fnColor,
            fontSize: 11
          },
          axisLine: { 
            show: false
          },
          splitLine: { 
            lineStyle: { 
              type: 'dashed',
              color: girdBdColor 
            } 
          }
        },
        series: this.levels.map(level => ({
          name: level,
          type: 'bar',
          stack: 'total',
          barWidth: barWidth,
          barMinHeight: 1,
          data: chartData.map(item => item[level] || 0),
          itemStyle: { 
            color: this.levelColors[level] || '#999',
            borderRadius: [2, 2, 0, 0]  // 顶部圆角
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.2)'
            }
          }
        }))
      }
    }
  }
}
</script>

<style lang="less" scoped>
.log-chart {
  width: 100%;
  height: 100%;

  .chart-container {
    width: 100%;
    height: 100%;
  }

  .no-data {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #999;
  }
}
</style>
