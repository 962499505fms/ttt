<template>
  <div class="test-panel">
    <p-button type="primary" @click="handleCreateSurface" size="small">
      <p-icon type="pui-plus" /> Widget
    </p-button>
    <p-button type="primary" @click="handleUpdateComponents" size="small">
      <p-icon type="pui-database" /> 更新组件
    </p-button>
    <p-button type="primary" @click="handleUpdateData" size="small">
      <p-icon type="pui-refresh" /> 更新数据
    </p-button>
    <p-button type="primary" @click="handleUpdateData2" size="small">
      <p-icon type="pui-refresh" /> 更新数据2
    </p-button>
    <p-button type="primary" @click="handleDeleteSurface" size="small">
      <p-icon type="pui-close" /> Widget
    </p-button>
    <p-button type="primary" @click="handleBatchCreate" size="small">
      <p-icon type="pui-layers" /> 批量创建Widget
    </p-button>
    <p-button type="primary" @click="handleTestGroupedWidgets" size="small">
      <p-icon type="pui-folder" /> 测试分组Widgets
    </p-button>
    <p-button type="primary" @click="handleTestSnapshotLoad" size="small">
      <p-icon type="pui-download" /> 加载快照
    </p-button>
    <p-button type="primary" @click="handleTestUngroupedSnapshotLoad" size="small">
      <p-icon type="pui-download" /> 加载未分组快照
    </p-button>
    <p-button type="default" @click="handleClearCanvas" size="small">
      <p-icon type="pui-trash" /> 清空画布
    </p-button>
    <p-button type="primary" @click="handleShowAllWidgetTypes" size="small">
      <p-icon type="pui-grid" /> 展示所有Widget类型
    </p-button>
  </div>
</template>

