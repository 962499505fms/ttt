<template>
  <div class="timeline-overlay" v-if="timelineElements.length > 0">
    <!-- Row -->
    <div
      v-for="(element, index) in timelineElements"
      :key="index"
      class="timeline-row"
    >
      <!-- Circle -->
      <div
        class="timeline-circle"
        :class="{ collapsed: element.collapsed }"
        :style="{
          top: element.circleTop + 'px',
          left: element.circleLeft + 'px'
        }"
        @click="handleCircleClick(element.rowId)"
      >
        <span
          class="arrow"
          :class="element.collapsed ? 'arrow-up' : 'arrow-down'"
        ></span>
      </div>
      
      <!-- Line -->
      <div v-if="element.lineHeight > 0" class="timeline-line" :style="{
        top: element.lineTop + 'px',
        left: element.lineLeft + 'px',
        height: element.lineHeight + 'px'
      }">
        <div v-if="element.showEndCircle" class="end-circle"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    rows: {
      type: Array,
      default: () => []
    },
    rowHeight: {
      type: Number,
      default: 30
    },
    margin: {
      type: Array,
      default: () => [8, 8]
    },
    timelinePadding: {
      type: Number,
      default: 20
    }
  },
  
  computed: {
    timelineElements() {
      if (!this.rows || this.rows.length === 0) return []
      
      const elements = []
      const circleSize = 16
      const lineWidth = 2
      const circleCenterX = this.timelinePadding / 2
      const circleLeft = circleCenterX - circleSize / 2
      const lineLeft = circleCenterX - lineWidth / 2
      
      for (let i = 0; i < this.rows.length; i++) {
        const row = this.rows[i]
        const isLast = i === this.rows.length - 1
        const nextRow = this.rows[i + 1]
        const headerHeight = this.rowHeight + this.margin[1]
        const circleTop = row.y * headerHeight + headerHeight - circleSize / 2
        const lineTop = circleTop + circleSize
        let lineHeight = 0
        let showEndCircle = false
        
        if (nextRow) {
          const nextCircleTop = nextRow.y * headerHeight + headerHeight - circleSize / 2
          lineHeight = nextCircleTop - lineTop
        } else {
          if (!row.collapsed && row.panelCount > 0) {
            lineHeight = 30
            showEndCircle = true
          } else if (!row.collapsed) {
            lineHeight = 30
            showEndCircle = true
          }
        }
        
        elements.push({
          rowId: row.id,
          circleTop,
          circleLeft,
          lineTop,
          lineLeft,
          lineHeight,
          collapsed: row.collapsed,
          showEndCircle
        })
      }
      
      return elements
    }
  },
  
  methods: {
    /**
     * @param {string} rowId - 行ID
     */
    handleCircleClick(rowId) {
      this.$emit('toggle-row', rowId)
    }
  }
}
</script>

<style lang="less" scoped>
@timeline-primary-color: #1890ff;
@timeline-collapsed-color: #8c8c8c;
@timeline-end-circle-color: #8c8c8c;
@timeline-line-width: 2px;
@timeline-circle-size: 16px;
@timeline-end-circle-size: 6px;
@timeline-arrow-size: 4px;

.timeline-overlay {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 20px;
  pointer-events: none;
  z-index: 10;
}

.timeline-row {
  position: relative;
}

.timeline-circle {
  position: absolute;
  width: @timeline-circle-size;
  height: @timeline-circle-size;
  border-radius: 50%;
  border: @timeline-line-width solid @timeline-primary-color;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  pointer-events: auto;
  cursor: pointer;
  z-index: 2;
  
  &:hover {
    border-color: @timeline-primary-color;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
  
  &.collapsed {
    border-color: @timeline-collapsed-color;
    background: #f5f5f5;
    
    .arrow {
      border-color: @timeline-collapsed-color;
    }
  }
}

.arrow {
  width: @timeline-arrow-size;
  height: @timeline-arrow-size;
  border-right: 1.5px solid @timeline-primary-color;
  border-bottom: 1.5px solid @timeline-primary-color;
  transition: transform 0.3s ease;
  
  &.arrow-down {
    transform: rotate(45deg) translateY(-1px);
  }
  
  &.arrow-up {
    transform: rotate(-135deg) translateY(-1px);
  }
}

.timeline-line {
  position: absolute;
  width: @timeline-line-width;
  background: @timeline-primary-color;
  z-index: 1;
}

.end-circle {
  position: absolute;
  bottom: -(@timeline-end-circle-size / 2);
  left: 50%;
  transform: translateX(-50%);
  width: @timeline-end-circle-size;
  height: @timeline-end-circle-size;
  border-radius: 50%;
  background: @timeline-end-circle-color;
}
</style>