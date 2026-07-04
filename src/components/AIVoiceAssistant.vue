<template>
  <div class="fixed bottom-8 left-8 z-50">
    <div 
      class="flex items-center gap-4 p-4 rounded-3xl backdrop-blur-xl border transition-all duration-500 shadow-2xl"
      :class="isPlaying ? 'bg-black/80 border-ai-start/50 w-64' : 'bg-white/5 border-white/10 w-64'"
    >
      <div 
        class="relative w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-tr from-ai-start to-ai-end shadow-[0_0_20px_rgba(123,44,191,0.5)] transition-all duration-500"
        :class="isPlaying ? 'scale-110' : 'scale-100'"
      >
        <div class="absolute inset-0 rounded-full border border-white/30" :class="isPlaying ? 'animate-breath' : ''"></div>
        <Mic class="w-6 h-6 text-white" :stroke-width="isPlaying ? 3 : 2" />
      </div>

      <div class="flex-1 flex items-center justify-center gap-1.5 h-8">
        <template v-if="isPlaying">
          <div v-for="i in 5" :key="i" 
               class="w-2 rounded-full bg-neon-green animate-soundwave"
               :style="{ animationDelay: `${i * 0.15}s`, height: `${Math.random() * 60 + 20}%` }">
          </div>
        </template>
        <div v-else class="text-sm font-bold text-white/50 tracking-widest uppercase">
          AI 待机中
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Mic } from '@lucide/vue'
import { defineProps } from 'vue'

// 通过 props 接收父组件（App.vue）传递的播放状态
defineProps({
  isPlaying: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
/* 频谱跳动动画在 style.css 中已定义，这里确保 soundwave 正常工作 */
.animate-soundwave {
  animation: soundwave 0.8s ease-in-out infinite;
}
</style>