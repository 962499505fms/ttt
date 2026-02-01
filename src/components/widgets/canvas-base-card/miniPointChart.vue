<template>
  <div ref="container" class="mini-point-chart">
    <svg :viewBox="`0 0 ${svgWidth} ${containerHeight}`" :width="svgWidth" :height="containerHeight" style="display: block" preserveAspectRatio="xMinYMin meet">
      <g v-for="(ch, idx) in displayData" :key="idx">
        <circle
          :cx="circleX(idx)"
          :cy="circleY(idx)"
          :r="circleRadius"
          :fill="idx === displayData.length - 1 ? barColor : grayColor"
        />
      </g>
    </svg>
  </div>
</template>

<script>
export default {
  name: 'MiniPointChart',
  props: {
    data: {
      type: Array,
      default: () => []
    },
    barColor: {
      type: String,
      default: '#409EFF'
    },
    grayColor: {
      type: String,
      default: '#C0C4CC'
    },
    minGap: {
      type: Number,
      default: 2
    },
    minRadius: {
      type: Number,
      default: 1
    },
    maxRadius: {
      type: Number,
      default: 8
    }
  },
  data() {
    return {
      svgWidth: 90,
      containerHeight: 32,
      ro: null
    }
  },
  computed: {
    displayData() {
      if (!Array.isArray(this.data)) return []
      return this.data.slice(0, 7)
    },
    valueToYMap() {
      if (!this.displayData.length) return {}
      const unique = Array.from(new Set(this.displayData))
      let map = {}
      const padding = 0
      const availableHeight = this.containerHeight - 2 * padding
      if (unique.length === 1) {
        map[unique[0]] = this.containerHeight / 2
      } else {
        unique.forEach((val, i) => {
          const pos = padding + (availableHeight * i) / (unique.length - 1)
          map[val] = pos
        })
      }
      return map
    },
    circleRadius() {
      const n = 7
      if (n === 0) return this.maxRadius
      if (this.svgWidth === 0) return this.minRadius
      const maxR = (this.svgWidth - (n - 1) * this.minGap) / (2 * n)
      return Math.max(this.minRadius, Math.min(this.maxRadius, maxR))
    },
    circleGap() {
      const n = 7
      if (n <= 1) return 0
      const gap = (this.svgWidth - 2 * this.circleRadius * n) / (n - 1)
      return Math.max(this.minGap, gap)
    },
    fillDigits() {
      return Math.max(7 - this.data.length, 0)
    }
  },
  methods: {
    circleX(idx) {
      return this.circleRadius + (this.fillDigits + idx) * (2 * this.circleRadius + this.circleGap)
    },
    circleY(idx) {
      const val = this.displayData[idx]
      return this.valueToYMap[val]
    },
    resize() {
      this.$nextTick(() => {
        if (this.$refs.container) {
          this.svgWidth = this.$refs.container.clientWidth
          this.containerHeight = this.$refs.container.clientHeight
        }
      })
    }
  },
  mounted() {
    this.$nextTick(() => {
      if (this.$refs.container) {
        this.resize()
        this.ro = new ResizeObserver(this.resize)
        this.ro.observe(this.$refs.container)
      }
    })
  },
  beforeDestroy() {
    if (this.ro && this.$refs.container) {
      this.ro.unobserve(this.$refs.container)
      this.ro.disconnect()
    }
  }
}
</script>

<style scoped>
.mini-point-chart {
  width: 100%;
  height: 100%;
  display: inline-block;
  overflow: hidden;
  min-height: 32px;
}
svg {
  display: block;
  width: 100%;
  height: 100%;
}
</style>