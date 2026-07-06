<template>
  <div class="relative w-full h-full bg-black overflow-hidden text-white">
    <img
      v-if="poseStreamUrl"
      :src="poseStreamUrl"
      @load="onPoseStreamLoaded"
      @error="onPoseStreamError"
      class="absolute inset-0 w-full h-full object-cover"
      alt="pose stream"
    />
    <div v-else class="absolute inset-0 w-full h-full flex items-center justify-center text-gray-300">
      /pose/image 视频流未配置
    </div>
    <div v-if="poseStreamError" class="absolute inset-0 w-full h-full flex items-center justify-center text-red-300 bg-black/30 z-10 pointer-events-none">
      ROS 图像流断开，请检查 /pose/image 与 mjpeg 服务
    </div>

    <div class="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40"></div>

    <div class="absolute top-6 left-6 right-6 flex items-start justify-between z-10">
      <div class="glass-panel rounded-2xl p-4 min-w-[280px]">
        <p class="text-sm text-gray-300 tracking-wider">实时体征</p>
        <p class="text-3xl font-mono font-bold mt-2 text-neon-red">{{ metrics.heartRate }} bpm</p>
        <p class="text-xl font-mono mt-1 text-neon-green">SpO₂ {{ metrics.spo2 }}%</p>
        <p v-if="stableSampling.active" class="mt-2 text-sm text-neon-orange font-semibold">采集中，请尽量保持静止</p>
      </div>

      <div class="glass-panel-light rounded-2xl p-5 text-right min-w-[320px]">
        <p class="text-sm text-gray-300 tracking-wider">训练进度（累计）</p>
        <p class="text-5xl font-black tracking-tighter mt-1">{{ currentRep }} / {{ totalTargetReps }}</p>
        <p class="text-base text-gray-300 mt-1">第 {{ currentSet }} 组 / 共 {{ totalSets }} 组 · 每组 {{ repsPerSet }} 次</p>
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
import { inject, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import * as ROSLIB from 'roslib'
import { fetchTrainSessionState, finishTrainSession, ingestTrainSessionRealtime } from '../api/train'
import { fetchRosRuntimeConfig } from '../api/runtime'

const router = useRouter()
const route = useRoute()
const playVoice = inject('playVoice')
const stopVoice = inject('stopVoice')

const poseStreamUrl = ref('')
const poseStreamError = ref(false)
const sessionId = ref(route.query.sessionId || '')

const totalSets = ref(Number(route.query.sets) || 3)
const currentSet = ref(1)
const repsPerSet = ref(Number(route.query.reps) || 20)
const totalTargetReps = ref(totalSets.value * repsPerSet.value)
const currentRep = ref(0)
const coachTip = ref('保持核心收紧，动作速度均匀。')
const runtimeMode = ref('windows_debug')
const rosDebugMode = ref(true)
const sessionRealtimeSourceMode = ref('simulated')

const perceivedExertion = ref(3)
const errorCount = ref(0)

const metrics = reactive({
  heartRate: 102,
  spo2: 98
})

const sessionStartedAt = ref(0)
const phaseEnteredAt = ref(0)
const currentPhase = ref('WORK')
const stableSampling = reactive({
  active: false,
  phase: '',
  startedAt: 0,
  samples: []
})
const timeSeriesPayload = ref([])

// ROS 实时链路（实机模式）
const rosConn = shallowRef(null)
const rosConnected = ref(false)
const rosTopics = {
  squatControl: null,
  squatState: null,
  squatRepCompleted: null,
  squatErrors: null,
  heartControl: null,
  heartRate: null,
  heartSpo2: null
}

let fakeTimer = null
let pollTimer = null
let ingestTimer = null
const isFinishing = ref(false)

const phaseLabelMap = {
  WORK: '动作进行中，保持节奏。',
  REST: '组间休息中，注意呼吸恢复。',
  END: '训练结束，正在恢复。'
}

const onPoseStreamLoaded = () => {
  poseStreamError.value = false
}

const onPoseStreamError = () => {
  poseStreamError.value = true
}

const hydrateRuntimeConfig = async () => {
  try {
    const cfg = await fetchRosRuntimeConfig()
    runtimeMode.value = cfg?.runtime_mode || 'windows_debug'
    rosDebugMode.value = !!cfg?.debug_mode
    sessionRealtimeSourceMode.value = cfg?.session_realtime?.source_mode || 'simulated'
    poseStreamUrl.value = cfg?.active_profile?.mjpeg_stream_url || ''
    poseStreamError.value = false

    const topicState = cfg?.topics?.squat?.state || '/squat/state'
    const topicHeartRate = cfg?.topics?.heart?.heart_rate || '/heart_sensor_node/heart_rate'
    const topicLlm = cfg?.topics?.llm?.output_string || '/rkllm/output_string'

    console.info('[TrainingSession][ROS Runtime]', {
      runtimeMode: runtimeMode.value,
      debugMode: rosDebugMode.value,
      dataSource: rosDebugMode.value ? 'mock/debug' : 'real/ros',
      topics: {
        state: topicState,
        heartRate: topicHeartRate,
        llmOutput: topicLlm,
        poseImage: cfg?.topics?.pose_image || '/pose/image'
      },
      poseStreamUrl: poseStreamUrl.value
    })
  } catch (error) {
    runtimeMode.value = 'windows_debug'
    rosDebugMode.value = true
    poseStreamUrl.value = ''
    poseStreamError.value = true

    console.warn('[TrainingSession][ROS Runtime] fallback to default windows_debug', {
      runtimeMode: runtimeMode.value,
      debugMode: rosDebugMode.value,
      dataSource: 'mock/debug',
      topics: {
        state: '/squat/state',
        heartRate: '/heart_sensor_node/heart_rate',
        llmOutput: '/rkllm/output_string',
        poseImage: '/pose/image'
      },
      poseStreamUrl: '',
      error
    })
  }
}

const bindRosTopics = (cfg) => {
  if (!rosConn.value) return
  const topics = cfg?.topics || {}
  const squatTopicCfg = topics.squat || {}
  const heartTopicCfg = topics.heart || {}

  rosTopics.squatControl = new ROSLIB.Topic({
    ros: rosConn.value,
    name: squatTopicCfg.control || '/squat/control',
    messageType: 'std_msgs/Bool'
  })
  rosTopics.squatState = new ROSLIB.Topic({
    ros: rosConn.value,
    name: squatTopicCfg.state || '/squat/state',
    messageType: 'std_msgs/String'
  })
  rosTopics.squatRepCompleted = new ROSLIB.Topic({
    ros: rosConn.value,
    name: squatTopicCfg.rep_completed || '/squat/rep_completed',
    messageType: 'std_msgs/Int32'
  })
  rosTopics.squatErrors = new ROSLIB.Topic({
    ros: rosConn.value,
    name: squatTopicCfg.errors || '/squat/errors',
    messageType: 'std_msgs/String'
  })

  rosTopics.heartControl = new ROSLIB.Topic({
    ros: rosConn.value,
    name: heartTopicCfg.control || '/heart_sensor_node/control',
    messageType: 'std_msgs/Bool'
  })
  rosTopics.heartRate = new ROSLIB.Topic({
    ros: rosConn.value,
    name: heartTopicCfg.heart_rate || '/heart_sensor_node/heart_rate',
    messageType: 'std_msgs/Float32'
  })
  rosTopics.heartSpo2 = new ROSLIB.Topic({
    ros: rosConn.value,
    name: heartTopicCfg.spo2 || '/heart_sensor_node/spo2',
    messageType: 'std_msgs/Float32'
  })

  rosTopics.squatRepCompleted.subscribe((msg) => {
    if (typeof msg?.data === 'number') {
      currentRep.value = Math.max(0, Math.floor(msg.data))
    }
  })

  rosTopics.heartRate.subscribe((msg) => {
    if (typeof msg?.data === 'number') {
      metrics.heartRate = Math.max(0, Math.round(msg.data))
    }
  })

  rosTopics.heartSpo2.subscribe((msg) => {
    if (typeof msg?.data === 'number') {
      metrics.spo2 = Math.max(0, Math.min(100, Number(msg.data.toFixed(1))))
    }
  })

  rosTopics.squatState.subscribe((msg) => {
    let text = ''
    try {
      const parsed = JSON.parse(msg?.data || '{}')
      text = parsed?.msg || ''
      const code = Number(parsed?.code)
      if (code === 0) currentPhase.value = 'WORK'
      else if (code === 2) currentPhase.value = 'REST'
    } catch {
      text = msg?.data || ''
    }
    if (text) coachTip.value = text
  })

  rosTopics.squatErrors.subscribe((msg) => {
    errorCount.value += 1
    try {
      const parsed = JSON.parse(msg?.data || '{}')
      if (parsed?.msg) coachTip.value = `⚠ ${parsed.msg}`
    } catch {
      if (msg?.data) coachTip.value = `⚠ ${msg.data}`
    }
  })
}

const publishRosControl = (enabled) => {
  try {
    rosTopics.squatControl?.publish({ data: !!enabled })
    rosTopics.heartControl?.publish({ data: !!enabled })
  } catch {
    // 忽略控制下发异常，前端仍可继续回退链路
  }
}

const disconnectRos = () => {
  try { rosTopics.squatState?.unsubscribe() } catch {}
  try { rosTopics.squatRepCompleted?.unsubscribe() } catch {}
  try { rosTopics.squatErrors?.unsubscribe() } catch {}
  try { rosTopics.heartRate?.unsubscribe() } catch {}
  try { rosTopics.heartSpo2?.unsubscribe() } catch {}

  publishRosControl(false)

  try { rosConn.value?.close() } catch {}
  rosConn.value = null
  rosConnected.value = false
}

const connectRosRealtime = (cfg) => {
  if (rosDebugMode.value) return false
  const rosbridgeUrl = cfg?.active_profile?.rosbridge_url
  if (!rosbridgeUrl) return false

  try {
    rosConn.value = new ROSLIB.Ros({ url: rosbridgeUrl })
    rosConn.value.on('connection', () => {
      rosConnected.value = true
      try {
        bindRosTopics(cfg)
      } catch (error) {
        console.error('[TrainingSession][ROS] bindRosTopics failed:', error)
      }
      publishRosControl(true)
      coachTip.value = 'ROS 已连接，正在使用实时数据。'
    })

    rosConn.value.on('error', () => {
      rosConnected.value = false
    })

    rosConn.value.on('close', () => {
      rosConnected.value = false
    })
    return true
  } catch {
    rosConnected.value = false
    return false
  }
}

const startMockData = () => {
  fakeTimer = setInterval(() => {
    if (currentRep.value < totalTargetReps.value) {
      currentRep.value += 1
      currentSet.value = Math.min(totalSets.value, Math.floor(currentRep.value / Math.max(1, repsPerSet.value)) + 1)
    } else {
      coachTip.value = '本次训练已完成，建议进行拉伸恢复。'
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
    currentSet.value = data.current_set ?? currentSet.value
    totalSets.value = data.total_sets ?? totalSets.value

    if (data.reps_per_set != null) {
      repsPerSet.value = Math.max(1, Number(data.reps_per_set) || repsPerSet.value)
    }

    if (data.target_reps != null || data.target_rep != null) {
      const incomingTargetReps = Number(data.target_reps ?? data.target_rep)
      if (Number.isFinite(incomingTargetReps) && incomingTargetReps > 0) {
        totalTargetReps.value = incomingTargetReps
      }
    }

    if ((data.reps_per_set == null) && totalSets.value > 0 && totalTargetReps.value > 0) {
      repsPerSet.value = Math.max(1, Math.ceil(totalTargetReps.value / totalSets.value))
    }

    coachTip.value = data.coach_message || phaseLabelMap[data.phase] || data.tip || coachTip.value

    const incomingPhase = data.phase || currentPhase.value
    if (incomingPhase !== currentPhase.value) {
      currentPhase.value = incomingPhase
      phaseEnteredAt.value = Date.now()
      if (incomingPhase === 'REST' || incomingPhase === 'END') {
        stableSampling.active = true
        stableSampling.phase = incomingPhase
        stableSampling.startedAt = Date.now()
        stableSampling.samples = []
      } else {
        stableSampling.active = false
        stableSampling.phase = ''
        stableSampling.startedAt = 0
        stableSampling.samples = []
      }
    }

    if (stableSampling.active) {
      stableSampling.samples.push({
        ts: Date.now(),
        heart_rate: metrics.heartRate,
        spo2: metrics.spo2,
        current_rep: currentRep.value
      })

      const holdSecs = Math.floor((Date.now() - stableSampling.startedAt) / 1000)
      if (holdSecs >= 15) {
        const hrValues = stableSampling.samples.map((s) => s.heart_rate).filter((v) => Number.isFinite(v))
        const spo2Values = stableSampling.samples.map((s) => s.spo2).filter((v) => Number.isFinite(v))

        if (hrValues.length > 0 && spo2Values.length > 0) {
          const avgHr = Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length)
          const avgSpo2 = Math.round(spo2Values.reduce((a, b) => a + b, 0) / spo2Values.length)
          const offset = Math.max(0, Math.floor((Date.now() - sessionStartedAt.value) / 1000))

          const alreadyReported = timeSeriesPayload.value.some(
            (item) => item.phase === stableSampling.phase && Math.abs(item.offset - offset) <= 5
          )

          if (!alreadyReported) {
            timeSeriesPayload.value.push({
              offset,
              phase: stableSampling.phase,
              heart_rate: avgHr,
              spo2: avgSpo2,
              current_rep: currentRep.value,
              is_stable: true,
              hold_secs: 15
            })
          }
        }

        stableSampling.active = false
        stableSampling.phase = ''
        stableSampling.startedAt = 0
        stableSampling.samples = []
      }
    }
  } catch {
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

const ingestRealtimeState = async () => {
  if (!sessionId.value) return
  if (sessionRealtimeSourceMode.value !== 'client_relay') return

  const progress = totalTargetReps.value > 0
    ? Math.max(0, Math.min(100, Number(((currentRep.value / totalTargetReps.value) * 100).toFixed(1))))
    : 0

  try {
    await ingestTrainSessionRealtime(sessionId.value, {
      phase: currentPhase.value,
      heart_rate: metrics.heartRate,
      spo2: metrics.spo2,
      current_rep: currentRep.value,
      current_set: currentSet.value,
      progress,
      coach_message: coachTip.value
    })
  } catch {
    // 上报失败不影响训练流程
  }
}

const startRealtimeIngest = () => {
  if (!sessionId.value) return
  if (sessionRealtimeSourceMode.value !== 'client_relay') return
  stopRealtimeIngest()
  ingestTimer = setInterval(ingestRealtimeState, 1000)
}

const stopRealtimeIngest = () => {
  if (ingestTimer) {
    clearInterval(ingestTimer)
    ingestTimer = null
  }
}

const finishSession = async () => {
  if (!sessionId.value || isFinishing.value) return
  isFinishing.value = true
  try {
    if (currentPhase.value === 'END' && stableSampling.active) {
      const holdSecs = Math.floor((Date.now() - stableSampling.startedAt) / 1000)
      if (holdSecs >= 15) {
        const hrValues = stableSampling.samples.map((s) => s.heart_rate).filter((v) => Number.isFinite(v))
        const spo2Values = stableSampling.samples.map((s) => s.spo2).filter((v) => Number.isFinite(v))
        if (hrValues.length > 0 && spo2Values.length > 0) {
          const offset = Math.max(0, Math.floor((Date.now() - sessionStartedAt.value) / 1000))
          timeSeriesPayload.value.push({
            offset,
            phase: 'END',
            heart_rate: Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length),
            spo2: Math.round(spo2Values.reduce((a, b) => a + b, 0) / spo2Values.length),
            current_rep: currentRep.value,
            is_stable: true,
            hold_secs: 15
          })
        }
      }
    }

    await finishTrainSession(sessionId.value, {
      reason: 'user_finish',
      final_reps: currentRep.value,
      perceived_exertion: perceivedExertion.value,
      error_count: errorCount.value,
      time_series: timeSeriesPayload.value
    })
  } catch {
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
  ;(async () => {
    const cfg = await fetchRosRuntimeConfig().catch(() => null)
    await hydrateRuntimeConfig()

    sessionStartedAt.value = Date.now()
    phaseEnteredAt.value = Date.now()

    connectRosRealtime(cfg)

    if (sessionId.value) {
      startPolling()
      startRealtimeIngest()
      fetchSessionState()
    } else if (!sessionId.value) {
      startMockData()
    }

    if (playVoice) {
      const prefix = rosDebugMode.value ? '当前为 Windows 调试模式。' : '当前为实机模式。'
      playVoice(`${prefix}训练已开始，请保持动作标准。`)
    }
  })()
})

onBeforeUnmount(() => {
  stopMockData()
  stopPolling()
  stopRealtimeIngest()
  disconnectRos()
  if (stopVoice) stopVoice()
})
</script>
