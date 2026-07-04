<template>
  <div class="w-full h-full p-8 flex flex-col relative">
    
    <header class="flex justify-between items-end mb-10">
      <div>
        <h2 class="text-5xl font-bold tracking-tight mb-2">晚上好, <span class="text-neon-green">{{ dashboardData.user_info.username }}</span></h2>
        <p class="text-xl text-gray-400 font-medium">今天有一组训练计划等待完成，准备好流汗了吗？</p>
      </div>
      <div class="text-right">
        <p class="text-4xl font-mono text-white tracking-widest">{{ currentTime }}</p>
      </div>
    </header>

    <div class="flex-1 grid grid-cols-12 gap-8 h-full pb-6">
      
      <div class="col-span-5 glass-panel rounded-[2rem] flex flex-col items-center justify-center relative shadow-2xl p-6 overflow-hidden">
        <h3 class="absolute top-8 left-8 text-2xl font-bold tracking-widest text-gray-300">今日完成度</h3>
        
        <div class="relative w-72 h-72 flex items-center justify-center mt-4">
          <svg viewBox="0 0 100 100" class="w-full h-full transform -rotate-90 drop-shadow-[0_0_20px_rgba(50,255,126,0.3)]">
            <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.05)" stroke-width="8" fill="none" />
            <circle 
              cx="50" cy="50" r="42" 
              stroke="#32FF7E" stroke-width="8" fill="none" 
              stroke-dasharray="264" 
              :stroke-dashoffset="264 - (264 * dashboardData.plan_status.progress_percent / 100)" 
              stroke-linecap="round" 
              class="transition-all duration-[2000ms] ease-out" 
            />
          </svg>
          <div class="absolute flex flex-col items-center justify-center text-center">
            <span class="text-7xl font-black tracking-tighter text-white">{{ dashboardData.plan_status.progress_percent }}<span class="text-3xl">%</span></span>
            <span class="text-gray-400 font-medium mt-1 tracking-widest">PROGRESS</span>
          </div>
        </div>

        <div class="absolute bottom-10 w-full px-10 flex justify-between text-center items-center">
          <div>
            <p class="text-gray-400 text-sm tracking-wider mb-2">近7日耗时</p>
            <p class="text-2xl font-bold text-white"><span class="text-neon-orange mr-1 text-3xl">{{ dashboardData.weekly_duration_mins }}</span>MIN</p>
          </div>
          <div class="w-[2px] h-12 bg-white/10 rounded-full"></div>
          <div>
            <p class="text-gray-400 text-sm tracking-wider mb-2">身体指数 BMI</p>
            <p class="text-2xl font-bold text-white" :class="bmiStatusColor">{{ bmiValue }}</p>
          </div>
        </div>
      </div>

      <div class="col-span-7 flex flex-col gap-6">
        
        <div class="flex-1 glass-panel rounded-[2rem] p-8 flex flex-col shadow-xl">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-bold tracking-widest flex items-center gap-3">
              <span class="w-3 h-8 bg-neon-green rounded-full shadow-[0_0_10px_#32FF7E]"></span>
              今日 AI 专属计划
            </h3>
            <span v-if="dashboardData.plan_status.is_completed && dashboardData.plan_status.today_exercises.length > 0" class="px-5 py-2 rounded-full bg-neon-green/20 text-neon-green text-sm font-bold border border-neon-green/30">
              ✅ 全目标达成
            </span>
          </div>
          
          <div class="flex-1 overflow-y-auto space-y-4 pr-2">
            <template v-if="dashboardData.plan_status.today_exercises.length > 0">
              <div v-for="(exercise, index) in dashboardData.plan_status.today_exercises" :key="index" 
                   class="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <div class="flex items-center gap-5">
                  <div class="w-14 h-14 rounded-full bg-black/40 flex items-center justify-center border border-white/10 text-2xl">
                    {{ getExerciseIcon(exercise.type) }}
                  </div>
                  <div>
                    <p class="text-2xl font-bold tracking-wider">{{ getExerciseName(exercise.type) }}</p>
                    <p class="text-gray-400 mt-1">单组建议: {{ (exercise.target / (exercise.sets || 1)).toFixed(0) || exercise.target }} 次 / 共 {{ exercise.sets || 1 }} 组</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-3xl font-mono font-bold" :class="exercise.is_done ? 'text-neon-green' : 'text-white'">
                    {{ exercise.actual }} <span class="text-lg text-gray-500">/ {{ exercise.target }}</span>
                  </p>
                </div>
              </div>
            </template>
            
            <div v-else class="h-full flex flex-col items-center justify-center text-gray-400 opacity-80">
              <span class="text-6xl mb-4">☕️</span>
              <p class="text-2xl font-bold tracking-widest">今日为修复日</p>
              <p class="text-lg mt-2">肌肉正在重组，好好休息一天吧</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6 h-32">
          <button 
            :disabled="dashboardData.plan_status.is_completed || dashboardData.plan_status.today_exercises.length === 0"
            class="rounded-[2rem] flex flex-col items-center justify-center group transition-all"
            :class="(dashboardData.plan_status.is_completed || dashboardData.plan_status.today_exercises.length === 0) ? 'bg-white/5 border border-white/10 text-gray-500' : 'btn-neon-primary shadow-[0_0_20px_rgba(50,255,126,0.3)]'"
          >
            <span class="text-2xl font-black tracking-widest group-active:scale-95 transition-transform">启动今日计划</span>
            <span class="text-sm font-bold mt-2 tracking-wider group-active:scale-95 transition-transform" :class="(dashboardData.plan_status.is_completed || dashboardData.plan_status.today_exercises.length === 0) ? 'text-gray-600' : 'text-black/60'">AI 指导 & 动作矫正</span>
          </button>
          
          <button class="bg-white/10 hover:bg-white/20 active:bg-white/5 border border-white/20 rounded-[2rem] flex flex-col items-center justify-center transition-all group shadow-lg">
            <span class="text-2xl font-bold tracking-widest text-white group-active:scale-95 transition-transform">自由训练</span>
            <span class="text-sm text-gray-400 font-medium mt-2 tracking-wider group-active:scale-95 transition-transform">自选动作，随心记录</span>
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount, computed, inject } from 'vue'
import { useRouter } from 'vue-router'
const playVoice = inject('playVoice')