<script>
export default {
  name: 'TestPanel',
  data() {
    return {
      widgetCount: 0,
      conversationId: 'conv-' + Date.now()
    }
  },
  methods: {
    emitMessage(message) {
      this.$emit('message', message)
    },
    handleCreateSurface() {
      this.widgetCount++
      const surfaceId = `trend-chart-${this.widgetCount}`
      const message = {
        type: 'ui',
        conversationId: this.conversationId,
        event: {
          messageId: 'msg-create-' + Date.now(),
          value: {
            createSurface: {
              surfaceId: surfaceId
            }
          },
          metadata: {
            preferredPlace: 'canvas'
          }
        }
      }
      console.log('createSurface', message)
      this.emitMessage(message)
    },
    handleUpdateComponents() {
      if (this.widgetCount === 0) {
        this.$Message.warning('没有Widget')
        return
      }
      const surfaceId = `trend-chart-${this.widgetCount}`
      const message = {
        type: 'ui',
        conversationId: this.conversationId,
        event: {
          messageId: 'msg-components-' + Date.now(),
          value: {
            updateComponents: {
              surfaceId: surfaceId,
              components: [{
                id: 'canvas-base-pie',
                component: 'canvas-base-pie',
                title: 'CPU',
                xAxisName: {
                  path: '/perf/xAxisName'
                },
                data: {
                  path: '/perf/data'
                }
              }]
            }
          },
          metadata: {
            preferredPlace: 'canvas'
          }
        }
      }
      console.log('updateComponents', message)
      this.emitMessage(message)
    },
    handleUpdateData() {
      if (this.widgetCount === 0) {
        this.$Message.warning('没有Widget')
        return
      }
      const surfaceId = `trend-chart-${this.widgetCount}`
      const message = {
        type: 'ui',
        conversationId: this.conversationId,
        event: {
          messageId: 'msg-data-' + Date.now(),
          value: {
            updateDataModel: {
              surfaceId: surfaceId,
              path: '/perf',
              value: {
                yAxisName: 'CPU',
                data: [
                  { name: 'CPU', value: 65 },
                  { name: '内存', value: 45 },
                  { name: '磁盘', value: 30 },
                  { name: '网络', value: 20 }
                ]
              }
            }
          },
          metadata: {
            preferredPlace: 'canvas'
          }
        }
      }
      console.log('updateDataModel', message)
      this.emitMessage(message)
    },
    handleUpdateData2() {
      if (this.widgetCount === 0) {
        this.$Message.warning('没有Widget')
        return
      }
      const surfaceId = `trend-chart-${this.widgetCount}`
      const message = {
        type: 'ui',
        conversationId: this.conversationId,
        event: {
          messageId: 'msg-data2-' + Date.now(),
          value: {
            updateDataModel: {
              surfaceId: surfaceId,
              path: '/perf',
              value: {
                yAxisName: 'CPU',
                data: [
                  { name: 'CPU', value: 1 },
                  { name: '内存', value: 1 },
                  { name: '磁盘', value: 1 },
                  { name: '网络', value: 1 }
                ]
              }
            }
          },
          metadata: {
            preferredPlace: 'canvas'
          }
        }
      }
      console.log('updateDataModel', message)
      this.emitMessage(message)
    },
    handleDeleteSurface() {
      if (this.widgetCount === 0) {
        this.$Message.warning('没有Widget')
        return
      }
      const surfaceId = `trend-chart-${this.widgetCount}`
      this.widgetCount--
      const message = {
        type: 'ui',
        conversationId: this.conversationId,
        event: {
          messageId: 'msg-delete-' + Date.now(),
          value: {
            deleteSurface: {
              surfaceId: surfaceId
            }
          },
          metadata: {
            preferredPlace: 'canvas'
          }
        }
      }
      console.log('deleteSurface', message)
      this.emitMessage(message)
    },
    handleBatchCreate() {
      const widgetCount = 3
      for (let i = 0; i < widgetCount; i++) {
        this.widgetCount++
        const surfaceId = `batch-widget-${this.widgetCount}`
        this.emitMessage({
          type: 'ui',
          conversationId: this.conversationId,
          event: {
            messageId: `msg-batch-${this.widgetCount}-` + Date.now(),
            value: {
              createSurface: {
                surfaceId: surfaceId
              },
              updateComponents: {
                surfaceId: surfaceId,
                components: [{
                  id: 'root',
                  component: 'canvas-base-pie',
                  title: `图表 ${this.widgetCount}`,
                  data: {
                    path: '/data'
                  }
                }]
              },
              updateDataModel: {
                surfaceId: surfaceId,
                path: '/',
                value: {
                  data: [
                    { name: 'A', value: Math.round(Math.random() * 100) },
                    { name: 'B', value: Math.round(Math.random() * 100) },
                    { name: 'C', value: Math.round(Math.random() * 100) }
                  ]
                }
              }
            },
            metadata: {
              preferredPlace: 'canvas'
            }
          }
        })
      }
      console.log('创建了', widgetCount, '个widget')
    },
    handleTestGroupedWidgets() {
      this.$emit('clear')
      this.widgetCount = 0
      this.conversationId = 'conv-grouped-' + Date.now()
      // 第一组
      for (let i = 0; i < 2; i++) {
        this.widgetCount++
        const surfaceId = `group-widget-${this.widgetCount}`
        this.emitMessage({
          type: 'ui',
          conversationId: this.conversationId,
          event: {
            messageId: `msg-group1-${i}-` + Date.now(),
            value: {
              createSurface: {
                surfaceId: surfaceId
              },
              updateComponents: {
                surfaceId: surfaceId,
                components: [{
                  id: 'root',
                  component: 'canvas-base-pie',
                  title: `图表 ${i + 1}`,
                  data: {
                    path: '/data'
                  }
                }]
              },
              updateDataModel: {
                surfaceId: surfaceId,
                path: '/',
                value: {
                  data: [
                    { name: 'CPU', value: Math.round(Math.random() * 100) },
                    { name: '内存', value: Math.round(Math.random() * 100) },
                    { name: '磁盘', value: Math.round(Math.random() * 100) }
                  ]
                }
              }
            },
            metadata: {
              preferredPlace: 'canvas',
              surfaceGroup: '组1'
            }
          }
        })
      }
      // 第二组
      for (let i = 0; i < 2; i++) {
        this.widgetCount++
        const surfaceId = `group-widget-${this.widgetCount}`
        this.emitMessage({
          type: 'ui',
          conversationId: this.conversationId,
          event: {
            messageId: `msg-group2-${i}-` + Date.now(),
            value: {
              createSurface: {
                surfaceId: surfaceId
              },
              updateComponents: {
                surfaceId: surfaceId,
                components: [{
                  id: 'root',
                  component: 'canvas-base-pie',
                  title: `图表 ${i + 1}`,
                  data: {
                    path: '/data'
                  }
                }]
              },
              updateDataModel: {
                surfaceId: surfaceId,
                path: '/',
                value: {
                  data: [
                    { name: 'A', value: Math.round(Math.random() * 100) },
                    { name: 'B', value: Math.round(Math.random() * 100) },
                    { name: 'C', value: Math.round(Math.random() * 100) }
                  ]
                }
              }
            },
            metadata: {
              preferredPlace: 'canvas',
              surfaceGroup: '组2'
            }
          }
        })
      }
      // 未分组
      this.widgetCount++
      const alertSurfaceId = `group-widget-${this.widgetCount}`
      this.emitMessage({
        type: 'ui',
        conversationId: this.conversationId,
        event: {
          messageId: 'msg-group3-' + Date.now(),
          value: {
            createSurface: {
              surfaceId: alertSurfaceId
            },
            updateComponents: {
              surfaceId: alertSurfaceId,
              components: [{
                id: 'root',
                component: 'canvas-base-pie',
                title: '图表 5',
                data: {
                  path: '/data'
                }
              }]
            },
            updateDataModel: {
              surfaceId: alertSurfaceId,
              path: '/',
              value: {
                data: [
                  { name: 'X', value: Math.round(Math.random() * 50) },
                  { name: 'Y', value: Math.round(Math.random() * 100) },
                  { name: 'Z', value: Math.round(Math.random() * 200) }
                ]
              }
            }
          },
          metadata: {
            preferredPlace: 'canvas',
            surfaceGroup: ''
          }
        }
      })
      console.log('创建了', this.widgetCount, '个widget')
    },
    handleTestSnapshotLoad() {
      const mockSnapshotData = [
        {
          surfaceId: 'snapshot-widget-1',
          surfaceIndex: 0,
          surfaceGroup: '',
          propsSnap: {
            widgetId: 'canvas-base-pie',
            x: 0,
            y: 1,
            w: 4,
            h: 7,
            minW: 2,
            minH: 4,
            title: '图表1'
          },
          surfaceSnap: {
            createSurface: {
              surfaceId: 'snapshot-widget-1'
            },
            updateComponents: {
              surfaceId: 'snapshot-widget-1',
              components: [{
                id: 'root',
                component: 'canvas-base-pie',
                title: '图表1',
                data: {
                  path: '/data'
                }
              }]
            },
            updateDataModel: {
              surfaceId: 'snapshot-widget-1',
              path: '/',
              value: {
                data: [
                  { name: 'A', value: 35 },
                  { name: 'B', value: 45 },
                  { name: 'C', value: 20 }
                ]
              }
            }
          }
        },
        {
          surfaceId: 'snapshot-widget-2',
          surfaceIndex: 1,
          surfaceGroup: '',
          propsSnap: {
            widgetId: 'canvas-base-pie',
            x: 4,
            y: 1,
            w: 4,
            h: 7,
            minW: 2,
            minH: 4,
            title: '图表2'
          },
          surfaceSnap: {
            createSurface: {
              surfaceId: 'snapshot-widget-2'
            },
            updateComponents: {
              surfaceId: 'snapshot-widget-2',
              components: [{
                id: 'root',
                component: 'canvas-base-pie',
                title: '图表2',
                data: {
                  path: '/data'
                }
              }]
            },
            updateDataModel: {
              surfaceId: 'snapshot-widget-2',
              path: '/',
              value: {
                data: [
                  { name: 'X', value: 60 },
                  { name: 'Y', value: 25 },
                  { name: 'Z', value: 15 }
                ]
              }
            }
          }
        },
        {
          surfaceId: 'snapshot-widget-3',
          surfaceIndex: 2,
          surfaceGroup: '',
          propsSnap: {
            widgetId: 'canvas-base-pie',
            x: 0,
            y: 9,
            w: 4,
            h: 7,
            minW: 2,
            minH: 4,
            title: '图表3'
          },
          surfaceSnap: {
            createSurface: {
              surfaceId: 'snapshot-widget-3'
            },
            updateComponents: {
              surfaceId: 'snapshot-widget-3',
              components: [{
                id: 'root',
                component: 'canvas-base-pie',
                title: '图表3',
                data: {
                  path: '/data'
                }
              }]
            },
            updateDataModel: {
              surfaceId: 'snapshot-widget-3',
              path: '/',
              value: {
                data: [
                  { name: 'CPU', value: 75 },
                  { name: '内存', value: 50 },
                  { name: '磁盘', value: 30 }
                ]
              }
            }
          }
        }
      ]
      console.log(mockSnapshotData)
      this.$emit('load-snapshot', this.conversationId, mockSnapshotData)
      this.widgetCount = mockSnapshotData.length
    },
    handleTestUngroupedSnapshotLoad() {
      const mockUngroupedSnapshotData = [
        {
          surfaceId: 'ungrouped-widget-1',
          surfaceIndex: 0,
          propsSnap: {
            widgetId: 'canvas-base-pie',
            x: 0,
            y: 0,
            w: 4,
            h: 7,
            minW: 2,
            minH: 4,
            title: '图表1'
          },
          surfaceSnap: {
            createSurface: {
              surfaceId: 'ungrouped-widget-1'
            },
            updateComponents: {
              surfaceId: 'ungrouped-widget-1',
              components: [{
                id: 'root',
                component: 'canvas-base-pie',
                title: '图表1',
                data: {
                  path: '/data'
                }
              }]
            },
            updateDataModel: {
              surfaceId: 'ungrouped-widget-1',
              path: '/',
              value: {
                data: [
                  { name: 'A', value: 42 },
                  { name: 'B', value: 28 },
                  { name: 'C', value: 30 }
                ]
              }
            }
          }
        },
        {
          surfaceId: 'ungrouped-widget-2',
          surfaceIndex: 1,
          propsSnap: {
            widgetId: 'canvas-base-pie',
            x: 4,
            y: 0,
            w: 4,
            h: 7,
            minW: 2,
            minH: 4,
            title: '图表2'
          },
          surfaceSnap: {
            createSurface: {
              surfaceId: 'ungrouped-widget-2'
            },
            updateComponents: {
              surfaceId: 'ungrouped-widget-2',
              components: [{
                id: 'root',
                component: 'canvas-base-pie',
                title: '图表2',
                data: {
                  path: '/data'
                }
              }]
            },
            updateDataModel: {
              surfaceId: 'ungrouped-widget-2',
              path: '/',
              value: {
                data: [
                  { name: 'X', value: 85 },
                  { name: 'Y', value: 10 },
                  { name: 'Z', value: 5 }
                ]
              }
            }
          }
        },
        {
          surfaceId: 'ungrouped-widget-3',
          surfaceIndex: 2,
          propsSnap: {
            widgetId: 'canvas-base-pie',
            x: 8,
            y: 1,
            w: 4,
            h: 7,
            minW: 2,
            minH: 4,
            title: '图表3'
          },
          surfaceSnap: {
            createSurface: {
              surfaceId: 'ungrouped-widget-3'
            },
            updateComponents: {
              surfaceId: 'ungrouped-widget-3',
              components: [{
                id: 'root',
                component: 'canvas-base-pie',
                title: '图表3',
                data: {
                  path: '/data'
                }
              }]
            },
            updateDataModel: {
              surfaceId: 'ungrouped-widget-3',
              path: '/',
              value: {
                data: [
                  { name: 'CPU', value: 65 },
                  { name: '内存', value: 25 },
                  { name: '磁盘', value: 10 }
                ]
              }
            }
          }
        }
      ]
      console.log(mockUngroupedSnapshotData)
      this.$emit('load-snapshot', this.conversationId, mockUngroupedSnapshotData)
      this.widgetCount = mockUngroupedSnapshotData.length
    },
    handleClearCanvas() {
      this.$emit('clear')
      this.widgetCount = 0
      console.log('清空画布')
    },
    handleShowAllWidgetTypes() {
      // 先清空画布
      this.$emit('clear')
      this.widgetCount = 0
      this.conversationId = 'conv-all-widgets-' + Date.now()

      // 所有 widget 类型的测试配置
      const allWidgetTypes = [
        {
          component: 'canvas-base-pie',
          title: '基础饼图 - CPU使用率',
          data: [
            { name: 'CPU1', value: 65 },
            { name: 'CPU2', value: 45 },
            { name: 'CPU3', value: 30 },
            { name: 'CPU4', value: 20 }
          ]
        },
        {
          component: 'canvas-base-bar',
          title: '基础柱状图 - 内存分布',
          data: [
            { name: '服务器A', value: 8192 },
            { name: '服务器B', value: 16384 },
            { name: '服务器C', value: 4096 },
            { name: '服务器D', value: 32768 }
          ],
          unit: 'MB'
        },
        {
          component: 'canvas-base-gauge',
          title: '基础仪表盘 - 系统负载',
          data: [
            { name: '负载', value: 72 }
          ]
        },
        {
          component: 'canvas-base-card',
          title: '基础卡片 - 网络流量',
          type: 'bar',
          data: [
            { name: '入站流量', value: 1250 },
            { name: '出站流量', value: 890 }
          ],
          unit: 'Mbps',
          miniChartData: [32, 45, 28, 56, 42, 38, 50]
        },
        {
          component: 'canvas-base-trend',
          title: '基础趋势图 - 温度监控',
          data: [
            { time: '09:00', value: 45, name: 'CPU温度' },
            { time: '10:00', value: 52, name: 'CPU温度' },
            { time: '11:00', value: 48, name: 'CPU温度' },
            { time: '12:00', value: 55, name: 'CPU温度' },
            { time: '09:00', value: 38, name: 'GPU温度' },
            { time: '10:00', value: 42, name: 'GPU温度' },
            { time: '11:00', value: 40, name: 'GPU温度' },
            { time: '12:00', value: 45, name: 'GPU温度' }
          ],
          unit: '°C'
        },
        {
          component: 'canvas-base-diff',
          title: '配置对比 - 设备配置差异',
          leftFile: {
            name: 'device_192.167.1.180_running_config.cfg',
            backupTime: '2026-01-12 08:28:45',
            encoding: 'US-ASCII',
            content: '#\nversion 7.1.070, Release 6010P08\n#\nsysname H3C\n#\ntelnet server enable\n#\nirf mac-address persistent always\nirf auto-update enable\nirf auto-merge enable\nundo irf link-delay\nirf member 1 priority 1\n#\ninterface GigabitEthernet1/0/1\n port link-mode bridge\n description To_Server_1\n port link-type trunk\n port trunk permit vlan all\n#\ninterface GigabitEthernet1/0/2\n port link-mode bridge\n description To_Server_2\n port link-type access\n port access vlan 100\n#\nreturn'
          },
          rightFile: {
            name: 'device_192.167.1.181_running_config.cfg',
            backupTime: '2026-01-10 14:16:37',
            encoding: 'US-ASCII',
            content: '#\nversion 7.1.000, Release 6010P01\n#\nsysname H3C123\n#\ntelnet server enable\n#\nirf mac-address persistent always\nirf auto-update enable\nundo irf link-delay\nirf member 1 priority 1\n#\ninterface GigabitEthernet1/0/1\n port link-mode bridge\n description To_Server_A\n port link-type trunk\n port trunk permit vlan all\n#\ninterface GigabitEthernet1/0/2\n port link-mode bridge\n description To_Server_2\n port link-type access\n port access vlan 200\n#\nreturn'
          }
        },
        {
          component: 'canvas-base-echo',
          title: '设备回显 - device_192.168.1.180',
          content: 'H3C> display version\nH3C Comware Software,\nVersion 7.1.059, Release 6880P03\nCopyright (c)2004-2023 New H3C Technologies\nCo., Ltd.All rights reserved.\nH3C MSR56 Series Router(E01MSR56FC-S1),\nuptime is 32 weeks, 5 days, 4 hours, 2\nminutes\nStartup time is 17.10:47 UTC Wed Aug 9 2023\n660864K bytes memory\nMPU version 0.2359\n\nBoot ROM version 776(BootROM Nov 30 2021,\n17:42:01)\n[SubSlot 0]VCPM-SFP\n-SFP EEPROM information:\n    -Connector type:LC\n    -Transfer Distance:2km\n    -Wavelength:1310nm'
        },
        {
          component: 'canvas-base-log',
          title: '日志查看器 - 系统日志',
          logs: [
            { level: 'ERROR', source: '192.167.1.180', timestamp: '2026-01-20 15:46:20', content: 'Database connection failed.' },
            { level: 'ERROR', source: '192.167.1.180', timestamp: '2026-01-20 15:45:10', content: 'Connection timeout after 30s.' },
            { level: 'WARNING', source: '192.167.1.180', timestamp: '2026-01-20 15:40:00', content: 'High memory usage detected (85%).' },
            { level: 'WARNING', source: '192.167.1.181', timestamp: '2026-01-20 15:38:30', content: 'CPU temperature above threshold.' },
            { level: 'INFO', source: '192.167.1.181', timestamp: '2026-01-20 15:30:00', content: 'User admin login successful.' },
            { level: 'INFO', source: '192.167.1.181', timestamp: '2026-01-20 15:25:00', content: 'Service nginx started.' },
            { level: 'INFO', source: '192.167.1.182', timestamp: '2026-01-20 15:20:00', content: 'Backup completed successfully.' },
            { level: 'DEBUG', source: '192.167.1.182', timestamp: '2026-01-20 15:15:00', content: 'Cache hit for key: user_session_123' },
            { level: 'DEBUG', source: '192.167.1.182', timestamp: '2026-01-20 15:10:00', content: 'Query executed in 45ms.' },
            { level: 'INFO', source: '192.167.1.180', timestamp: '2026-01-20 15:05:00', content: 'Configuration reloaded.' },
            { level: 'WARNING', source: '192.167.1.180', timestamp: '2026-01-20 15:00:00', content: 'Disk usage at 75%.' },
            { level: 'ERROR', source: '192.167.1.181', timestamp: '2026-01-20 14:55:00', content: 'Failed to connect to remote server.' }
          ]
        }
      ]

      // 批量创建所有类型的 widget
      allWidgetTypes.forEach((widgetConfig, index) => {
        this.widgetCount++
        const surfaceId = `all-widgets-${widgetConfig.component}-${this.widgetCount}`
        
        // 构建组件配置
        const componentConfig = {
          id: 'root',
          component: widgetConfig.component,
          title: widgetConfig.title,
          data: {
            path: '/data'
          }
        }
        
        // 添加可选属性
        if (widgetConfig.unit) {
          componentConfig.unit = { path: '/unit' }
        }
        if (widgetConfig.type) {
          componentConfig.type = widgetConfig.type
        }
        if (widgetConfig.miniChartData) {
          componentConfig.miniChartData = { path: '/miniChartData' }
        }
        // canvas-base-diff 特殊处理
        if (widgetConfig.leftFile) {
          componentConfig.leftFile = { path: '/leftFile' }
          delete componentConfig.data
        }
        if (widgetConfig.rightFile) {
          componentConfig.rightFile = { path: '/rightFile' }
        }
        // canvas-base-echo 特殊处理
        if (widgetConfig.content !== undefined) {
          componentConfig.content = { path: '/content' }
          delete componentConfig.data
        }
        // canvas-base-log 特殊处理
        if (widgetConfig.logs !== undefined) {
          componentConfig.logs = { path: '/logs' }
          delete componentConfig.data
        }

        // 构建数据模型
        const dataValue = {
          data: widgetConfig.data
        }
        if (widgetConfig.unit) {
          dataValue.unit = widgetConfig.unit
        }
        if (widgetConfig.miniChartData) {
          dataValue.miniChartData = widgetConfig.miniChartData
        }
        // canvas-base-diff 特殊处理
        if (widgetConfig.leftFile) {
          dataValue.leftFile = widgetConfig.leftFile
          delete dataValue.data
        }
        if (widgetConfig.rightFile) {
          dataValue.rightFile = widgetConfig.rightFile
        }
        // canvas-base-echo 特殊处理
        if (widgetConfig.content !== undefined) {
          dataValue.content = widgetConfig.content
          delete dataValue.data
        }
        // canvas-base-log 特殊处理
        if (widgetConfig.logs !== undefined) {
          dataValue.logs = widgetConfig.logs
          delete dataValue.data
        }

        this.emitMessage({
          type: 'ui',
          conversationId: this.conversationId,
          event: {
            messageId: `msg-all-widgets-${index}-` + Date.now(),
            value: {
              createSurface: {
                surfaceId: surfaceId
              },
              updateComponents: {
                surfaceId: surfaceId,
                components: [componentConfig]
              },
              updateDataModel: {
                surfaceId: surfaceId,
                path: '/',
                value: dataValue
              }
            },
            metadata: {
              preferredPlace: 'canvas',
              surfaceGroup: '所有Widget类型展示'
            }
          }
        })
      })

      console.log('创建了', allWidgetTypes.length, '个不同类型的widget')
    }
  }
}
</script>

<style lang="less" scoped>
.test-panel {
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  flex-wrap: wrap;
}
</style>