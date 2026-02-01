/**
 * Diff 算法工具函数
 * 使用 LCS（最长公共子序列）算法实现行级别对比
 */

/**
 * 计算两个数组的最长公共子序列
 * @param {Array} arr1 第一个数组
 * @param {Array} arr2 第二个数组
 * @returns {Array} LCS 结果
 */
function computeLCS(arr1, arr2) {
  const m = arr1.length
  const n = arr2.length
  
  // 创建 DP 表
  const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
  
  // 填充 DP 表
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (arr1[i - 1] === arr2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }
  
  // 回溯找出 LCS
  const lcs = []
  let i = m, j = n
  while (i > 0 && j > 0) {
    if (arr1[i - 1] === arr2[j - 1]) {
      lcs.unshift({ value: arr1[i - 1], leftIndex: i - 1, rightIndex: j - 1 })
      i--
      j--
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }
  
  return lcs
}

/**
 * 计算两个文件内容的差异
 * @param {string} leftContent 左侧文件内容
 * @param {string} rightContent 右侧文件内容
 * @returns {Object} 差异结果
 */
export function computeDiff(leftContent, rightContent) {
  // 处理空内容
  if (!leftContent && !rightContent) {
    return {
      leftLines: [],
      rightLines: [],
      stats: { identical: 0, changed: 0, unique: 0 },
      diffIndices: []
    }
  }
  
  // 按行分割，处理不同的换行符
  const normalizeContent = (content) => {
    if (!content) return []
    return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  }
  
  const leftArr = normalizeContent(leftContent)
  const rightArr = normalizeContent(rightContent)
  
  // 计算 LCS
  const lcs = computeLCS(leftArr, rightArr)
  
  // 构建差异结果
  const leftLines = []
  const rightLines = []
  const diffIndices = []
  
  let leftIdx = 0
  let rightIdx = 0
  let lcsIdx = 0
  let outputIdx = 0
  
  let stats = { identical: 0, changed: 0, unique: 0 }
  
  while (leftIdx < leftArr.length || rightIdx < rightArr.length) {
    const lcsItem = lcs[lcsIdx]
    
    // 检查是否到达 LCS 中的匹配项
    if (lcsItem && leftIdx === lcsItem.leftIndex && rightIdx === lcsItem.rightIndex) {
      // 相同的行
      leftLines.push({
        lineNumber: leftIdx + 1,
        content: leftArr[leftIdx],
        type: 'same'
      })
      rightLines.push({
        lineNumber: rightIdx + 1,
        content: rightArr[rightIdx],
        type: 'same'
      })
      stats.identical++
      leftIdx++
      rightIdx++
      lcsIdx++
      outputIdx++
    } else {
      // 处理不匹配的行
      const leftHasMore = lcsItem ? leftIdx < lcsItem.leftIndex : leftIdx < leftArr.length
      const rightHasMore = lcsItem ? rightIdx < lcsItem.rightIndex : rightIdx < rightArr.length
      
      if (leftHasMore && rightHasMore) {
        // 两边都有不同的行 - 标记为变化
        leftLines.push({
          lineNumber: leftIdx + 1,
          content: leftArr[leftIdx],
          type: 'changed'
        })
        rightLines.push({
          lineNumber: rightIdx + 1,
          content: rightArr[rightIdx],
          type: 'changed'
        })
        stats.changed++
        diffIndices.push(outputIdx)
        leftIdx++
        rightIdx++
        outputIdx++
      } else if (leftHasMore) {
        // 只有左边有 - 标记为唯一
        leftLines.push({
          lineNumber: leftIdx + 1,
          content: leftArr[leftIdx],
          type: 'unique'
        })
        rightLines.push({
          lineNumber: null,
          content: '',
          type: 'empty'
        })
        stats.unique++
        diffIndices.push(outputIdx)
        leftIdx++
        outputIdx++
      } else if (rightHasMore) {
        // 只有右边有 - 标记为唯一
        leftLines.push({
          lineNumber: null,
          content: '',
          type: 'empty'
        })
        rightLines.push({
          lineNumber: rightIdx + 1,
          content: rightArr[rightIdx],
          type: 'unique'
        })
        stats.unique++
        diffIndices.push(outputIdx)
        rightIdx++
        outputIdx++
      }
    }
  }
  
  return {
    leftLines,
    rightLines,
    stats,
    diffIndices
  }
}

/**
 * 过滤只显示差异内容（包含上下文）
 * @param {Object} diffResult 完整的差异结果
 * @param {number} contextLines 上下文行数
 * @returns {Object} 过滤后的差异结果
 */
export function filterDiffOnly(diffResult, contextLines = 3) {
  const { leftLines, rightLines, stats, diffIndices } = diffResult
  
  if (diffIndices.length === 0) {
    return {
      leftLines: [],
      rightLines: [],
      stats,
      diffIndices: []
    }
  }
  
  // 计算需要显示的行索引
  const visibleIndices = new Set()
  
  diffIndices.forEach(idx => {
    for (let i = Math.max(0, idx - contextLines); i <= Math.min(leftLines.length - 1, idx + contextLines); i++) {
      visibleIndices.add(i)
    }
  })
  
  // 按顺序排列索引
  const sortedIndices = Array.from(visibleIndices).sort((a, b) => a - b)
  
  // 构建过滤后的结果
  const filteredLeftLines = []
  const filteredRightLines = []
  const newDiffIndices = []
  
  let prevIdx = -2
  sortedIndices.forEach((idx, i) => {
    // 如果有间隔，添加分隔符
    if (idx > prevIdx + 1 && prevIdx >= 0) {
      filteredLeftLines.push({ lineNumber: null, content: '...', type: 'separator' })
      filteredRightLines.push({ lineNumber: null, content: '...', type: 'separator' })
    }
    
    filteredLeftLines.push(leftLines[idx])
    filteredRightLines.push(rightLines[idx])
    
    if (diffIndices.includes(idx)) {
      newDiffIndices.push(filteredLeftLines.length - 1)
    }
    
    prevIdx = idx
  })
  
  return {
    leftLines: filteredLeftLines,
    rightLines: filteredRightLines,
    stats,
    diffIndices: newDiffIndices
  }
}

/**
 * 字符编码列表
 */
export const encodingOptions = [
  'US-ASCII',
  'UTF-8',
  'UTF-16',
  'GB2312',
  'GBK',
  'GB18030',
  'ISO-8859-1',
  'ISO-8859-15'
]

export default {
  computeDiff,
  filterDiffOnly,
  encodingOptions
}
