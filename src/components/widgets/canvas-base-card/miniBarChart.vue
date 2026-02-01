<template>
  <div ref="container" class="mini-bar-chart">
    <svg :viewBox="`0 0 ${svgWidth} ${svgHeight}`" width="100%" height="100%" preserveAspectRatio="none">
      <!-- <line x1="0" :x2="svgWidth" :y1="zeroY" :y2="zeroY" stroke="#e4e7ed" stroke-width="1" /> -->
      <g v-for="(item, idx) in normalizedData" :key="idx">
        <rect
          :x="(fillDigits + idx) * (barWidth + gap)"
          :y="item.y"
          :width="barWidth"
          :height="item.height"
          :fill="idx === data.length - 1 ? barColor : grayColor"
          rx="2"
        />
      </g>
    </svg>
  </div>
</template>

<script>
export default {
  name: 'MiniBarChart',
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
    gap: {
      type: Number,
      default: 4
    },
    svgHeight: {
      type: Number,
      default: 32
    }
  },
  data() {
    return {
      svgWidth: 90,
      ro: null
    }
  },
  computed: {
    fillDigits() {
      return Math.max(7 - this.data.length, 0)
    },
    barWidth() {
      const length = 7
      if (!Array.isArray(this.data) || length === 0) return 0
      return (this.svgWidth - (length - 1) * this.gap) / length
    },
    zeroY() {
      const nums = this.data.map(d => Number(d))
      const max = Math.max(...nums, 0)
      const min = Math.min(...nums, 0)
      if (min >= 0) return this.svgHeight - 2
      if (max <= 0) return 2
      const total = max - min
      return 2 + (max / total) * (this.svgHeight - 4)
    },
    normalizedData() {
      if (!Array.isArray(this.data) || this.data.length === 0) return []
      const nums = this.data.map(d => Number(d))
      const max = Math.max(...nums, 0)
      const min = Math.min(...nums, 0)
      const total = max - min || 1
      const chartHeight = this.svgHeight - 4
      const zeroY = this.zeroY
      return nums.map(v => {
        if (v >= 0) {
          const height = Math.abs(v) / total * chartHeight
          return {
            y: zeroY - height,
            height: height
          }
        } else {
          const height = (Math.abs(v) / total) * chartHeight
          return {
            y: zeroY,
            height: height
          }
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
  },
  methods: {
    resize() {
      this.$nextTick(() => {
        if (this.$refs.container && this.$refs.container.clientWidth) {
          this.svgWidth = this.$refs.container.clientWidth
        }
      })
    }
  }
}
</script>

<style scoped>
.mini-bar-chart {
  width: 100%;
  height: 100%;
  display: inline-block;
}
svg {
  display: block;
  width: 100%;
  height: 100%;
}
</style>