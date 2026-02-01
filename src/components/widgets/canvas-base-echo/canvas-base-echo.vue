<template>
  <div class="canvas-base-echo" :class="theme">
    <!-- 头部：标题和搜索 -->
    <div class="echo-header">
      <div class="echo-title" :title="title">{{ title }}</div>
      <div class="echo-search">
        <div class="search-input-wrapper">
          <input
            type="text"
            v-model="searchKeyword"
            :placeholder="$t('echoSearchPlaceholder') || '请输入关键词搜索...'"
            @keyup.enter="nextMatch"
            class="search-input"
          />
          <span class="search-count" v-if="searchKeyword && matchCount > 0">
            {{ currentMatchIndex + 1 }}/{{ matchCount }}
          </span>
          <span class="search-count no-match" v-else-if="searchKeyword && matchCount === 0">
            {{ $t('echoNoMatch') || '无匹配' }}
          </span>
        </div>
        <div class="search-nav" v-if="searchKeyword && matchCount > 0">
          <button
            class="nav-btn"
            @click="prevMatch"
            :title="$t('echoPrevMatch') || '上一个匹配'"
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
            </svg>
          </button>
          <button
            class="nav-btn"
            @click="nextMatch"
            :title="$t('echoNextMatch') || '下一个匹配'"
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 主体：终端内容 -->
    <div class="echo-body" ref="contentRef">
      <div class="echo-content">
        <div
          v-for="(line, index) in contentLines"
          :key="index"
          class="echo-line"
          :class="{ 'highlight-line': isLineHighlighted(index) }"
          :ref="'line-' + index"
        >
          <span class="line-number">{{ index + 1 }}</span>
          <span class="line-text" v-html="highlightLine(line)"></span>
        </div>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="echo-toolbar">
      <button
        class="tool-btn"
        @click="copyContent"
        :title="$t('echoCopyAll') || '复制全部'"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
        </svg>
      </button>
      <button
        class="tool-btn"
        @click="scrollToBottom"
        :title="$t('echoScrollToBottom') || '滚动到底部'"
      >
        <svg viewBox="0 0 24 24" width="16" height="16">
          <path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z"/>
        </svg>
      </button>
    </div>

    <!-- 复制成功提示 -->
    <transition name="fade">
      <div class="copy-toast" v-if="showCopyToast">
        {{ $t('echoCopySuccess') || '内容已复制到剪贴板' }}
      </div>
    </transition>
  </div>
</template>

<script>
import { themeConfig } from '../common/chartTheme'

export default {
  name: 'canvas-base-echo',
  props: ['data', 'resize', 'theme', 'lang', 'config', 'resobj', 'chart-height', 'chart-width'],
  data() {
    return {
      searchKeyword: '',
      currentMatchIndex: 0,
      matchPositions: [], // 存储匹配行的索引
      showCopyToast: false
    }
  },
  computed: {
    widgetData() {
      try {
        return typeof this.data === 'string' ? JSON.parse(this.data) : this.data || {}
      } catch (e) {
        return {}
      }
    },
    title() {
      return this.widgetData?.title || ''
    },
    content() {
      return this.widgetData?.content || ''
    },
    contentLines() {
      return this.content.split('\n')
    },
    themeConfig() {
      return themeConfig[this.theme] || themeConfig['star']
    },
    matchCount() {
      return this.matchPositions.length
    }
  },
  watch: {
    searchKeyword: {
      handler(newVal) {
        this.updateMatchPositions()
        this.currentMatchIndex = 0
        if (newVal && this.matchPositions.length > 0) {
          this.$nextTick(() => {
            this.scrollToMatch(0)
          })
        }
      }
    }
  },
  methods: {
    // 更新匹配位置
    updateMatchPositions() {
      this.matchPositions = []
      if (!this.searchKeyword) return

      const keyword = this.searchKeyword.toLowerCase()
      this.contentLines.forEach((line, index) => {
        if (line.toLowerCase().includes(keyword)) {
          this.matchPositions.push(index)
        }
      })
    },

    // 判断行是否高亮
    isLineHighlighted(lineIndex) {
      if (!this.searchKeyword || this.matchPositions.length === 0) return false
      return this.matchPositions[this.currentMatchIndex] === lineIndex
    },

    // 高亮显示搜索关键词
    highlightLine(line) {
      const escaped = this.escapeHtml(line)
      if (!this.searchKeyword) return escaped

      const regex = new RegExp(`(${this.escapeRegex(this.searchKeyword)})`, 'gi')
      return escaped.replace(regex, '<mark class="search-highlight">$1</mark>')
    },

    // HTML转义
    escapeHtml(text) {
      const div = document.createElement('div')
      div.textContent = text
      return div.innerHTML
    },

    // 正则转义
    escapeRegex(string) {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    },

    // 上一个匹配
    prevMatch() {
      if (this.matchCount === 0) return
      this.currentMatchIndex = (this.currentMatchIndex - 1 + this.matchCount) % this.matchCount
      this.scrollToMatch(this.currentMatchIndex)
    },

    // 下一个匹配
    nextMatch() {
      if (this.matchCount === 0) return
      this.currentMatchIndex = (this.currentMatchIndex + 1) % this.matchCount
      this.scrollToMatch(this.currentMatchIndex)
    },

    // 滚动到指定匹配
    scrollToMatch(matchIndex) {
      const lineIndex = this.matchPositions[matchIndex]
      const lineRef = this.$refs['line-' + lineIndex]
      if (lineRef && lineRef[0]) {
        lineRef[0].scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    },

    // 复制内容
    async copyContent() {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(this.content)
        } else {
          // 降级方案
          const textarea = document.createElement('textarea')
          textarea.value = this.content
          textarea.style.position = 'fixed'
          textarea.style.left = '-9999px'
          document.body.appendChild(textarea)
          textarea.select()
          document.execCommand('copy')
          document.body.removeChild(textarea)
        }
        this.showCopyToast = true
        setTimeout(() => {
          this.showCopyToast = false
        }, 2000)
      } catch (err) {
        console.error('复制失败:', err)
      }
    },

    // 滚动到底部
    scrollToBottom() {
      const container = this.$refs.contentRef
      if (container) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth'
        })
      }
    }
  }
}
</script>