const router = useRouter()
const API_BASE_URL = 'http://127.0.0.1:8000'

// --- 时钟逻辑 ---
const currentTime = ref('')
let timeInterval = null

const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// --- 数据模型 ---
const dashboardData = reactive({
  user_info: { username: '用户', gender: 'O', height: 170, weight: 65 },
  weekly_duration_mins: 0,
  plan_status: {
    active_plan_id: null,
    is_completed: false,
    progress_percent: 0,
    today_exercises: []
  }
})

// --- 动态计算 BMI ---
const bmiValue = computed(() => {
  const heightM = dashboardData.user_info.height / 100
  const weight = dashboardData.user_info.weight
  if (heightM > 0) {
    const bmi = weight / (heightM * heightM)
    return bmi.toFixed(1)
  }
  return '22.0'
})

const bmiStatusColor = computed(() => {
  const bmi = parseFloat(bmiValue.value)
  if (bmi < 18.5) return 'text-neon-orange' // 偏瘦
  if (bmi >= 18.5 && bmi < 24) return 'text-neon-green' // 正常
  return 'text-neon-red' // 偏胖
})

// --- 动作字典翻译 ---
const exerciseDict = {
  squat: { name: '深蹲', icon: '🦵' },
  push_up: { name: '俯卧撑', icon: '💪' },
  pull_up: { name: '引体向上', icon: '🦍' },
  plank: { name: '平板支撑', icon: '🧱' },
  jumping_jack: { name: '开合跳', icon: '🏃' }
}
const getExerciseName = (type) => exerciseDict[type]?.name || type
const getExerciseIcon = (type) => exerciseDict[type]?.icon || '🔥'

// --- 核心方法：拉取数据 ---
const fetchDashboardData = async () => {
  const token = localStorage.getItem('auth_token')
  if (!token) {
    router.push('/')
    return
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/user/dashboard/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const data = await response.json()
      Object.assign(dashboardData, data) // 更新界面

      // 数据加载成功后，触发系统硬件语音
      triggerWelcomeVoice(data.user_info.username, data.plan_status)
    } else {
      // Token 失效或其他错误
      localStorage.removeItem('auth_token')
      router.push('/')
    }
  } catch (err) {
    console.error('主页拉取数据失败:', err)
  }
}

// --- 核心方法：触发后端直出硬件语音 ---
const triggerWelcomeVoice = async (username, planStatus) => {
  const token = localStorage.getItem('auth_token')
  
  let textToSpeak = ''
  if (planStatus.today_exercises.length === 0) {
    textToSpeak = `欢迎回来，${username}。今天是休息日，好好放松一下肌肉吧。`
  } else if (planStatus.is_completed) {
    textToSpeak = `干得漂亮，${username}！你已经完成了今天所有的训练任务，真是自律的一天。`
  } else {
    textToSpeak = `欢迎回来，${username}。今天还有 ${100 - planStatus.progress_percent}% 的进度未完成，请点击启动今日计划。`
  }
  
  // 1. 发起请求前，先触发一次动效，让UI瞬间响应
  playVoice(textToSpeak)
  const startTime = Date.now() // 记录请求开始时间戳

  try {
    const response = await fetch(`${API_BASE_URL}/api/train/tts-play/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ 
        text: textToSpeak,
        voice: 'zh-CN-YunxiNeural' 
      })
    })

    if (response.ok) {
      const data = await response.json()
      
      // 2. 接口返回后，计算请求耗掉了多少秒
      const elapsedSec = ((Date.now() - startTime) / 1000 ) 
      
      if (data.duration) {
        // 计算音频真正的剩余播放时间
        const remainingSec = data.duration - elapsedSec + 2.5
        
        if (remainingSec > 0) {
          // 如果音频还没播完，更新动效定时器，补齐剩余时间
          playVoice(textToSpeak, remainingSec)
        } else {
          // 如果请求耗时超过了音频时长（例如后端的 play_tts_sync 是阻塞播完才返回），直接停止动效
          stopVoice()
        }
      }
    } else {
      stopVoice() // 非200响应，停止动效
    }
  } catch (err) {
    console.error('触发入场语音失败:', err)
    stopVoice() // 网络异常，停止动效
  }
}

onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
  fetchDashboardData() // 进入页面即拉取
})

onBeforeUnmount(() => {
  if (timeInterval) clearInterval(timeInterval)
})
</script>