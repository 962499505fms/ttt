<template>
  <div class="log-table">
    <!-- 搜索框 -->
    <div class="search-bar">
      <p-input
        v-model="searchKeyword"
        :placeholder="$t('logSearchPlaceholder')"
        @on-enter="handleSearch"
      >
        <Icon type="ios-search" slot="suffix" />
      </p-input>
    </div>

    <!-- 表格 -->
    <div class="table-wrapper">
      <p-table
        :columns="processedColumns"
        :data="paginatedLogs"
        :loading="loading"
        size="small"
      />
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <p-page
        :total="filteredLogs.length"
        :current="currentPage"
        :page-size="pageSize"
        show-sizer
        show-total
        @on-change="handlePageChange"
        @on-page-size-change="handlePageSizeChange"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'LogTable',
  props: {
    logs: { type: Array, default: () => [] },
    columns: { type: Array, default: () => [] },
    theme: { type: String, default: 'star' },
    themeConfig: { type: Object, default: () => ({}) }
  },
  data() {
    return {
      searchKeyword: '',
      currentPage: 1,
      pageSize: 10,
      loading: false,
      levelColors: {
        ERROR: '#ff6b6b',
        WARNING: '#ffc107',
        INFO: '#17a2b8',
        DEBUG: '#28a745',
        CRITICAL: '#dc3545',
        TRACE: '#6c757d'
      }
    }
  },
  computed: {
    filteredLogs() {
      if (!this.searchKeyword) return this.logs
      const keyword = this.searchKeyword.toLowerCase()

      return this.logs.filter(log => {
        // 搜索所有字段
        return Object.values(log).some(value =>
          String(value).toLowerCase().includes(keyword)
        )
      })
    },
    paginatedLogs() {
      const start = (this.currentPage - 1) * this.pageSize
      return this.filteredLogs.slice(start, start + this.pageSize)
    },
    processedColumns() {
      const self = this
      const columns = this.columns.map(col => {
        const column = { ...col }

        // level列特殊处理：添加颜色标签（使用内联样式）
        if (col.key === 'level') {
          column.render = (h, { row }) => {
            const level = row.level || ''
            const color = self.levelColors[level] || '#999'
            const bgColor = self.getLevelBgColor(level)
            
            return h('span', {
              style: {
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                backgroundColor: bgColor,
                color: color
              }
            }, level)
          }
        }

        return column
      })

      // 在最前面添加展开列，使用 render 函数定义展开内容
      columns.unshift({
        type: 'expand',
        width: 50,
        render: (h, { row }) => {
          const expandFields = self.getExpandFields(row)
          return h('div', {
            style: { padding: '10px 20px' }
          }, Object.entries(expandFields).map(([key, value]) => {
            return h('p', { style: { margin: '5px 0', wordBreak: 'break-all' } }, [
              h('strong', `${key}：`),
              value
            ])
          }))
        }
      })

      return columns
    }
  },
  watch: {
    logs() {
      // 数据变化时重置到第一页
      this.currentPage = 1
    }
  },
  methods: {
    handleSearch() {
      this.currentPage = 1
    },
    handlePageChange(page) {
      this.currentPage = page
    },
    handlePageSizeChange(size) {
      this.pageSize = size
      this.currentPage = 1
    },
    getLevelBgColor(level) {
      const bgColors = {
        ERROR: 'rgba(255, 107, 107, 0.2)',
        WARNING: 'rgba(255, 193, 7, 0.2)',
        INFO: 'rgba(23, 162, 184, 0.2)',
        DEBUG: 'rgba(40, 167, 69, 0.2)',
        CRITICAL: 'rgba(220, 53, 69, 0.2)',
        TRACE: 'rgba(108, 117, 125, 0.2)'
      }
      return bgColors[level] || 'rgba(153, 153, 153, 0.2)'
    },
    getExpandFields(row) {
      // 获取展开行显示的字段（排除基础字段）
      const baseFields = ['level', 'source', 'timestamp', 'content']
      const expandFields = {}

      // 先显示基础字段
      baseFields.forEach(key => {
        if (row[key] !== undefined) {
          expandFields[this.getColumnTitle(key)] = row[key]
        }
      })

      // 再显示扩展字段
      Object.keys(row).forEach(key => {
        if (!baseFields.includes(key) && key !== '_index') {
          expandFields[key] = row[key]
        }
      })

      return expandFields
    },
    getColumnTitle(key) {
      const titleMap = {
        level: this.$t('logLevel'),
        source: this.$t('logSource'),
        timestamp: this.$t('logTimestamp'),
        content: this.$t('logContent')
      }
      return titleMap[key] || key
    }
  }
}
</script>

<style lang="less" scoped>
.log-table {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  .search-bar {
    padding: 10px;
    flex-shrink: 0;
  }

  .table-wrapper {
    flex: 1;
    overflow: auto;
    padding: 0 10px;
  }

  .pagination-wrapper {
    padding: 10px;
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