<style scoped lang="less">
.canvas-base-echo {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  border-radius: 4px;
  overflow: hidden;
  font-family: Consolas, Monaco, 'Courier New', monospace;
  position: relative;

  // Star主题（深色）
  &.star {
    background: linear-gradient(180deg, #0d1b2a 0%, #1b263b 100%);
    color: #e0e0e0;
    border: 1px solid rgba(59, 129, 255, 0.3);

    .echo-header {
      background: rgba(0, 0, 0, 0.3);
      border-bottom: 1px solid rgba(59, 129, 255, 0.2);
    }

    .echo-title {
      color: #3b81ff;
    }

    .search-input {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(59, 129, 255, 0.3);
      color: #e0e0e0;

      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }

      &:focus {
        border-color: #3b81ff;
        box-shadow: 0 0 0 2px rgba(59, 129, 255, 0.2);
      }
    }

    .search-count {
      color: rgba(255, 255, 255, 0.6);

      &.no-match {
        color: #ff6b6b;
      }
    }

    .nav-btn,
    .tool-btn {
      background: rgba(59, 129, 255, 0.2);
      border: 1px solid rgba(59, 129, 255, 0.3);
      color: #3b81ff;

      &:hover {
        background: rgba(59, 129, 255, 0.3);
      }
    }

    .echo-body {
      background: rgba(0, 0, 0, 0.2);
    }

    .line-number {
      color: rgba(255, 255, 255, 0.3);
      border-right: 1px solid rgba(59, 129, 255, 0.2);
    }

    .line-text {
      color: #e0e0e0;
    }

    .highlight-line {
      background: rgba(59, 129, 255, 0.2);
    }

    .echo-toolbar {
      background: rgba(0, 0, 0, 0.3);
      border-top: 1px solid rgba(59, 129, 255, 0.2);
    }

    .copy-toast {
      background: rgba(59, 129, 255, 0.9);
      color: #fff;
    }
  }

  // White主题（浅色）
  &.white {
    background: #f8f9fa;
    color: #333;
    border: 1px solid #e0e0e0;

    .echo-header {
      background: #fff;
      border-bottom: 1px solid #e0e0e0;
    }

    .echo-title {
      color: #333;
    }

    .search-input {
      background: #fff;
      border: 1px solid #ddd;
      color: #333;

      &::placeholder {
        color: #999;
      }

      &:focus {
        border-color: #3b81ff;
        box-shadow: 0 0 0 2px rgba(59, 129, 255, 0.1);
      }
    }

    .search-count {
      color: #666;

      &.no-match {
        color: #dc3545;
      }
    }

    .nav-btn,
    .tool-btn {
      background: #f0f0f0;
      border: 1px solid #ddd;
      color: #666;

      &:hover {
        background: #e0e0e0;
      }
    }

    .echo-body {
      background: #fff;
    }

    .line-number {
      color: #999;
      border-right: 1px solid #e0e0e0;
    }

    .line-text {
      color: #333;
    }

    .highlight-line {
      background: rgba(59, 129, 255, 0.1);
    }

    .echo-toolbar {
      background: #fff;
      border-top: 1px solid #e0e0e0;
    }

    .copy-toast {
      background: #333;
      color: #fff;
    }
  }
}

.echo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  flex-shrink: 0;
  gap: 12px;
}

.echo-title {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
  min-width: 0;
}

.echo-search {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  width: 180px;
  height: 28px;
  padding: 0 60px 0 8px;
  border-radius: 4px;
  font-size: 12px;
  outline: none;
  transition: all 0.2s;
}

.search-count {
  position: absolute;
  right: 8px;
  font-size: 11px;
  pointer-events: none;
}

.search-nav {
  display: flex;
  gap: 2px;
}

.nav-btn,
.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:active {
    transform: scale(0.95);
  }
}

.echo-body {
  flex: 1;
  overflow: auto;
  padding: 8px 0;

  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(128, 128, 128, 0.3);
    border-radius: 4px;

    &:hover {
      background: rgba(128, 128, 128, 0.5);
    }
  }
}

.echo-content {
  min-height: 100%;
}

.echo-line {
  display: flex;
  line-height: 1.6;
  font-size: 13px;
  transition: background 0.2s;

  &:hover {
    background: rgba(128, 128, 128, 0.1);
  }
}

.line-number {
  flex-shrink: 0;
  width: 40px;
  padding: 0 8px;
  text-align: right;
  font-size: 12px;
  user-select: none;
}

.line-text {
  flex: 1;
  padding: 0 12px;
  white-space: pre-wrap;
  word-break: break-all;

  :deep(.search-highlight) {
    background: #ffeb3b;
    color: #333;
    padding: 0 2px;
    border-radius: 2px;
  }
}

.echo-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 6px 12px;
  gap: 8px;
  flex-shrink: 0;
}

.copy-toast {
  position: absolute;
  bottom: 50px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 12px;
  z-index: 100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>
