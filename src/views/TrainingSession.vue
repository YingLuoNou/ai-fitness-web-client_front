<template>
  <div class="relative w-full h-full bg-black overflow-hidden text-white">
    <video
      ref="videoRef"
      class="absolute inset-0 w-full h-full object-cover"
      autoplay
      playsinline
      muted
    ></video>

    <div class="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40"></div>

    <div class="absolute top-6 left-6 right-6 flex items-start justify-between z-10">
      <div class="glass-panel rounded-2xl p-4 min-w-[280px]">
        <p class="text-sm text-gray-300 tracking-wider">实时体征</p>
        <p class="text-3xl font-mono font-bold mt-2 text-neon-red">{{ metrics.heartRate }} bpm</p>
        <p class="text-xl font-mono mt-1 text-neon-green">SpO₂ {{ metrics.spo2 }}%</p>
      </div>

      <div class="glass-panel-light rounded-2xl p-5 text-right min-w-[320px]">
        <p class="text-sm text-gray-300 tracking-wider">训练进度</p>
        <p class="text-5xl font-black tracking-tighter mt-1">{{ currentRep }} / {{ targetRep }}</p>
        <p class="text-base text-gray-300 mt-1">第 {{ currentSet }} 组 / 共 {{ totalSets }} 组</p>
      </div>
    </div>

    <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-[72%]">
      <div class="glass-panel-light rounded-3xl px-8 py-5 flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-300 tracking-wider">AI 提示</p>
          <p class="text-2xl font-bold mt-1">{{ coachTip }}</p>
        </div>
        <div class="flex gap-3">
          <button class="px-5 py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/15">暂停</button>
          <button @click="goHome" class="px-5 py-3 rounded-xl bg-neon-red/30 border border-neon-red/50 hover:bg-neon-red/40">结束</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchTrainSessionState, finishTrainSession } from '../api/train'

const router = useRouter()
const route = useRoute()
const playVoice = inject('playVoice')
const stopVoice = inject('stopVoice')

const videoRef = ref(null)
let stream = null
const sessionId = ref(route.query.sessionId || '')

const totalSets = ref(3)
const currentSet = ref(1)
const targetRep = ref(20)
const currentRep = ref(0)
const coachTip = ref('保持核心收紧，动作速度均匀。')

const metrics = reactive({
  heartRate: 102,
  spo2: 98
})

let fakeTimer = null
let pollTimer = null
const isFinishing = ref(false)

const phaseLabelMap = {
  WORK: '动作进行中，保持节奏。',
  REST: '组间休息中，注意呼吸恢复。',
  END: '训练结束，正在恢复。'
}

const startCamera = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, facingMode: 'user' },
      audio: false
    })
    if (videoRef.value) {
      videoRef.value.srcObject = stream
    }
  } catch (err) {
    coachTip.value = '摄像头未就绪，请检查设备连接。'
  }
}

const stopCamera = () => {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop())
    stream = null
  }
}

const startMockData = () => {
  fakeTimer = setInterval(() => {
    if (currentRep.value < targetRep.value) {
      currentRep.value += 1
    } else {
      currentRep.value = 0
      if (currentSet.value < totalSets.value) {
        currentSet.value += 1
        coachTip.value = '组间休息 45 秒，调整呼吸。'
      } else {
        coachTip.value = '本次训练已完成，建议进行拉伸恢复。'
      }
    }

    metrics.heartRate = Math.min(165, metrics.heartRate + Math.round(Math.random() * 3 - 1))
    metrics.spo2 = Math.max(95, Math.min(100, metrics.spo2 + Math.round(Math.random() * 2 - 1)))
  }, 1600)
}

const stopMockData = () => {
  if (fakeTimer) {
    clearInterval(fakeTimer)
    fakeTimer = null
  }
}

const fetchSessionState = async () => {
  if (!sessionId.value) return

  try {
    const data = await fetchTrainSessionState(sessionId.value)
    if (data.status === 'FINISHED') {
      stopPolling()
      await goHome()
      return
    }

    metrics.heartRate = data.heart_rate ?? metrics.heartRate
    metrics.spo2 = data.spo2 ?? metrics.spo2
    currentRep.value = data.current_rep ?? currentRep.value
    targetRep.value = data.target_reps ?? data.target_rep ?? targetRep.value
    currentSet.value = data.current_set ?? currentSet.value
    totalSets.value = data.total_sets ?? totalSets.value
    coachTip.value = data.coach_message || phaseLabelMap[data.phase] || data.tip || coachTip.value
  } catch (error) {
    // 保持当前 UI，避免训练中断
  }
}

const startPolling = () => {
  if (!sessionId.value) return
  pollTimer = setInterval(fetchSessionState, 1000)
}

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

const finishSession = async () => {
  if (!sessionId.value || isFinishing.value) return
  isFinishing.value = true
  try {
    await finishTrainSession(sessionId.value)
  } catch (error) {
    // 忽略结束请求失败，保证可返回主页
  } finally {
    isFinishing.value = false
  }
}

const goHome = async () => {
  await finishSession()
  router.push('/home')
}

onMounted(() => {
  startCamera()
  if (sessionId.value) {
    startPolling()
    fetchSessionState()
  } else {
    startMockData()
  }

  if (playVoice) {
    playVoice('训练已开始，请保持动作标准。')
  }
})

onBeforeUnmount(() => {
  stopCamera()
  stopMockData()
  stopPolling()
  if (stopVoice) stopVoice()
})
</script>
