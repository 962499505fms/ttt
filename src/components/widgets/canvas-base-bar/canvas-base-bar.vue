<template>
  <div class="widgetBaseBarChart" style="width: 100%; height: 100%">
    <div v-if="!noData" ref="chartBar" style="width: 100%; height: 100%"></div>
    <div v-if="noData" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center">
      <h3>{{ $t('noData') }}</h3>
    </div>
  </div>
</template>

<script>
import { themeConfig } from '../common/chartTheme'
import { getRandomColorByStr, hexToRgba } from '../common/utils.js'
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  MarkPointComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([
  BarChart,
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent,
  CanvasRenderer,
  MarkPointComponent
])

export default {
  name: 'canvas-base-bar',
  props: ['data', 'surfaceId', 'resize', 'theme', 'lang', 'config', 'resobj', 'chart-height', 'chart-width', 'charttheme'],
  computed: {
    themeConfig() {
      return themeConfig[this.theme]
    },
    widgetData() {
      try {
        return JSON.parse(this.data)
      } catch (e) {
        return {}
      }
    }
  },
  watch: {
    widgetData: {
      handler(val) {
        this.$nextTick(() => {
          this.initChart(val)
        })
      },
      deep: true
    },
    resize() {
      this.resizeChart()
    },
    chartHeight: {
      handler() {
        this.resizeChart()
      }
    },
    charttheme: {
      handler(newValue) {
        if (!newValue) return
        try {
          let val = JSON.parse(newValue)
          if (val && val.themeJson) {
            let { themeJson, themeJsonName } = val
            echarts.registerTheme(themeJsonName, JSON.parse(themeJson))
            this.themeName = themeJsonName
            this.$nextTick(() => {
              this.initChart(this.widgetData)
            })
          }
        } catch (e) {
          console.error('charttheme parse error', e)
        }
      }
    }
  },
  data() {
    return {
      instance: null,
      noData: false,
      colorList: [],
      themeName: null
    }
  },
  beforeDestroy() {
    this.instance && this.instance.dispose()
  },
  mounted() {
    const color = 'rgba(38,104,219,1)'
    const lowColor = 'rgba(38,104,219,0.4)'
    const midleColor = 'rgba(38,104,219,0.8)'
    this.colorList = [color, midleColor, lowColor]
    if (this.widgetData) {
      this.$nextTick(() => {
        this.initChart(this.widgetData)
      })
    }
  },
  methods: {
    resizeChart() {
      this.$nextTick(() => {
        this.instance && this.instance.resize()
        const option = this.instance.getOption()
        const dataLen = (option.xAxis?.[0]?.data || option.yAxis?.[0]?.data || []).length
        const isVertical = option.xAxis?.[0]?.type === 'category'
        const barWidth = option.series?.[0]?.barWidth || '50%'
        this.updateMarkPointWidth(option, dataLen, barWidth, isVertical)
      })
    },
    formatString(word, maxLength) {
      const hyphenationPoints = [...word].reduce((acc, char, i) => {
        if (/[aeiouy]/i.test(char)) acc.push(i)
        return acc
      }, [])
      const breakAt = hyphenationPoints.reverse().find(pos => pos <= maxLength)
      return breakAt ? word.slice(0, breakAt + 1) + '_' : null
    },
    initChart({ data, tipData = [], yLabel, unit = '', name, color, lowColor, midleColor, showMaxUnit, maxUnitList, isVertical }) {
      this.instance && this.instance.dispose()
      if (isVertical !== false) isVertical = true
      let girdBdColor = this.themeConfig.girdBdColor
      let fnColor = this.themeConfig.fnColor
      color = color || this.colorList[0]
      lowColor = lowColor || this.colorList[2]
      midleColor = midleColor || this.colorList[1]
      const randomColor = getRandomColorByStr(this.surfaceId, 1, true)[0] || this.colorList[0]
      data = data === undefined ? [] : data
      unit = unit ? unit : ''
      const xData = data.map(item => item.name || '')
      const yData = data.map(item => item.value || 0)
      if (!data.length || xData.length === 0 || yData.length === 0) {
        this.noData = true
        return
      } else {
        this.noData = false
      }
      const barWidth = xData.length > 6 ? '50%' : '40%'
      const markPointData = yData.map((item, index) => ({
        xAxis: isVertical ? index : item,
        yAxis: isVertical ? item : index
      }))
      const itemStyleColor = isVertical
        ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: hexToRgba(randomColor, 0.5) },
            { offset: 1, color: hexToRgba(randomColor, 0.3) }
          ])
        : new echarts.graphic.LinearGradient(1, 0, 0, 0, [
            { offset: 0, color: hexToRgba(randomColor, 0.5) },
            { offset: 1, color: hexToRgba(randomColor, 0.3) }
          ])
      const option = {
        color: this.colorList,
        grid: {
          left: '1%',
          right: isVertical ? '1%' : '5%',
          bottom: 0,
          top: '5%',
          containLabel: true
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: params => {
            const data = params[0]
            let str = ''
            if (data.seriesName) {
              str += data.seriesName + '<br>'
            }
            let valueStr = showMaxUnit ? this.formatData(maxUnitList, data.name) : data.value + unit
            const tipValue = this.getTipData(tipData, data.dataIndex)
            const itemName = xData[data.dataIndex] || data.name
            str += data.marker + itemName + ':' + (tipValue || valueStr)
            return str
          },
          confine: true,
          className: 'widget-tooltip widget-tooltip-' + this.theme
        },
        xAxis: {
          type: isVertical ? 'category' : 'value',
          data: isVertical ? xData : undefined,
          axisTick: {
            show: false,
            alignWithLabel: true
          },
          axisLabel: {
            color: fnColor,
            formatter: value => {
              if (isVertical) {
                return value.length > 10 ? value.substring(0, 9) + '...' : value
              }
              return `${value}${unit}`
            },
            overflow: 'truncate',
            ellipsis: '...'
          },
          axisLine: {
            show: isVertical,
            onZero: true,
            lineStyle: {
              type: 'dashed',
              color: girdBdColor
            }
          },
          splitLine: {
            lineStyle: {
              type: 'dashed',
              color: girdBdColor
            }
          }
        },
        yAxis: {
          type: isVertical ? 'value' : 'category',
          data: !isVertical ? xData : undefined,
          axisLabel: {
            color: fnColor,
            formatter: value => {
              if (isVertical) {
                return `${value}${unit}`
              }
              return value.length > 10 ? value.substring(0, 9) + '...' : value
            }
          },
          axisTick: {
            show: false,
            alignWithLabel: true
          },
          axisLine: {
            show: !isVertical,
            onZero: true,
            lineStyle: {
              type: 'dashed',
              color: girdBdColor
            }
          },
          splitLine: {
            lineStyle: {
              type: 'dashed',
              color: girdBdColor
            }
          }
        },
        series: [
          {
            name: name || '数据',
            type: 'bar',
            barWidth: barWidth,
            emphasis: {
              scale: true,
              scaleSize: 1.2
            },
            data: yData,
            barMinHeight: 1,
            markPoint: {
              silent: true,
              symbol: 'rect',
              symbolSize: [isVertical ? 40 : 3, isVertical ? 3 : 40],
              itemStyle: {
                color: randomColor
              },
              label: {
                show: false
              },
              data: markPointData,
              z: 3
            },
            itemStyle: {
              color: itemStyleColor
            }
          }
        ]
      }
      this.cleanUndefinedProperties(option)
      this.$nextTick(() => {
        if (!this.$refs.chartBar) {
          console.error('chartBar ref not found')
          return
        }
        try {
          this.instance = echarts.init(this.$refs.chartBar, this.themeName, {
            devicePixelRatio: window.devicePixelRatio * 2
          })
          this.instance.setOption(option)
          this.$nextTick(() => {
            this.updateMarkPointWidth(option, data.length, barWidth, isVertical)
          })
          window.addEventListener('resize', this.resizeChart)
        } catch (error) {
          console.error('ECharts init error', error)
          this.noData = true
        }
      })
    },
    updateMarkPointWidth(option, dataCount, barWidth, isVertical) {
      if (!this.instance) return
      if (typeof barWidth !== 'string' || !barWidth.endsWith('%')) {
        return
      }
      const percent = parseFloat(barWidth) / 100
      const model = this.instance.getModel()
      const grid = model.getComponent('grid')
      if (!grid) return
      const gridRect = grid.coordinateSystem.getRect()
      const gridWidth = gridRect.width
      const gridHeight = gridRect.height
      let barPixelSize
      if (isVertical) {
        const bandWidth = gridWidth / dataCount
        barPixelSize = bandWidth * percent
      } else {
        const bandHeight = gridHeight / dataCount
        barPixelSize = bandHeight * percent
      }
      barPixelSize = Math.max(2, Math.floor(barPixelSize))
      const series = option.series[0]
      series.markPoint.symbolSize = isVertical ? [barPixelSize, 3] : [3, barPixelSize]
      this.instance.setOption({
        series: [
          {
            markPoint: series.markPoint
          }
        ]
      }, false)
    },
    cleanUndefinedProperties(obj) {
      if (typeof obj !== 'object' || obj === null) return
      Object.keys(obj).forEach(key => {
        if (obj[key] === undefined) {
          delete obj[key]
        } else if (typeof obj[key] === 'object') {
          this.cleanUndefinedProperties(obj[key])
        }
      })
    },
    formatData(maxUnitList = [], name) {
      const index = maxUnitList.findIndex(item => item.name === name)
      if (index === -1) {
        return ''
      }
      const { maxValue, maxUnit } = maxUnitList[index] || {}
      return `${maxValue || ''}${maxUnit || ''}`
    },
    getTipData(tipData = [], seriesIndex = 0) {
      return tipData[seriesIndex] || ''
    }
  }
}
</script>

<style lang="scss" scoped>
.widgetBaseBarChart {
  width: 100%;
  height: 100%;
}
</style>