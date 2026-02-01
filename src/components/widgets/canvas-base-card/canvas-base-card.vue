<template>
  <div class="widgetBaseCard" :style="{ height: height + 'px' }" @scroll="onScroll" ref="scrollContainer" :class="theme === 'white' ? 'white' : ''">
    <template v-if="!noData">
      <div :class="`card-wrapper ${theme}`" ref="cardBox" v-for="(item, i) in visibleItems" :key="item.name" :style="cardStyle">
        <div class="card-box" :style="{ borderColor: item.alarmColor ? item.alarmColor.color : defaultColor, fontSize: fnSize }">
          <div class="card-left">
            <div class="card-title">
              <div class="left" :style="{ color: themeConfig['dataColor'] }" :title="item.name">{{ item.name }}</div>
            </div>
            <div class="card-content" :style="{ color: item.alarmColor ? item.alarmColor.color : fnColor[theme] }">
              <div class="value" :title="`${item.value}${item.unit ? item.unit : ''}`">
                {{ item.value }}{{ item.unit ? item.unit : '' }}
              </div>
            </div>
          </div>
          <mini-bar-chart v-if="type == 'bar'" class="card-right" :barColor="item.alarmColor ? item.alarmColor.color : defaultColor" :data="miniChartData[i]" />
          <mini-point-chart v-if="type == 'dot'" class="card-right" :barColor="item.alarmColor ? item.alarmColor.color : defaultColor" :data="miniChartData[i]" />
        </div>
      </div>
    </template>
    <div v-if="noData" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center">
      <h3>{{ $t('noData') }}</h3>
    </div>
  </div>
</template>

<script>
import { themeConfig } from '../common/chartTheme'
import MiniBarChart from './miniBarChart.vue'
import MiniPointChart from './miniPointChart.vue'

export default {
  name: 'canvas-base-card',
  components: {
    MiniBarChart,
    MiniPointChart
  },
  props: ['data', 'resize', 'theme', 'lang', 'config', 'resobj', 'chart-height', 'chart-width', 'flex-num'],
  computed: {
    widgetData() {
      try {
        return JSON.parse(this.data)
      } catch (e) {
        return {}
      }
    },
    type() {
      return this.widgetData?.type || ''
    },
    themeConfig() {
      return themeConfig[this.theme]
    },
    height() {
      return this.chartHeight + 'px'
    },
    cardStyle() {
      const flexNum = Number(this.flexNum) || 3
      const width = (100 / flexNum).toFixed(1) + '%'
      return {
        boxSizing: 'border-box',
        flex: `0 0 calc(${width} - 10px)`
      }
    },
    fnSize() {
      const fontSize = this.elementSize.height ? (this.elementSize.height / 8 < 10 ? 10 : Math.floor(this.elementSize.height / 8)) : 12
      return fontSize + 'px'
    },
    miniChartData() {
      return this.widgetData?.miniChartData || []
    }
  },
  data() {
    return {
      noData: false,
      cardList: [],
      visibleItems: [],
      itemsPerPage: 20,
      currentPage: 0,
      defaultColor: '#3b81ff',
      elementSize: {
        width: 0,
        height: 0
      },
      fnColor: {
        white: '#333',
        star: '#fff'
      },
      loadTimer: null
    }
  },
  mounted() {
    if (this.widgetData) {
      this.initData(this.widgetData)
    }
  },
  beforeDestroy() {
    if (this.loadTimer) {
      clearTimeout(this.loadTimer)
      this.loadTimer = null
    }
  },
  watch: {
    widgetData: {
      handler(val) {
        if (val) {
          this.initData(val)
          this.$nextTick(() => {
            this.updateElementSize()
          })
        }
      },
      immediate: true,
      deep: true
    },
    resize() {
      this.$nextTick(() => {
        this.updateElementSize()
        this.checkAndLoadMore()
      })
    }
  },
  methods: {
    initData({ data, unit: globalUnit }) {
      if (!data || data.length === 0) {
        this.noData = true
        return
      }
      this.noData = false
      this.cardList = []
      this.currentPage = 0
      this.visibleItems = []
      data.map(item => {
        const { value } = item
        const unit = value === 0 || value ? globalUnit : ''
        this.cardList.push({ ...item, unit })
      })
      this.loadMoreItems()
      if (this.loadTimer) {
        clearTimeout(this.loadTimer)
      }
      this.$nextTick(() => {
        this.loadTimer = setTimeout(() => {
          this.checkAndLoadMore()
        }, 100)
      })
    },
    onScroll() {
      const container = this.$refs.scrollContainer
      const threshold = 50
      if (container.scrollTop + container.clientHeight >= container.scrollHeight - threshold) {
        this.loadMoreItems()
      }
    },
    loadMoreItems() {
      if (this.visibleItems.length >= this.cardList.length) {
        return
      }
      const start = this.currentPage * this.itemsPerPage
      const end = start + this.itemsPerPage
      const newItems = this.cardList.slice(start, end)
      if (newItems.length > 0) {
        this.visibleItems = this.visibleItems.concat(newItems)
        this.currentPage++
      }
    },
    updateElementSize() {
      this.$nextTick(() => {
        const el = this.$refs.cardBox?.[0]
        if (el) {
          this.elementSize = {
            width: el.offsetWidth,
            height: el.offsetHeight
          }
        }
        this.checkAndLoadMore()
      })
    },
    checkAndLoadMore() {
      const container = this.$refs.scrollContainer
      if (!container) return
      if (container.scrollHeight <= container.clientHeight && this.visibleItems.length < this.cardList.length) {
        this.loadMoreItems()
      }
      if (this.loadTimer) {
        clearTimeout(this.loadTimer)
      }
      this.$nextTick(() => {
        this.loadTimer = setTimeout(() => {
          this.checkAndLoadMore()
        }, 50)
      })
    }
  }
}
</script>

<style lang="less" scoped>
.widgetBaseCard {
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-content: flex-start;
  overflow-y: auto;
  gap: 10px;
  margin-top: 5px;
  padding-bottom: 5px;
  .card-wrapper {
    flex: 1 1 auto;
    min-width: 110px;
    min-height: 60px;
    max-height: 100px;
    aspect-ratio: 2/1;
  }
  .card-wrapper.star {
    background: #102b4c;
  }
  .card-box {
    border: none;
    box-shadow: 0 1px 10px -2px rgba(0, 0, 0, 0.18), -0.6px 0.6px 3.5px -1.2px rgba(20, 20, 20, 0.2),
      0.6px 0.6px 3.5px -1.2px rgba(20, 20, 20, 0.2), 0 1.5px 2.2px -0.8px rgba(0, 60, 60, 0.1), 0 0.8px 1px rgba(0, 0, 0, 0.03);
    box-sizing: border-box;
    height: 100%;
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 1%;
    padding: 2px 4%;
  }
  .card-left {
    width: 60%;
    height: 80%;
    display: flex;
    flex-direction: column;
  }
  .card-right {
    width: 32%;
    height: 60%;
  }
  .card-title {
    height: 20px;
    .left {
      font-size: 1em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  .card-content {
    height: calc(100% - 20px);
    display: flex;
    align-items: center;
    .value {
      width: 100%;
      font-size: 1.5em;
      font-weight: bold;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  /deep/ .ivu-progress-text {
    font-size: 1.4em;
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
</style>