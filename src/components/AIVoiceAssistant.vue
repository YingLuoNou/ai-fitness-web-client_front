<template>
  <div class="fixed bottom-8 left-2 z-50">
    <div 
      class="flex items-center gap-4 p-4 rounded-3xl backdrop-blur-xl border transition-all duration-500 shadow-2xl relative overflow-hidden"
      :class="isPlaying ? 'bg-black/90 border-ai-start/60 w-[320px] scale-[1.02] translate-x-2' : 'bg-white/5 border-white/10 w-[260px]'"
    >
      <div 
        class="relative w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full transition-all duration-500 z-10"
        :class="isPlaying ? 'bg-gradient-to-tr from-ai-start to-ai-end shadow-[0_0_25px_rgba(123,44,191,0.8)]' : 'bg-gradient-to-tr from-ai-start/30 to-ai-end/30'"
      >
        <div v-if="isPlaying" class="absolute inset-0 rounded-full border-2 border-purple-400 animate-ping opacity-75"></div>
        <div v-if="!isPlaying" class="absolute inset-0 rounded-full border border-white/30 animate-breath"></div>

        <AudioLines v-if="isPlaying" class="w-6 h-6 text-white animate-pulse" stroke-width="2.5" />
        <Mic v-else class="w-6 h-6 text-white/80" stroke-width="2" />
      </div>

      <div class="flex-1 flex items-center justify-between h-8 z-10 pr-1">
        
        <div class="flex flex-col justify-center flex-1 overflow-hidden pr-3">
          <span :class="['text-sm font-bold transition-colors duration-300 truncate', isPlaying ? 'text-white' : 'text-white/80']">
            AI 教练
          </span>
          <span :class="['text-xs tracking-wider transition-colors duration-300 mt-0.5 truncate', isPlaying ? 'text-neon-green font-medium' : 'text-white/50 uppercase']">
            {{ isPlaying ? '说话中...' : '...' }}
          </span>
          <span v-if="speechText" class="text-xs mt-1 text-white/75 line-clamp-2">{{ speechText }}</span>
        </div>

        <div v-if="isPlaying" class="flex items-center gap-[3px] h-6 flex-shrink-0">
          <div v-for="i in 5" :key="i" 
               class="w-1.5 rounded-full bg-neon-green animate-soundwave origin-bottom"
               :style="{ animationDelay: `${i * 0.15}s`, height: `${Math.random() * 50 + 50}%` }">
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { Mic, AudioLines } from '@lucide/vue'
import { defineProps } from 'vue'

const props = defineProps({
  isPlaying: {
    type: Boolean,
    default: false
  },
  speechText: {
    type: String,
    default: ''
  }
})
</script>

<style scoped>
.animate-soundwave {
  animation: soundwave 0.8s ease-in-out infinite;
}
</style>