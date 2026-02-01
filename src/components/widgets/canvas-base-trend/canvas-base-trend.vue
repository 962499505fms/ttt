<template>
  <div class="widgetBaseLineChart" :style="{ height: height }">
    <div class="titleBar">
      <div class="nameBox">
        <slot name="title"></slot>
      </div>
      <div class="iconBox">
        <slot name="exc"></slot>
      </div>
    </div>
    <div :class="`chart-box chart-box-${legendPosition}`" v-show="hasData" :style="{ height: chartRealHeight }">
      <div :id="domId" class="chart" ref="chartWrapper" :style="{ height: chartRealHeight }"></div>
      <div class="instanceBox" :class="theme === 'white' ? 'white' : ''">
        <div v-for="item in instanceArr" :key="item.name" :title="item.name" @click="clickInstanceId(item, item.color)">
          <span class="colorSpan" :style="{ backgroundColor: currInstanceId == item.name || isFirst ? item.color : '#A4ACB9' }"></span>
          <span class="legendName">{{ truncateString(item.name) }}</span>
        </div>
      </div>
    </div>
    <div v-show="!hasData" class="noData">
      <h3>{{ $t('noData') }}</h3>
    </div>
  </div>
</template>

<script>
import I18n from '../common/locale/I18n.js'
import { calculateLeftMargin, getMaxLabelLength, hexToRgba, calculateYAxisRange, getRandomColorByStr } from '../common/utils.js'
import { themeConfig } from '../common/chartTheme'
import * as echarts from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, TitleComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import throttle from 'lodash/throttle'

echarts.use([LineChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent, CanvasRenderer])

