<template>
  <div class="flex h-screen w-screen overflow-hidden bg-kiosk-bg text-white font-sans">
    
    <div id="global-background" class="absolute inset-0 z-0">
      <div class="absolute inset-0 bg-kiosk-bg/80 backdrop-blur-sm"></div>
    </div>

    <aside class="z-10 flex w-[280px] flex-col justify-between glass-panel border-y-0 border-l-0">
      <div class="p-8 pb-4">
        <h1 class="text-4xl font-bold tracking-tighter">14:30</h1>
        <p class="text-sm text-gray-400 font-medium mt-1">周四, 10月24日</p>
      </div>

      <nav class="flex-1 px-4 py-8 space-y-4">
        <button class="w-full flex items-center gap-4 px-6 py-5 rounded-2xl bg-white/10 border border-white/5 text-neon-green font-bold text-xl transition-all shadow-lg">
          <Home class="w-7 h-7" stroke-width="2.5" />
          <span>主页</span>
        </button>

        <button class="w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-gray-400 hover:bg-white/5 hover:text-white font-semibold text-xl transition-all group">
          <Activity class="w-7 h-7 text-gray-500 group-hover:text-neon-orange transition-colors" stroke-width="2" />
          <span>运动</span>
        </button>

        <button class="w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-gray-400 hover:bg-white/5 hover:text-white font-semibold text-xl transition-all group">
          <User class="w-7 h-7 text-gray-500 group-hover:text-white transition-colors" stroke-width="2" />
          <span>我</span>
        </button>
      </nav>
      </aside>

    <main class="relative z-10 flex-1 p-8 overflow-hidden">
      <div class="h-full w-full rounded-[40px] glass-panel-light relative overflow-hidden">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
    
    <AIVoiceAssistant :isPlaying="isVoicePlaying" />

  </div>
</template>

<script setup>
import { ref, provide } from 'vue'
import { Home, Activity, User } from '@lucide/vue'
import AIVoiceAssistant from './components/AIVoiceAssistant.vue'

const isVoicePlaying = ref(false)
let voiceTimer = null 

// durationSec：允许传入精确的秒数
const playVoice = (text, durationSec = null) => {
  isVoicePlaying.value = true
  
  if (voiceTimer) {
    clearTimeout(voiceTimer)
  }
  
  // 如果后端传了准确时长，则转换为毫秒；如果没有传，给个兜底 10 秒防卡死
  const timeoutMs = durationSec !== null ? (durationSec * 1000) : 10000

  voiceTimer = setTimeout(() => { 
    isVoicePlaying.value = false 
  }, timeoutMs) 
}

// 新增：强制提前停止动效的方法
const stopVoice = () => {
  isVoicePlaying.value = false
  if (voiceTimer) {
    clearTimeout(voiceTimer)
    voiceTimer = null
  }
}

// 供全局注入
provide('playVoice', playVoice)
provide('stopVoice', stopVoice)
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>