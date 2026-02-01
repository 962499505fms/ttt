<template>
  <div class="canvas-base-diff" :class="theme">
    <!-- 头部：显示模式切换 -->
    <div class="diff-header">
      <div class="display-mode">
        <p-radio-group v-model="displayMode">
          <p-radio label="all">{{ $t('showAll') || '显示所有内容' }}</p-radio>
          <p-radio label="diff">{{ $t('showDiff') || '显示差异内容' }}</p-radio>
        </p-radio-group>
      </div>
    </div>

    <!-- 主体：双栏对比 -->
    <div class="diff-body">
      <!-- 左侧面板 -->
      <div class="diff-panel left-panel">
        <div class="panel-header">
          <div class="file-info">
            <div class="info-row">
              <span class="label">{{ $t('fileName') || '文件名称' }}：</span>
              <span class="value" :title="leftFile.name">{{ leftFile.name || '--' }}</span>
            </div>
            <div class="info-row">
              <span class="label">{{ $t('backupTime') || '备份时间' }}：</span>
              <span class="value">{{ leftFile.backupTime || '--' }}</span>
            </div>
            <div class="info-row">
              <span class="label">{{ $t('encoding') || '字符编码' }}：</span>
              <p-select class="encoding-select" v-model="leftEncoding">
                <p-option v-for="enc in encodingOptions" :key="enc" :value="enc">{{ enc }}</p-option>
              </p-select>
            </div>
          </div>
        </div>
        <div class="panel-content" ref="leftContent" @scroll="onLeftScroll">
          <div class="line-wrapper" v-for="(line, idx) in displayLines.leftLines" :key="'left-' + idx"
               :class="getLineClass(line)" :ref="'line-' + idx">
            <span class="line-number">{{ line.lineNumber || '' }}</span>
            <span class="line-content">{{ line.content }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧面板 -->
      <div class="diff-panel right-panel">
        <div class="panel-header">
          <div class="file-info">
            <div class="info-row">
              <span class="label">{{ $t('fileName') || '文件名称' }}：</span>
              <span class="value" :title="rightFile.name">{{ rightFile.name || '--' }}</span>
            </div>
            <div class="info-row">
              <span class="label">{{ $t('backupTime') || '备份时间' }}：</span>
              <span class="value">{{ rightFile.backupTime || '--' }}</span>
            </div>
            <div class="info-row">
              <span class="label">{{ $t('encoding') || '字符编码' }}：</span>
              <p-select class="encoding-select" v-model="rightEncoding">
                <p-option v-for="enc in encodingOptions" :key="enc" :value="enc">{{ enc }}</p-option>
              </p-select>
            </div>
          </div>
        </div>
        <div class="panel-content" ref="rightContent" @scroll="onRightScroll">
          <div class="line-wrapper" v-for="(line, idx) in displayLines.rightLines" :key="'right-' + idx"
               :class="getLineClass(line)">
            <span class="line-number">{{ line.lineNumber || '' }}</span>
            <span class="line-content">{{ line.content }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部：统计信息和导航 -->
    <div class="diff-footer">
      <div class="stats">
        <span class="stat-item identical">
          <span class="stat-dot"></span>
          {{ $t('identicalLines') || '相同的行' }}：{{ diffResult.stats.identical }}
        </span>
        <span class="stat-item changed">
          <span class="stat-dot"></span>
          {{ $t('changedLines') || '变化的行' }}：{{ diffResult.stats.changed }}
        </span>
        <span class="stat-item unique">
          <span class="stat-dot"></span>
          {{ $t('uniqueLines') || '唯一的行' }}：{{ diffResult.stats.unique }}
        </span>
      </div>
      <div class="navigation">
        <p-button class="nav-btn" @click="navigatePrev" :disabled="!canNavigatePrev">
          {{ $t('prevDiff') || '上一个不同' }}
        </p-button>
        <p-button class="nav-btn" @click="navigateNext" :disabled="!canNavigateNext">
          {{ $t('nextDiff') || '下一个不同' }}
        </p-button>
      </div>
    </div>
  </div>
</template>

<script>
import { themeConfig } from '../common/chartTheme'
import { computeDiff, filterDiffOnly, encodingOptions } from './diffUtils'

export default {
  name: 'canvas-base-diff',
  props: ['data', 'resize', 'theme', 'lang', 'config', 'resobj', 'chart-height', 'chart-width'],
  data() {
    return {
      displayMode: 'all', // 'all' | 'diff'
      leftEncoding: 'US-ASCII',
      rightEncoding: 'US-ASCII',
      currentDiffIndex: -1,
      isScrolling: false,
      encodingOptions
    }
  },
  computed: {
    widgetData() {
      try {
        return JSON.parse(this.data)
      } catch (e) {
        return {}
      }
    },
    leftFile() {
      return this.widgetData?.leftFile || {}
    },
    rightFile() {
      return this.widgetData?.rightFile || {}
    },
    themeConfig() {
      return themeConfig[this.theme] || themeConfig.star
    },
    diffResult() {
      return computeDiff(this.leftFile.content || '', this.rightFile.content || '')
    },
    displayLines() {
      if (this.displayMode === 'diff') {
        return filterDiffOnly(this.diffResult, 3)
      }
      return this.diffResult
    },
    canNavigatePrev() {
      return this.displayLines.diffIndices.length > 0 && this.currentDiffIndex > 0
    },
    canNavigateNext() {
      return this.displayLines.diffIndices.length > 0 && 
             this.currentDiffIndex < this.displayLines.diffIndices.length - 1
    }
  },
  watch: {
    widgetData: {
      handler(val) {
        if (val) {
          // 初始化编码
          if (val.leftFile?.encoding) {
            this.leftEncoding = val.leftFile.encoding
          }
          if (val.rightFile?.encoding) {
            this.rightEncoding = val.rightFile.encoding
          }
          // 重置导航索引
          this.currentDiffIndex = -1
        }
      },
      immediate: true,
      deep: true
    },
    displayMode() {
      // 切换显示模式时重置导航索引
      this.currentDiffIndex = -1
    }
  },
  methods: {
    getLineClass(line) {
      const classes = ['line-' + line.type]
      if (line.type === 'separator') {
        classes.push('separator-line')
      }
      return classes
    },
    onLeftScroll() {
      if (this.isScrolling) return
      this.isScrolling = true
      const leftEl = this.$refs.leftContent
      const rightEl = this.$refs.rightContent
      if (leftEl && rightEl) {
        rightEl.scrollTop = leftEl.scrollTop
      }
      requestAnimationFrame(() => {
        this.isScrolling = false
      })
    },
    onRightScroll() {
      if (this.isScrolling) return
      this.isScrolling = true
      const leftEl = this.$refs.leftContent
      const rightEl = this.$refs.rightContent
      if (leftEl && rightEl) {
        leftEl.scrollTop = rightEl.scrollTop
      }
      requestAnimationFrame(() => {
        this.isScrolling = false
      })
    },
    navigatePrev() {
      if (!this.canNavigatePrev) return
      this.currentDiffIndex--
      this.scrollToCurrentDiff()
    },
    navigateNext() {
      if (this.currentDiffIndex < 0) {
        this.currentDiffIndex = 0
      } else if (this.canNavigateNext) {
        this.currentDiffIndex++
      }
      this.scrollToCurrentDiff()
    },
    scrollToCurrentDiff() {
      const lineIndex = this.displayLines.diffIndices[this.currentDiffIndex]
      if (lineIndex === undefined) return
      
      this.$nextTick(() => {
        const lineEl = this.$refs['line-' + lineIndex]
        if (lineEl && lineEl[0]) {
          const container = this.$refs.leftContent
          const lineTop = lineEl[0].offsetTop
          const containerHeight = container.clientHeight
          const lineHeight = lineEl[0].offsetHeight
          
          // 滚动到行居中位置
          container.scrollTop = lineTop - (containerHeight / 2) + (lineHeight / 2)
        }
      })
    }
  }
}
</script>

<style lang="less" scoped>
.canvas-base-diff {
  height: 100%;
  display: flex;
  flex-direction: column;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  overflow: hidden;

  // 深色主题 (star)
  &.star {
    background: #0d1b2a;
    color: #fff;

    .diff-header {
      background: #1b2838;
      border-bottom: 1px solid #2d4a5e;
    }

    .panel-header {
      background: #1b2838;
      border-bottom: 1px solid #2d4a5e;
    }

    .file-info {
      .label {
        color: rgba(255, 255, 255, 0.6);
      }
      .value {
        color: #fff;
      }
    }


    .panel-content {
      background: #0d1b2a;
    }

    .line-wrapper {
      &.line-same {
        background: transparent;
      }
      &.line-changed {
        background: rgba(255, 77, 77, 0.3);
      }
      &.line-unique {
        background: rgba(255, 165, 0, 0.3);
      }
      &.line-empty {
        background: rgba(128, 128, 128, 0.1);
      }
      &.separator-line {
        background: rgba(74, 144, 217, 0.2);
        color: rgba(255, 255, 255, 0.5);
        justify-content: center;
      }
    }

    .line-number {
      color: rgba(255, 255, 255, 0.4);
      border-right: 1px solid #2d4a5e;
    }

    .line-content {
      color: #e0e0e0;
    }

    .diff-footer {
      background: #1b2838;
      border-top: 1px solid #2d4a5e;
    }

    .stat-item {
      color: rgba(255, 255, 255, 0.8);
      
      &.identical .stat-dot {
        background: #4a90d9;
      }
      &.changed .stat-dot {
        background: #ff4d4d;
      }
      &.unique .stat-dot {
        background: #ffa500;
      }
    }


    .panel-content::-webkit-scrollbar-thumb {
      background: #516984;
    }
  }

  // 浅色主题 (white)
  &.white {
    background: #fff;
    color: #333;

    .diff-header {
      background: #f5f7fa;
      border-bottom: 1px solid #e4e7ed;
    }

    .panel-header {
      background: #f5f7fa;
      border-bottom: 1px solid #e4e7ed;
    }

    .file-info {
      .label {
        color: rgba(0, 0, 0, 0.5);
      }
      .value {
        color: #333;
      }
    }


    .panel-content {
      background: #fff;
    }

    .line-wrapper {
      &.line-same {
        background: transparent;
      }
      &.line-changed {
        background: rgba(255, 77, 77, 0.15);
      }
      &.line-unique {
        background: rgba(255, 165, 0, 0.15);
      }
      &.line-empty {
        background: rgba(128, 128, 128, 0.05);
      }
      &.separator-line {
        background: rgba(64, 158, 255, 0.1);
        color: rgba(0, 0, 0, 0.4);
        justify-content: center;
      }
    }

    .line-number {
      color: rgba(0, 0, 0, 0.4);
      border-right: 1px solid #e4e7ed;
    }

    .line-content {
      color: #333;
    }

    .diff-footer {
      background: #f5f7fa;
      border-top: 1px solid #e4e7ed;
    }

    .stat-item {
      color: rgba(0, 0, 0, 0.7);
      
      &.identical .stat-dot {
        background: #409eff;
      }
      &.changed .stat-dot {
        background: #f56c6c;
      }
      &.unique .stat-dot {
        background: #e6a23c;
      }
    }


    .panel-content::-webkit-scrollbar-thumb {
      background: #c0c4cc;
    }
  }

  // 通用样式
  .diff-header {
    padding: 8px 12px;
    flex-shrink: 0;
  }

  .display-mode {
    display: flex;
    gap: 20px;
  }

  .diff-body {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
  }

  .diff-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;

    &.left-panel {
      border-right: 1px solid #2d4a5e;
    }
  }

  .panel-header {
    padding: 8px 12px;
    flex-shrink: 0;
  }

  .file-info {
    .info-row {
      display: flex;
      align-items: center;
      margin-bottom: 4px;
      font-size: 12px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        flex-shrink: 0;
        margin-right: 4px;
      }

      .value {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }

  .encoding-select {
    font-size: 12px;
  }

  .panel-content {
    flex: 1;
    overflow: auto;
    min-height: 0;

    &::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      border-radius: 4px;
    }
  }

  .line-wrapper {
    display: flex;
    min-height: 20px;
    line-height: 20px;
  }

  .line-number {
    width: 40px;
    min-width: 40px;
    padding: 0 8px;
    text-align: right;
    user-select: none;
    flex-shrink: 0;
  }

  .line-content {
    flex: 1;
    padding: 0 8px;
    white-space: pre;
    overflow-x: auto;
  }

  .diff-footer {
    padding: 8px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }

  .stats {
    display: flex;
    gap: 16px;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;

    .stat-dot {
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }
  }

  .navigation {
    display: flex;
    gap: 8px;
  }

  .nav-btn {
    font-size: 12px;
  }
}
</style>