export default {
  name: 'canvas-base-trend',
  i18n: I18n,
  props: {
    data: {
      type: Object,
      default: () => ({
        data: [],
        title: ''
      })
    },
    surfaceId: {
      type: String,
      default: ''
    },
    domId: {
      type: String,
      default: () => `${new Date().getTime()}`
    },
    theme: {
      type: String,
      default: 'white'
    },
    chartHeight: {
      type: Number,
      default: 0
    },
    resize: {
      type: Boolean,
      default: false
    },
    lang: {
      type: String,
      default: 'zh'
    },
    lineSingleData: {
      type: Object,
      default: () => ({
        x: [],
        y: []
      })
    }
  },
  data() {
    return {
      leftWidth: 0,
      chart: null,
      currInstanceId: null,
      isFirst: true,
      themeName: null,
      debouncedChart: null
    }
  },
  computed: {
    widgetData() {
      try {
        return JSON.parse(this.data)
      } catch (e) {
        return { data: [] }
      }
    },
    colorList() {
      return getRandomColorByStr(this.surfaceId, this.y.length || 1, true)
    },
    x() {
      if (!this.widgetData.data || this.widgetData.data.length === 0) return []
      return [...new Set(this.widgetData.data.map(item => item.time))]
    },
    y() {
      if (!this.widgetData?.data || this.widgetData.data.length === 0) return []
      const groupedData = {}
      this.widgetData.data.forEach(item => {
        if (!groupedData[item.name]) {
          groupedData[item.name] = {
            name: item.name,
            values: []
          }
        }
        groupedData[item.name].values.push(item.value)
      })
      return Object.values(groupedData)
    },
    unit() {
      return this.widgetData?.unit || ''
    },
    chartColorStyle() {
      let themeId = this.theme
      return {
        lineColor: themeId === 'white' ? '#E8E8E7' : 'rgba(49,82,128,0.5)',
        lineBgColor: themeId === 'white' ? '#E8E8E7' : 'rgba(49,82,128,0.5)',
        labelColor: themeId === 'white' ? '#333333' : '#9FA8B5',
        tipBackgroundColor: themeId === 'white' ? '#fff' : '#1B3151',
        tipColor: themeId === 'white' ? '#1B3151' : '#ffffff',
        pageIconColor: themeId === 'white' ? '#919191' : '#fff',
        minAreaColor: themeId === 'white' ? '#fff' : 'rgba(16,43,76,0.1)'
      }
    },
    hasData() {
      return Boolean(this.widgetData?.data && this.widgetData.data.length > 0)
    },
    themeConfig() {
      return themeConfig[this.theme]
    },
    height() {
      return this.chartHeight ? this.chartHeight + 'px' : '100%'
    },
    instanceArr() {
      const list = this.y.map((item, index) => ({
        name: item.name,
        color: this.colorList[index]
      }))
      return list
    },
    legendPosition() {
      const arr = this.instanceArr
      if (arr && arr.length > 5) {
        return 'right'
      } else if (arr && arr.length > 1) {
        return 'bottom'
      } else {
        return 'none'
      }
    },
    chartRealHeight() {
      if (this.legendPosition === 'right' || this.legendPosition === 'none') {
        return this.chartHeight ? this.chartHeight + 'px' : '100%'
      } else {
        return this.chartHeight ? this.chartHeight - 30 + 'px' : '100%'
      }
    }
  },
  created() {
    this.debouncedChart && this.debouncedChart.cancel()
    if (!this.debouncedChart) {
      this.debouncedChart = throttle(this.setChart, 300)
    }
  },
  mounted() {
    // 初始化图表
    this.$nextTick(() => {
      if (this.hasData && this.$refs.chartWrapper) {
        this.debouncedChart && this.debouncedChart(this.x, this.y)
      }
    })
  },
  beforeDestroy() {
    this.chart && this.chart.dispose()
    this.chart = null
    this.destroyChart()
    this.debouncedChart && this.debouncedChart.cancel()
  },
  watch: {
    widgetData: {
      handler(val) {
        if (val) {
          this.debouncedChart && this.debouncedChart.cancel()
          if (!this.debouncedChart) {
            this.debouncedChart = throttle(this.setChart, 300)
          }
          this.$nextTick(() => {
            val.data.length && this.debouncedChart && this.debouncedChart(this.x, this.y)
            this.isFirst = true
          })
        }
      },
      deep: true,
      immediate: true
    },
    chartRealHeight: {
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
              this.debouncedChart(this.x, this.y)
            })
          }
        } catch (e) {
          console.error('charttheme parse error', e)
        }
      },
      immediate: true
    },
    resize() {
      this.resizeChart()
    },
    lineSingleData: {
      handler(val) {
        const { y, x, unit, color } = val
        if (y && y.length > 0 && x && x.length > 0) {
          const convertedData = y.map((series, index) => ({
            name: series.name,
            values: series.values
          }))
          this.debouncedChart(x, convertedData, unit, color)
          this.currInstanceId = y[0].name
          this.isFirst = false
        }
      },
      deep: true
    }
  },
  methods: {
    resizeChart() {
      this.$nextTick(() => {
        this.chart && this.chart.resize('auto', 'auto')
      })
    },
    destroyChart() {
      if (this.chart) {
        const tooltips = document.querySelectorAll('.echarts-tooltip')
        tooltips.forEach(tooltip => {
          if (tooltip.parentNode) {
            tooltip.parentNode.removeChild(tooltip)
          }
        })
        echarts.dispose(this.chart)
        this.chart = null
      }
    },
    setChart(x, y, unit, color) {
      if (!this.$refs.chartWrapper || this.widgetData?.data?.length === 0) return
      this.chart && this.chart.dispose()
      const theme = this.themeName || 'light'
      this.chart = echarts.init(this.$refs.chartWrapper, theme, {
        renderer: 'canvas',
        devicePixelRatio: window.devicePixelRatio * 2
      })
      const options = this.getOption(x, y, unit, color)
      this.chart.setOption(options, true)
      const splitNumber = this.getDynamicYAxisOption(this.chartHeight)
      this.resizeChart()
    },
    getOption(x, y, unit = '', color) {
      let xAxis = x
      let data = y
      if (data.length > 0 && xAxis.length > 0) {
        data = data.map(series => {
          const newValues = xAxis.map(time => {
            const dataPoint = this.widgetData.data.find(item => item.name === series.name && item.time === time)
            return dataPoint ? dataPoint.value : null
          })
          return { ...series, values: newValues }
        })
      }
      if (data.length > 10) {
        let lastValues = data.map((item, index) => ({
          name: item.name,
          lastValue: item.values[item.values.length - 1],
          values: item.values,
          color: this.colorList[index]
        }))
        lastValues.sort((a, b) => b.lastValue - a.lastValue)
        data = lastValues.slice(0, 10)
      }
      let showUnit = this.unit ? true : false
      if (!xAxis || !data) return
      let chartUnit = data[0].unit || this.unit
      let { lineColor, lineBgColor, labelColor, tipBackgroundColor, tipColor, pageIconColor, minAreaColor } = this.chartColorStyle
      const fnColor = this.themeConfig.fnColor
      let isTimeLine = false
      let timeList = []
      try {
        xAxis.forEach(el => {
          let time = new Date(el).getTime()
          if (time) {
            isTimeLine = true
            timeList.push(time)
          }
        })
      } catch (error) {
        console.log(error)
      }
      const labelLengthList = []
      let invalidDigitList = []
      data.forEach(element => {
        const labelLength = getMaxLabelLength(element.values)
        labelLengthList.push(labelLength)
        const invalidDigits = element.values.every(item => item === '-' || item === null || isNaN(item))
        invalidDigitList.push(invalidDigits)
      })
      let invalidDigits = invalidDigitList.every(el => el)
      unit = chartUnit || this.unit || ''
      let max = Math.max(...labelLengthList)
      max = max + unit.length
      this.leftWidth = calculateLeftMargin(max, 40, 20)
      const isMaxmin = data.some(item => item.type === 'max' || item.type === 'min')
      const length = data.length
      const splitNumber = this.getDynamicYAxisOption(this.chartHeight)
      // 转换数据格式以匹配 calculateYAxisRange 期望的结构 (values -> data)
      const seriesDataForRange = data.map(item => ({
        ...item,
        data: item.values
      }))
      const { min: minValue, max: maxValue, interval } = calculateYAxisRange(seriesDataForRange, data.length <= 1, splitNumber)
      let rightBoxWidth = 0
      if (this.legendPosition === 'right') {
        rightBoxWidth = 100
      }
      const options = {
        animation: false,
        grid: {
          containLabel: true,
          top: '10',
          left: this.leftWidth,
          right: '20',
          bottom: 0
        },
        legend: {
          show: false,
          type: 'scroll',
          icon: 'circle',
          bottom: 0,
          itemHeight: 10,
          itemWidth: 10,
          textStyle: {
            color: fnColor
          },
          itemStyle: {},
          pageTextStyle: {
            color: this.lowerAlpha(labelColor, 0.01)
          },
          pageButtonItemGap: -11,
          formatter: name => {
            return echarts.format.truncateText(name, 120, '14px Microsoft Yahei', '...')
          }
        },
        tooltip: {
          className: 'echarts-tooltip-scrollbar',
          show: true,
          trigger: 'axis',
          confine: true,
          formatter: params => {
            let dataStr = params.map((item, index) => {
              let value = item.value
              if (isTimeLine) value = value[1]
              let valueStr = showUnit ? this.formatMaxUnitValue(item.seriesName, item.dataIndex) : `${this.formatData(value, unit)}`
              const tipValue = this.getTipData(item.seriesName, item.dataIndex)
              // 修复：移除重复的 seriesName 显示
              return `<div><span>${item.marker}</span><span>${item.seriesName}${this.$t('maohao')}${tipValue || valueStr}</span></div>`
            }).join('')
            let title = isTimeLine ? params[0].axisValueLabel : `<div>${params[0].name}</div>`
            return `<div style="word-wrap:break-all">${title}${dataStr}</div>`
          },
          backgroundColor: tipBackgroundColor,
          borderColor: tipBackgroundColor,
          textStyle: {
            color: tipColor
          },
          enterable: true,
          extraCssText: `max-height:200px;max-width:calc(100% + ${rightBoxWidth}px);overflow-y:auto;overflow-x:auto;`
        },
        xAxis: isTimeLine ? {
          type: 'time',
          boundaryGap: false,
          data: xAxis,
          axisTick: {
            show: false,
            alignWithLabel: true
          },
          axisLine: {
            lineStyle: {
              color: lineColor
            }
          },
          axisLabel: {
            color: fnColor,
            formatter: '{yyyy}-{MM}-{dd}\n{HH}:{mm}:{ss}',
            showMinLabel: true,
            showMaxLabel: false,
            hideOverlap: true
          }
        } : {
          type: 'category',
          data: xAxis,
          boundaryGap: false,
          axisTick: {
            show: false,
            alignWithLabel: true
          },
          axisLine: {
            lineStyle: {
              color: lineColor
            }
          },
          axisLabel: {
            color: fnColor,
            align: 'center',
            formatter: (value, index) => {
              if (options.xAxis.data.length == 1 && index === options.xAxis.data.length - 1) {
                return ''
              }
              return value.replace(' ', '\n')
            }
          }
        },
        yAxis: {
          type: 'value',
          splitNumber: splitNumber,
          max: invalidDigits ? 1 : maxValue,
          min: invalidDigits ? 0 : minValue,
          splitLine: {
            lineStyle: {
              color: lineBgColor
            }
          },
          axisLabel: {
            color: fnColor,
            formatter: value => {
              return `${value}${unit || ''}`
            }
          },
          nameTextStyle: {
            color: labelColor
          }
        },
        progressive: 500,
        progressiveThreshold: 1000,
        series: data.map((v, index) => {
          let isShowSymbol = true
          let valueList = v.values.filter(item => item || item === 0)
          if (v.values.length > 1 && valueList.length == v.values.length) {
            isShowSymbol = false
          }
          let itemColor = color || v.color || this.colorList[index]
          const indexColor = color || v.color || this.colorList[index]
          let areaStyle = { opacity: 0.1 }
          if (length <= 3 || isMaxmin || color) {
            const color1 = hexToRgba(indexColor, 0.1)
            const color0 = hexToRgba(indexColor, 0.4)
            areaStyle = {
              color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                { offset: 0, color: color0 },
                { offset: 1, color: color1 }
              ])
            }
            itemColor = new echarts.graphic.LinearGradient(1, 0, 0, 0, [
              { offset: 0, color: hexToRgba(itemColor, 1) },
              { offset: 1, color: hexToRgba(itemColor, 0.2) }
            ])
          }
          return {
            name: v.name,
            data: isTimeLine ? v.values.map((item, index) => [timeList[index], item]) : v.values,
            type: 'line',
            smooth: true,
            showSymbol: isShowSymbol,
            symbol: 'circle',
            symbolSize: 4,
            itemStyle: {
              color: itemColor,
              lineStyle: {
                width: 1
              }
            },
            z: v.type === 'min' ? 3 : 1,
            areaStyle,
            connectNulls: true,
            large: true,
            largeThreshold: 500,
            sampling: 'lttb'
          }
        })
      }
      return options
    },
    formatMaxUnitValue(name, index) {
      const time = this.x[index]
      const dataPoint = this.widgetData.data.find(item => item.name === name && item.time === time)
      if (!dataPoint) return
      const value = this.formatData(dataPoint.value)
      return dataPoint.value || dataPoint.value === 0 ? `${value}${this.unit}` : ''
    },
    getTipData(name, index) {
      return ''
    },
    formatLabel(name) {
      return name ? `${name}${this.$t('maohao')}` : ''
    },
    lowerAlpha(color, alphaLevel) {
      if (color.charAt(0) !== '#') {
        color = '#' + color
      }
      if (color.length === 4) {
        color = '#' + color.charAt(1) + color.charAt(1) + color.charAt(2) + color.charAt(2) + color.charAt(3) + color.charAt(3)
      }
      var r = parseInt(color.substring(1, 3), 16)
      var g = parseInt(color.substring(3, 5), 16)
      var b = parseInt(color.substring(5, 7), 16)
      var a = parseInt(color.substring(7), 16) || 255
      var newAlpha = Math.round(a * alphaLevel)
      var newAlphaHex = ('0' + newAlpha.toString(16).toUpperCase()).slice(-2)
      var newColor = '#' + r.toString(16).toUpperCase().padStart(2, '0') + g.toString(16).toUpperCase().padStart(2, '0') + b.toString(16).toUpperCase().padStart(2, '0') + newAlphaHex
      return newColor
    },
    formatData(data, unit, num) {
      unit = unit || ''
      if (!data && data != 0) return '-'
      if (data === '-') return '-'
      if (data || data === 0) {
        return (Math.round(Number(data) * 10 ** (num ?? 2)) / 10 ** (num ?? 2)).toFixed(num ?? 2) + unit
      }
      return '-'
    },
    clickInstanceId(row, color) {
      if (this.currInstanceId === row.name) {
        this.debouncedChart(this.x, this.y)
        this.currInstanceId = ''
        this.isFirst = true
        return
      }
      const y = this.y.filter(item => item.name === row.name)
      if (y[0].values.length === 0) {
        this.$emit('on-change', row.name, color)
        return
      }
      y[0].color = color
      this.debouncedChart(this.x, y, '', color)
      this.currInstanceId = row.name
      this.isFirst = false
    },
    getDynamicYAxisOption(containerHeight) {
      const fontSize = 14
      const lineHeight = 2
      const padding = 20
      let maxVisibleLabels = Math.floor((containerHeight - padding) / (fontSize * lineHeight))
      maxVisibleLabels = maxVisibleLabels < 1 ? 3 : maxVisibleLabels
      return maxVisibleLabels > 5 ? 5 : maxVisibleLabels
    },
    truncateString(str) {
      if (!str) return str
      const MAX_DISPLAY_WIDTH = this.legendPosition == 'right' ? 117 : 0
      let totalWidth = 0
      for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i)
        const charWidth = code > 255 ? 2 : 1
        if (totalWidth + charWidth > MAX_DISPLAY_WIDTH) {
          return str.slice(0, i) + '...'
        }
        totalWidth += charWidth
      }
      return str
    }
  }
}
</script>

