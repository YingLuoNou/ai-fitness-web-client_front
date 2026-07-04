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

      <div class="p-6">
        <div class="flex items-center gap-4 p-4 rounded-3xl bg-gradient-to-r from-ai-start/20 to-ai-end/20 border border-ai-start/30 backdrop-blur-xl">
          <div class="relative w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-tr from-ai-start to-ai-end shadow-[0_0_15px_rgba(123,44,191,0.6)]">
            <div class="absolute inset-0 rounded-full animate-breath border border-white/30"></div>
            <Mic class="w-5 h-5 text-white absolute z-10" stroke-width="2.5" />
          </div>
          <div class="flex-1">
            <p class="text-sm font-bold text-white/90">AI 教练</p>
            <p class="text-xs text-white/50 tracking-wider">待机中...</p>
          </div>
        </div>
      </div>
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

  </div>
</template>

<script setup>
// import LoginScreen from './components/LoginScreen.vue'
import { Home, Activity, User, Mic, ScanFace } from '@lucide/vue'
const isVoicePlaying = ref(false)
const playVoice = (text) => {
  isVoicePlaying.value = true
  // 这里写死播放逻辑或调用 TTS 后端，播放结束后设回 false
  setTimeout(() => { isVoicePlaying.value = false }, 3000) 
}
// 通过 provide 注入，让所有子页面都能控制 AI 语音
provide('playVoice', playVoice)
</script>

<template>
  <AIVoiceAssistant :isPlaying="isVoicePlaying" />
  
  <router-view v-slot="{ Component }">
    <transition name="fade" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>