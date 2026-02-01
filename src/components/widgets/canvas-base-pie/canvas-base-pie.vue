<template>
  <div class="widgetBasePieChart" :style="{ width: '100%', height: height }">
    <div v-show="!noData" ref="chartPie" style="width: 100%; height: 100%"></div>
    <div v-show="noData" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center">
      <h3>{{ $t('noData') }}</h3>
    </div>
  </div>
</template>

<script>
import { themeConfig, chartsColorList } from '../common/chartTheme'
import { isInvalidNumber, getRandomColorByStr } from '../common/utils.js'
import * as echarts from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([PieChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent, CanvasRenderer])

export default {
  name: 'canvas-base-pie',
  props: ['data', 'block-id', 'resize', 'theme', 'lang', 'chart-height', 'chart-width', 'charttheme', 'unit'],
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
    height() {
      return this.chartHeight ? this.chartHeight + 'px' : '100%'
    }
  },
  watch: {
    widgetData: {
      handler(val) {
        const num = val?.y?.length || 1
        this.colorList = getRandomColorByStr(this.blockId, num, true)
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
        this.$nextTick(() => {
          this.resizeChart()
        })
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
      colorList: chartsColorList,
      themeName: null
    }
  },
  beforeDestroy() {
    this.instance && this.instance.dispose()
  },
  created() {
    this.instance = null
  },
  mounted() {
    if (this.widgetData) {
      this.$nextTick(() => {
        this.initChart(this.widgetData)
      })
    }
  },
  methods: {
    resizeChart() {
      this.$nextTick(() => {
        this.instance && this.instance.resize('auto', 'auto')
      })
    },
    escapeName(text) {
      return text.replace(/\//g, '\uFF0F')
    },
    initChart({ title, data, yLabel }) {
      if (!this.$refs.chartPie) {
        console.warn('chartPie DOM element not found')
        return
      }
      if (!this.instance) {
        this.instance = echarts.init(this.$refs.chartPie, this.themeName, {
          devicePixelRatio: window.devicePixelRatio || 2
        })
      }
      if (this.instance) {
        this.instance.dispose()
        this.instance = null
      }

      let colors = this.colorList
      let datas = []
      data = data === undefined ? [] : data

      if (!data.length) {
        this.noData = true
        return
      }
      this.noData = false

      let dataColor = this.themeConfig.dataColor
      let pieInlineFnColor = this.themeConfig.chartInlineFnColor
      const fnColor = this.themeConfig.fnColor
      const that = this

      data = data.map((item, index) => {
        return { ...item, id: `DATA_${index}` }
      })
      data.forEach((el, index) => {
        let color = colors[index] || chartsColorList[index % chartsColorList.length] || '#4981EA'
        datas.push({
          value: el.value,
          name: that.escapeName(el.name),
          id: el.id,
          itemStyle: {
            normal: {
              color: {
                colorStops: [
                  { offset: 0, color: color },
                  { offset: 1, color: color }
                ]
              },
              label: {
                show: false
              },
              labelLine: {
                show: false
              }
            }
          }
        })
      })

      const total = data.reduce((sum, item) => {
        const value = isInvalidNumber(item.value) ? 0 : Number(item.value)
        return sum + value
      }, 0)

      const legendData = data.map(d => d.id)
      let option = {
        color: colors,
        grid: {
          top: '10px',
          left: '2%',
          right: '2%'
        },
        tooltip: {
          formatter: params => {
            let str = ''
            const currentItem = data.find(item => item.id === params.name)
            const { name, value = 0 } = currentItem || {}
            const unit = this.unit || ''
            if (params.seriesName) {
              str += params.seriesName + '<br>'
            }
            str += params.marker + name + ':' + value + unit + ' (' + params.percent + '%)'
            return str
          },
          confine: true,
          className: 'widget-tooltip widget-tooltip-' + this.theme
        },
        legend: {
          show: true,
          right: '5%',
          left: '60%',
          icon: 'circle',
          type: 'scroll',
          verticalAlign: '-10px',
          orient: 'vertical',
          itemHeight: 10,
          itemWidth: 10,
          itemGap: 15,
          pageTextStyle: {
            color: fnColor
          },
          data: legendData,
          formatter: id => {
            const currentItem = data.find(item => item.id === id)
            let { value = 0, finalValue, name } = currentItem || {}
            finalValue = finalValue || value
            value = isInvalidNumber(value) ? 0 : value
            const unit = this.unit || ''
            const percentage = total === 0 ? 0 : ((value / total) * 100).toFixed(2)
            let nameStr = name.length > 20 ? name.substring(0, 20) + '...' : name
            return `{a|${nameStr}}\n{b|${percentage}%}\n{c|${finalValue}${unit}}`
          },
          textStyle: {
            color: fnColor,
            overflow: 'break',
            padding: [0, 0, -25, 0],
            rich: {
              a: {
                color: fnColor,
                lineHeight: 16
              },
              b: {
                color: dataColor,
                fontWeight: 'bold',
                padding: [0, 5],
                lineHeight: 16
              },
              c: {
                color: dataColor,
                fontWeight: 'bold',
                fontSize: 16,
                lineHeight: 26
              }
            }
          }
        },
        series: [
          {
            name: title,
            type: 'pie',
            clockWise: true,
            radius: '75%',
            center: ['32%', '50%'],
            itemStyle: {
              color: params => params.data.itemStyle.color,
              normal: {
                label: {
                  show: false,
                  position: 'inside',
                  formatter: '{d}%',
                  color: pieInlineFnColor,
                  fontSize: 14
                },
                labelLine: {
                  show: false
                }
              }
            },
            emphasis: {
              scale: true,
              scaleSize: 1.2
            },
            smooth: true,
            showSymbol: false,
            data: datas.map(d => ({
              id: d.id,
              name: d.id,
              value: d.value,
              realName: d.name,
              itemStyle: d.itemStyle,
              label: {
                formatter: ({ name }) => {
                  const item = data.find(d => d.id === name)
                  return item.name
                }
              }
            }))
          }
        ]
      }

      this.$nextTick(() => {
        this.instance = echarts.init(this.$refs.chartPie, this.themeName)
        this.instance.setOption(option)
      })
    }
  }
}
</script>

<style lang="less" scoped>
.widgetBasePieChart {
  width: 100%;
  height: 100%;
  .legend-item {
    cursor: pointer;
    margin: 5px;
    display: flex;
    align-items: center;
  }
  .legend-marker {
    width: 20px;
    height: 20px;
    margin-right: 10px;
  }
}
</style>