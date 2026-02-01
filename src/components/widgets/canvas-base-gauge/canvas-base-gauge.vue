<template>
  <div class="widgetBaseGaugeChart" style="width: 100%; height: 100%" ref="chartGaugeBox">
    <div v-show="!noData" ref="chartGauge" style="width: 100%; height: 100%"></div>
    <div v-if="noData" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center">
      <h3>{{ $t('noData') }}</h3>
    </div>
  </div>
</template>

<script>
import { themeConfig, chartsColorList } from '../common/chartTheme'
import { getRandomColorByStr } from '../common/utils.js'
import * as echarts from 'echarts/core'
import { PieChart, GaugeChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

echarts.use([PieChart, GaugeChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent, CanvasRenderer])

export default {
  name: 'canvas-base-gauge',
  props: ['data', 'resize', 'theme', 'lang', 'config', 'resobj', 'charttheme', 'block-id'],
  computed: {
    themeConfig() {
      // 默认使用 white 主题，防止 undefined 错误
      return themeConfig[this.theme] || themeConfig['white']
    },
    noData() {
      return this.widgetData.length === 0
    },
    widgetData() {
      try {
        const parsed = JSON.parse(this.data)
        // 兼容两种数据格式：
        // 1. 直接数组格式: [{ name, value }]
        // 2. 对象格式: { data: [{ name, value }] }
        if (Array.isArray(parsed)) {
          return parsed
        } else if (parsed && Array.isArray(parsed.data)) {
          return parsed.data
        }
        return []
      } catch (e) {
        return []
      }
    }
  },
  watch: {
    widgetData: {
      handler(val) {
        this.initChart({ data: val })
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
              this.initChart({ data: this.widgetData })
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
      colorList: chartsColorList,
      themeName: null
    }
  },
  beforeDestroy() {
    this.instance && this.instance.dispose()
  },
  mounted() {
    this.$nextTick(() => {
      if (this.widgetData) {
        this.initChart({ data: this.widgetData })
      }
    })
  },
  methods: {
    resizeChart() {
      this.$nextTick(() => {
        this.instance && this.instance.resize('auto', 'auto')
      })
    },
    initChart({ data }) {
      if (this.instance) {
        this.instance.dispose()
      }
      if (data === undefined) data = []
      if (data.length === 0) return

      let colors = getRandomColorByStr(this.blockId, data.length || 1, true)
      let dataColor = this.themeConfig.dataColor
      let pieInlineFnColor = this.themeConfig.chartInlineFnColor
      const xBorderColor = this.themeConfig.xBorderColor
      const fnColor = this.themeConfig.fnColor
      let maxData = 100
      let seriesd = []
      let legend = []
      const len = data.length
      const width = this.$refs.chartGaugeBox?.offsetWidth || 0
      const chartHeight = this.$refs.chartGaugeBox?.offsetHeight || 0
      const rateW = width / chartHeight
      const rateH = chartHeight / width
      const rate = Math.min(rateW, rateH) < 0.65 ? 0.65 : Math.min(rateW, rateH)

      const obj = {
        1: [70, 60, 16],
        2: [60, 50, 15],
        3: [50, 40, 14],
        4: [45, 35, 13],
        5: [40, 30, 12],
        6: [30, 24, 11]
      }

      // 限制 len 在 1-6 范围内，防止 obj[len] 为 undefined
      const safelen = Math.min(Math.max(len, 1), 6)
      const rx = rate !== 0 ? obj[safelen][0] / rate : obj[safelen][0]
      const ry = rate !== 0 ? obj[safelen][1] / rate : obj[safelen][1]
      const r = rate !== 0 ? obj[safelen][2] / rate : obj[safelen][2]
      let radiusY = rateW > rateH ? 74 : 80
      let gridBottom = 100 - radiusY
      let titleBottom = 100 - radiusY + 2
      let bottom = 0
      let lineHeight = 20

      if (chartHeight < 160 && rateW > rateH) {
        radiusY = 70
        gridBottom = 100 - radiusY
        titleBottom = 100 - radiusY + 2
        bottom = 0
        lineHeight = 18
      }

      for (let j in data) {
        if (data[j]['name'] && legend.indexOf(data[j]['name']) === -1) {
          legend.push({
            icon: 'circle',
            name: data[j]['name']
          })
        }

        let ra = data.length - 1 - j
        seriesd.push({
          name: data[j]['name'],
          type: 'pie',
          radius: [ra * r + rx + '%', ry + ra * r + '%'],
          itemStyle: {
            normal: {
              label: {
                show: false
              }
            }
          },
          hoverAnimation: false,
          startAngle: 180,
          endAngle: 0,
          center: ['50%', radiusY + '%'],
          data: [
            {
              value: data[j]['value'],
              name: data[j]['name'],
              label: {
                normal: {
                  position: 'center'
                }
              },
              itemStyle: {
                normal: {
                  color: colors[j]
                }
              }
            },
            {
              value: maxData - data[j]['value'],
              itemStyle: {
                normal: {
                  color: 'rgba(203,203,203,0.5)'
                }
              },
              label: {
                show: false
              },
              labelLine: {
                show: false
              }
            }
          ]
        })
      }

      var initnum = parseFloat(seriesd[0].data[0]['value']).toFixed(2)
      seriesd.push({
        type: 'gauge',
        z: 3,
        min: 0,
        max: 100,
        splitNumber: 5,
        center: ['50%', '70%'],
        radius: '0%',
        endAngle: 0,
        startAngle: 180,
        axisLabel: {
          show: false,
          formatter: '{value}%'
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: [[1, 'rgba(203,203,203,1)']],
            width: 10
          }
        },
        axisTick: {
          show: false,
          length: 4,
          lineStyle: {
            color: 'auto'
          }
        },
        splitLine: {
          show: false
        },
        pointer: {
          show: false
        },
        title: {
          show: false
        },
        detail: {
          show: false
        },
        itemStyle: {
          normal: {
            color: '#676767'
          }
        },
        data: [
          {
            value: initnum
          }
        ]
      })

      const option = {
        maxnum: maxData,
        legend: {
          show: true,
          right: '2%',
          left: '2%',
          bottom: '1%',
          icon: 'circle',
          orient: 'horizontal',
          itemHeight: 10,
          itemWidth: 10,
          itemGap: 10,
          type: 'scroll',
          pageTextStyle: {
            color: fnColor
          },
          data: legend,
          formatter: name => {
            var currentItem = data.find(item => item.name === name)
            if (!currentItem) return null
            var value = currentItem.value
            value = Number(value).toFixed(2) + '%'
            name = name.length > 10 ? name.slice(0, 9) + '...' : name
            return `{a|${name}}\n{b|${value}}`
          },
          className: 'widget-tooltip widget-tooltip-' + this.theme,
          textStyle: {
            color: fnColor,
            padding: [0, 0, -22, 0],
            rich: {
              a: {
                padding: [10, 0, 0, 0],
                color: fnColor,
                lineHeight: lineHeight
              },
              b: {
                color: dataColor,
                fontWeight: 'bold',
                lineHeight: lineHeight
              }
            }
          }
        },
        tooltip: {
          show: true,
          formatter: function(params) {
            if (params.name == 'hide') {
              return null
            } else {
              let num = 0
              if (params.name.indexOf('showtip_') != -1) {
                num = Number(params.name.split('_')[1])
              } else {
                num = params.value
              }
              if (Number(num) == 0) {
                return params.seriesName + '：' + Number(num)
              }
              return params.seriesName + '：' + parseFloat(num * 100 / maxData).toFixed(2) + '%'
            }
          },
          borderColor: 'transparent'
        },
        grid: {
          left: -25,
          right: 0,
          bottom: gridBottom + '%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['A', 'B', 'C', 'D', 'E'],
          boundaryGap: true,
          position: '46',
          left: '-10',
          axisTick: {
            show: false
          },
          axisLabel: {
            show: false
          },
          axisLine: {
            lineStyle: {
              color: xBorderColor,
              width: 1
            }
          }
        },
        yAxis: {
          show: false,
          detail: {
            formatter: '{value}%'
          },
          data: [
            {
              value: 80,
              name: 'C'
            }
          ]
        },
        series: seriesd,
        color: colors
      }

      this.$nextTick(() => {
        this.instance = echarts.init(this.$refs.chartGauge, this.themeName, {
          devicePixelRatio: window.devicePixelRatio * 2
        })
        if (option) {
          this.instance.setOption(option)
        }
      })
    }
  }
}
</script>

<style lang="less" scoped>
.widgetBaseGaugeChart {
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