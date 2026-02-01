<template>
  <div class="widget-wrapper" :class="`widget-${animationType}`">
    <component
      v-if="isDev"
      :is="widgetId"
      class="widget-component"
      :surface-id="surfaceId"
      :data="JSON.stringify(data)"
      :resize="resize"
      :lang="lang"
      :theme="theme"
      v-bind="config"
      @refreshWidget="refreshWidget"
    />
    <render-template
      v-else
      class="widget-component"
      :surface-id="surfaceId"
      :data="data"
      :config="config"
      :resize="resizeFlag"
      :lang="lang"
      :theme="theme"
      @refreshWidget="refreshWidget"
    />
  </div>
</template>

<script>
import Vue from 'vue'

Vue.component('render-template', {
  render(createElement) {
    return createElement(this.widgetId, {
      attrs: {
        surfaceId: this.surfaceId,
        data: JSON.stringify(this.data),
        config: JSON.stringify(this.config),
        lang: this.lang,
        theme: this.theme,
        resize: this.resize
      },
      on: {
        refreshWidget: this.refreshWidget
      }
    })
  },
  props: {
    surfaceId: {
      type: [String, Number]
    },
    data: {
      type: [Object, Array],
      default: () => ({})
    },
    config: {
      type: Object,
      default: () => ({})
    },
    lang: {
      type: String,
      default: 'zh'
    },
    theme: {
      type: String,
      default: 'star'
    },
    resize: {
      type: Boolean
    },
    widgetId: {
      type: String
    }
  },
  methods: {
    refreshWidget(param) {
      this.$emit('refreshWidget', param)
    }
  }
})

export default {
  name: 'Widget',
  props: {
    widgetId: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: ''
    },
    surfaceId: {
      type: [String, Number],
      default: ''
    },
    data: {
      type: [Object, Array],
      default: () => ({})
    },
    config: {
      type: Object,
      default: () => ({})
    },
    resize: {
      type: Boolean
    },
    lang: {
      type: String,
      default: 'zh-CN'
    },
    theme: {
      type: String,
      default: 'star'
    },
    animationType: {
      type: String,
      default: 'scale-up'
    }
  },
  data() {
    return {
      resizeFlag: false,
      isDev: process.env.NODE_ENV === 'development'
    }
  },
  methods: {
    refreshWidget(param) {
      this.$emit('refreshWidget', param)
    }
  },
  mounted() {
    // 初始挂载逻辑
  },
  watch: {
    resize() {
      setTimeout(() => {
        this.resizeFlag = !this.resizeFlag
      })
    }
  }
}
</script>

<style scoped lang="less">
.widget-wrapper {
  width: 100%;
  height: 100%;
  
  .widget-component {
    width: 100%;
    height: 100%;
  }
  
  &.widget-fade-in {
    animation: widget-fade-in 0.5s ease-out forwards;
  }
  
  &.widget-scale-up {
    animation: widget-scale-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }
  
  &.widget-slide-up {
    animation: widget-slide-up 0.4s ease-out forwards;
  }
  
  &.widget-slide-left {
    animation: widget-slide-left 0.4s ease-out forwards;
  }
  
  &.widget-bounce {
    animation: widget-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards;
  }
  
  &.widget-flip {
    animation: widget-flip 0.6s ease-out forwards;
  }
}

@keyframes widget-fade-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}

@keyframes widget-scale-up {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes widget-slide-up {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes widget-slide-left {
  0% {
    opacity: 0;
    transform: translateX(-30px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes widget-bounce {
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes widget-flip {
  0% {
    opacity: 0;
    transform: perspective(1000px) rotateY(-90deg);
  }
  100% {
    opacity: 1;
    transform: perspective(1000px) rotateY(0);
  }
}

.chartwrapper {
  width: 100%;
  height: 100%;
}
</style>