<style scoped lang="less">
.widgetBaseLineChart {
  position: relative;
  height: 100%;
}
.chart {
  width: 100%;
  height: 100%;
}
.titleBar {
  display: flex;
  justify-content: space-between;
}
.chart-box {
  height: calc(100% - 30px);
  width: 100%;
  display: flex;
  .chart {
    width: 100%;
  }
}
.instanceBox {
  width: 160px;
  height: calc(100% - 26px);
  padding-left: 5px;
  box-sizing: border-box;
  overflow-y: auto;
  & > div {
    cursor: pointer;
    font-size: 12px;
    padding: 3px 0px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    padding-right: 8px;
    .colorSpan {
      display: inline-block;
      height: 8px;
      width: 8px;
      border-radius: 50%;
    }
    .legendName {
      padding-left: 8px;
    }
  }
  &::-webkit-scrollbar {
    width: 12px !important;
    height: 12px !important;
  }
  &::-webkit-scrollbar-corner {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    border-radius: 5px;
    border: 3px solid transparent;
    -webkit-box-shadow: inset 8px 10000px 8px #516984;
    box-shadow: inset 8px 10000px 8px #516984;
  }
  &::-webkit-scrollbar-track {
    border-radius: 5px;
    background-color: transparent;
  }
  &.white {
    &::-webkit-scrollbar-thumb {
      border-radius: 5px;
      border: 3px solid transparent;
      -webkit-box-shadow: inset 8px 10000px 8px #b3b3b3;
      box-shadow: inset 8px 10000px 8px #b3b3b3;
    }
  }
}
.chart-box-none {
  height: calc(100% - 30px);
  width: 100%;
  display: inline-block;
  .instanceBox {
    display: none;
  }
}
.chart-box-bottom {
  height: calc(100% - 30px);
  width: 100%;
  display: inline-block;
  .chart {
    width: 100%;
  }
  .instanceBox {
    width: 100%;
    height: 30px;
    padding-left: 20px;
    margin-bottom: 0px;
    box-sizing: border-box;
    overflow-y: hidden;
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    & > div {
      cursor: pointer;
      font-size: 12px;
      padding: 3px 0px;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      padding-right: 8px;
      width: 90px;
      min-width: 90px;
      .colorSpan {
        display: inline-block;
        height: 8px;
        width: 8px;
        border-radius: 50%;
      }
      .legendName {
        padding-left: 8px;
      }
    }
    &::-webkit-scrollbar {
      width: 12px !important;
      height: 12px !important;
    }
    &::-webkit-scrollbar-corner {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      border-radius: 5px;
      -webkit-box-shadow: inset 8px 10000px 8px #516984;
      box-shadow: inset 8px 10000px 8px #516984;
    }
    &::-webkit-scrollbar-track {
      -webkit-box-shadow: inset 0 0 5px rgba(0, 0, 0, 0.2);
      border-radius: 5px;
      background-color: transparent;
    }
    &.white {
      &::-webkit-scrollbar-thumb {
        border-radius: 5px;
        border: 3px solid transparent;
        -webkit-box-shadow: inset 8px 10000px 8px #b3b3b3;
        box-shadow: inset 8px 10000px 8px #b3b3b3;
      }
    }
  }
}
.noData {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>