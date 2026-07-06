<template>
  <div class="flex h-screen w-screen overflow-hidden bg-kiosk-bg text-white font-sans">
    <template v-if="isTrainingFullscreen">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" :key="route.path" />
        </transition>
      </router-view>
    </template>

    <template v-else>
      <div id="global-background" class="absolute inset-0 z-0">
        <div class="absolute inset-0 bg-kiosk-bg/80 backdrop-blur-sm"></div>
      </div>

      <aside class="z-10 flex w-[280px] flex-col justify-between glass-panel border-y-0 border-l-0">
        <div class="p-8 pb-4">
          <h1 class="text-4xl font-bold tracking-tighter">{{ sidebarTime }}</h1>
          <p class="text-sm text-gray-400 font-medium mt-1">{{ sidebarDate }}</p>
        </div>

        <nav class="flex-1 px-4 py-8 space-y-4">
          <button 
            @click="$router.push('/home')"
            class="w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-bold text-xl transition-all"
            :class="$route.path === '/home' ? 'bg-white/10 border border-white/5 text-neon-green shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white group'"
          >
            <Home class="w-7 h-7 transition-colors" :class="$route.path === '/home' ? '' : 'text-gray-500 group-hover:text-neon-green'" :stroke-width="$route.path === '/home' ? 2.5 : 2" />
            <span>主页</span>
          </button>

          <button 
            @click="$router.push('/activity')"
            class="w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-bold text-xl transition-all"
            :class="$route.path === '/activity' ? 'bg-neon-orange/20 border border-neon-orange/40 text-white shadow-[0_0_16px_rgba(255,159,67,0.25)]' : 'text-gray-400 hover:bg-white/5 hover:text-white group'"
          >
            <Activity class="w-7 h-7 transition-colors" :class="$route.path === '/activity' ? 'text-neon-orange' : 'text-gray-500 group-hover:text-neon-orange'" :stroke-width="$route.path === '/activity' ? 2.5 : 2" />
            <span>运动</span>
          </button>

          <button 
            @click="$router.push('/profile')"
            class="w-full flex items-center gap-4 px-6 py-5 rounded-2xl text-gray-400 hover:bg-white/5 hover:text-white font-semibold text-xl transition-all group"
            :class="$route.path === '/profile' ? 'bg-white/10 border border-white/5 text-white shadow-lg' : 'text-gray-400 hover:bg-white/5 hover:text-white group'"
          >
            <User class="w-7 h-7 transition-colors" :class="$route.path === '/profile' ? 'text-white' : 'text-gray-500 group-hover:text-white'" :stroke-width="$route.path === '/profile' ? 2.5 : 2" />
            <span>我</span>
          </button>

          <button
            @click="switchAccount"
            class="w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-semibold text-xl transition-all text-gray-400 hover:bg-white/5 hover:text-white group"
          >
            <LogOut class="w-7 h-7 transition-colors text-gray-500 group-hover:text-neon-pink" :stroke-width="2" />
            <span>切换账号</span>
          </button>
        </nav>
      </aside>

      <main class="relative z-10 flex-1 p-8 overflow-hidden">
        <div
          class="h-full w-full rounded-[40px] relative overflow-hidden"
          :class="route.path === '/activity' ? 'bg-transparent border border-white/10' : 'glass-panel-light'"
        >
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" :key="route.path" />
            </transition>
          </router-view>
        </div>
      </main>

      <AIVoiceAssistant :isPlaying="isVoicePlaying" :speechText="voiceDisplayText" />
    </template>

  </div>
</template>

<script setup>
import { computed, ref, provide, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Home, Activity, User, LogOut } from '@lucide/vue'
import AIVoiceAssistant from './components/AIVoiceAssistant.vue'

const route = useRoute()
const router = useRouter()
const isTrainingFullscreen = computed(() => route.path === '/training-session')
const IDLE_TIMEOUT_MS = 2 * 60 * 1000
let idleTimer = null

const sidebarTime = ref('--:--')
const sidebarDate = ref('--')
let clockTimer = null

const updateSidebarClock = () => {
  const now = new Date()
  sidebarTime.value = now.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  const weekday = now.toLocaleDateString('zh-CN', { weekday: 'long' })
  const monthDay = now.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })
  sidebarDate.value = `${weekday}，${monthDay}`
}

const isVoicePlaying = ref(false)
let voiceTimer = null 
const voiceDisplayText = ref('')
let voiceStreamTimer = null

const clearVoiceStream = () => {
  if (voiceStreamTimer) {
    clearInterval(voiceStreamTimer)
    voiceStreamTimer = null
  }
}

const switchAccount = () => {
  localStorage.removeItem('auth_token')
  sessionStorage.removeItem('welcome_voice_pending')
  router.push('/')
}

const clearIdleTimer = () => {
  if (idleTimer) {
    clearTimeout(idleTimer)
    idleTimer = null
  }
}

const shouldTrackIdle = computed(() => {
  return route.path === '/home' && !!localStorage.getItem('auth_token')
})

const resetIdleTimer = () => {
  if (!shouldTrackIdle.value) {
    clearIdleTimer()
    return
  }

  clearIdleTimer()
  idleTimer = setTimeout(() => {
    switchAccount()
  }, IDLE_TIMEOUT_MS)
}

const handleUserActivity = () => {
  resetIdleTimer()
}

// durationSec：允许传入精确的秒数
const playVoice = (text, durationSec = null) => {
  isVoicePlaying.value = true
  const safeText = typeof text === 'string' ? text : ''
  voiceDisplayText.value = ''

  clearVoiceStream()
  let index = 0
  voiceStreamTimer = setInterval(() => {
    index += 1
    voiceDisplayText.value = safeText.slice(0, index)
    if (index >= safeText.length) {
      clearVoiceStream()
    }
  }, 55)
  
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
  clearVoiceStream()
  if (voiceTimer) {
    clearTimeout(voiceTimer)
    voiceTimer = null
  }
}

// 供全局注入
provide('playVoice', playVoice)
provide('stopVoice', stopVoice)

onMounted(() => {
  updateSidebarClock()
  clockTimer = setInterval(updateSidebarClock, 1000)

  window.addEventListener('pointerdown', handleUserActivity)
  window.addEventListener('keydown', handleUserActivity)
  window.addEventListener('touchstart', handleUserActivity)
  window.addEventListener('wheel', handleUserActivity, { passive: true })

  resetIdleTimer()
})

watch(() => route.path, () => {
  resetIdleTimer()
})

onBeforeUnmount(() => {
  if (clockTimer) {
    clearInterval(clockTimer)
    clockTimer = null
  }

  window.removeEventListener('pointerdown', handleUserActivity)
  window.removeEventListener('keydown', handleUserActivity)
  window.removeEventListener('touchstart', handleUserActivity)
  window.removeEventListener('wheel', handleUserActivity)

  clearIdleTimer()

  clearVoiceStream()
  if (voiceTimer) {
    clearTimeout(voiceTimer)
    voiceTimer = null
  }
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.35s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>