<template>
  <div class="w-full h-full p-8 flex flex-col gap-6 text-white">
    <header class="shrink-0">
      <h2 class="text-4xl font-bold tracking-tight">我的信息</h2>
      <p class="text-gray-400 mt-2">账号资料、设备状态与安全能力</p>
    </header>

    <section class="grid grid-cols-12 gap-6 flex-1 min-h-0">
      <div class="col-span-5 glass-panel rounded-[2rem] p-6 flex flex-col gap-4">
        <h3 class="text-2xl font-bold tracking-wider">账号资料</h3>
        <div class="bg-black/20 rounded-2xl border border-white/10 p-4">
          <p class="text-sm text-gray-400">用户名</p>
          <p class="text-xl font-semibold mt-1">{{ displayText(profile.username) }}</p>
        </div>
        <div class="bg-black/20 rounded-2xl border border-white/10 p-4">
          <p class="text-sm text-gray-400">手机号</p>
          <p class="text-xl font-semibold mt-1">{{ displayText(profile.phone) }}</p>
        </div>
        <div class="bg-black/20 rounded-2xl border border-white/10 p-4">
          <p class="text-sm text-gray-400">角色</p>
          <p class="text-xl font-semibold mt-1">{{ displayText(profile.role) }}</p>
        </div>

        <div class="grid grid-cols-3 gap-3">
          <div class="bg-black/20 rounded-2xl border border-white/10 p-4">
            <p class="text-xs text-gray-400">性别</p>
            <p class="text-lg font-semibold mt-1">{{ displayText(profile.gender) }}</p>
          </div>
          <div class="bg-black/20 rounded-2xl border border-white/10 p-4">
            <p class="text-xs text-gray-400">身高</p>
            <p class="text-lg font-semibold mt-1">{{ displayNumber(profile.height, 'cm') }}</p>
          </div>
          <div class="bg-black/20 rounded-2xl border border-white/10 p-4">
            <p class="text-xs text-gray-400">体重</p>
            <p class="text-lg font-semibold mt-1">{{ displayNumber(profile.weight, 'kg') }}</p>
          </div>
        </div>

        <div class="bg-black/20 rounded-2xl border border-white/10 p-4 flex items-center gap-4">
          <div class="w-14 h-14 rounded-full bg-white/10 border border-white/10 overflow-hidden flex items-center justify-center text-xs text-gray-400">
            <img v-if="profile.avatar" :src="profile.avatar" alt="avatar" class="w-full h-full object-cover" />
            <span v-else>--</span>
          </div>
          <div>
            <p class="text-sm text-gray-400">头像</p>
            <p class="text-sm text-gray-300 mt-1">{{ profile.avatar ? '已配置' : '--' }}</p>
          </div>
        </div>

        <div class="bg-black/20 rounded-2xl border border-white/10 p-4">
          <p class="text-sm text-gray-400">状态</p>
          <p class="text-base mt-1" :class="statusClass">
            {{ statusMessage.text }}
          </p>
        </div>
      </div>

      <div class="col-span-7 glass-panel-light rounded-[2rem] p-6 flex flex-col gap-4">
        <h3 class="text-2xl font-bold tracking-wider">安全与设备</h3>

        <div class="grid grid-cols-2 gap-4">
          <button @click="refreshProfile" :disabled="isLoadingProfile" class="h-28 rounded-2xl bg-white/10 border border-white/15 hover:bg-white/15 transition-all text-left px-5 disabled:opacity-60 disabled:cursor-not-allowed">
            <p class="text-lg font-bold">同步资料</p>
            <p class="text-sm text-gray-400 mt-2">从后端重新拉取账户信息</p>
          </button>

          <button @click="toggleFaceEnroll" :class="isFaceBusy ? 'bg-neon-red/20 border-neon-red/40 hover:bg-neon-red/30' : 'bg-white/10 border-white/15 hover:bg-white/15'" class="h-28 rounded-2xl border transition-all text-left px-5">
            <p class="text-lg font-bold">{{ isFaceBusy ? '停止录入' : '人脸录入' }}</p>
            <p class="text-sm text-gray-400 mt-2">{{ isFaceBusy ? '连续采集中，点击可停止' : '连续采集并自动重试' }}</p>
          </button>

          <button @click="checkDevice" class="h-28 rounded-2xl bg-white/10 border border-white/15 hover:bg-white/15 transition-all text-left px-5">
            <p class="text-lg font-bold">设备校准</p>
            <p class="text-sm text-gray-400 mt-2">检测摄像头权限与可用性</p>
          </button>

          <button @click="logout" class="h-28 rounded-2xl bg-neon-red/20 border border-neon-red/40 hover:bg-neon-red/30 transition-all text-left px-5">
            <p class="text-lg font-bold text-neon-red">退出登录</p>
            <p class="text-sm text-gray-300 mt-2">清除令牌并返回待机页</p>
          </button>
        </div>

        <div class="rounded-2xl border border-white/10 bg-black/20 p-4">
          <p class="text-sm text-gray-400 mb-3">人脸录入预览</p>
          <div class="grid grid-cols-[220px_1fr] gap-4 items-stretch">
            <div class="relative w-[220px] h-[220px] rounded-2xl border border-white/10 overflow-hidden bg-black/40">
              <video
                ref="faceVideoRef"
                autoplay
                muted
                playsinline
                class="absolute inset-0 w-full h-full object-cover"
              ></video>
              <div v-if="!isFaceBusy" class="absolute inset-0 flex items-center justify-center text-gray-500 text-sm bg-black/40">
                点击“人脸录入”开始连续采集
              </div>
              <div v-else class="absolute inset-0 border-2 border-neon-green/70 animate-pulse"></div>
            </div>
            <div class="rounded-2xl border border-white/10 bg-black/30 p-4 flex flex-col justify-between">
              <div>
                <p class="text-sm text-gray-400">最近一次识别状态</p>
                <p class="text-lg font-semibold mt-2" :class="faceStatusClass">{{ faceFeedback.title }}</p>
                <p class="text-sm text-gray-300 mt-2">{{ faceFeedback.desc }}</p>
              </div>
              <div class="text-xs text-gray-500 mt-4">请保持光线充足并正对镜头</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchUserProfile } from '../api/user'
import { registerFace } from '../api/auth'

const router = useRouter()

const profile = reactive({
  username: '',
  phone: '',
  role: '',
  gender: '',
  height: null,
  weight: null,
  avatar: ''
})

const isLoadingProfile = ref(false)
const isFaceBusy = ref(false)
const faceVideoRef = ref(null)
const faceLoopActive = ref(false)

let activeMedia = null
let activeTrack = null

const statusMessage = reactive({
  type: 'ok',
  text: '正在同步资料...'
})

const statusClass = computed(() => {
  if (statusMessage.type === 'error') return 'text-neon-red'
  if (statusMessage.type === 'warning') return 'text-neon-orange'
  return 'text-neon-green'
})

const faceFeedback = reactive({
  type: 'neutral',
  title: '待采集',
  desc: '尚未开始人脸录入'
})

const faceStatusClass = computed(() => {
  if (faceFeedback.type === 'error') return 'text-neon-red'
  if (faceFeedback.type === 'warning') return 'text-neon-orange'
  if (faceFeedback.type === 'success') return 'text-neon-green'
  return 'text-gray-300'
})

const displayText = (value) => {
  if (value === null || value === undefined) return '--'
  const text = String(value).trim()
  return text ? text : '--'
}

const displayNumber = (value, unit = '') => {
  if (value === null || value === undefined || value === '') return '--'
  return `${value}${unit ? ` ${unit}` : ''}`
}

const hasAnyProfileData = computed(() => {
  return [
    profile.username,
    profile.phone,
    profile.role,
    profile.gender,
    profile.height,
    profile.weight,
    profile.avatar
  ].some((v) => v !== null && v !== undefined && String(v).trim() !== '')
})

const refreshProfile = async () => {
  isLoadingProfile.value = true
  try {
    const data = await fetchUserProfile()

    profile.username = data.username ?? data.user_info?.username ?? ''
    profile.phone = data.phone ?? data.mobile ?? ''
    profile.role = data.role ?? data.user_info?.role ?? ''
    profile.gender = data.gender ?? data.user_info?.gender ?? ''
    profile.height = data.height ?? data.user_info?.height ?? null
    profile.weight = data.weight ?? data.user_info?.weight ?? null
    profile.avatar = data.avatar ?? ''

    if (hasAnyProfileData.value) {
      statusMessage.type = 'ok'
      statusMessage.text = '资料同步完成'
    } else {
      statusMessage.type = 'warning'
      statusMessage.text = '已连接账号中心，但当前资料为空'
    }
  } catch (error) {
    statusMessage.type = 'error'
    statusMessage.text = '资料同步失败，请稍后重试'
  } finally {
    isLoadingProfile.value = false
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const cleanupFaceMedia = () => {
  if (activeTrack) activeTrack.stop()
  if (activeMedia) activeMedia.getTracks().forEach((item) => item.stop())
  activeTrack = null
  activeMedia = null
  if (faceVideoRef.value) {
    faceVideoRef.value.srcObject = null
  }
}

const captureFaceData = async () => {
  const canvas = document.createElement('canvas')
  let sourceW = 640
  let sourceH = 480
  let drawSource = null

  if (typeof ImageCapture !== 'undefined' && activeTrack) {
    const imageCapture = new ImageCapture(activeTrack)
    const bitmap = await imageCapture.grabFrame()
    sourceW = bitmap.width
    sourceH = bitmap.height
    drawSource = bitmap
  } else if (faceVideoRef.value) {
    sourceW = faceVideoRef.value.videoWidth || sourceW
    sourceH = faceVideoRef.value.videoHeight || sourceH
    drawSource = faceVideoRef.value
  }

  canvas.width = sourceW
  canvas.height = sourceH
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('canvas context unavailable')
  }
  if (!drawSource) {
    throw new Error('video source unavailable')
  }
  ctx.drawImage(drawSource, 0, 0, sourceW, sourceH)

  return canvas.toDataURL('image/jpeg', 0.85)
}

const stopFaceEnroll = () => {
  faceLoopActive.value = false
  if (isFaceBusy.value) {
    statusMessage.type = 'warning'
    statusMessage.text = '已停止连续采集'
  }
}

const toggleFaceEnroll = async () => {
  if (isFaceBusy.value) {
    stopFaceEnroll()
    return
  }

  isFaceBusy.value = true
  faceLoopActive.value = true

  try {
    statusMessage.type = 'ok'
    statusMessage.text = '连续采集中，请正对摄像头...'

    activeMedia = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: 'user' },
      audio: false
    })

    if (faceVideoRef.value) {
      faceVideoRef.value.srcObject = activeMedia
    }

    activeTrack = activeMedia.getVideoTracks()[0]

    while (faceLoopActive.value) {
      const faceData = await captureFaceData()
      const result = await registerFace(faceData)

      if (result?.code === 'ENROLL_SUCCESS') {
        faceFeedback.type = 'success'
        faceFeedback.title = '录入成功'
        faceFeedback.desc = result?.msg || '人脸特征绑定成功'
        statusMessage.type = 'ok'
        statusMessage.text = '人脸录入完成'
        faceLoopActive.value = false
        break
      }

      if (['NO_FACE', 'TOO_FAR', 'NOT_FACING'].includes(result?.code)) {
        faceFeedback.type = 'warning'
        faceFeedback.title = '请调整姿态'
        faceFeedback.desc = result?.msg || '请正对摄像头并靠近一些'
        statusMessage.type = 'warning'
        statusMessage.text = '未通过姿态检测，正在继续采集...'
      } else if (result?.code === 'IMG_ERROR') {
        faceFeedback.type = 'error'
        faceFeedback.title = '图像异常'
        faceFeedback.desc = result?.msg || '图像质量不足，请重试'
        statusMessage.type = 'warning'
        statusMessage.text = '图像异常，正在继续采集...'
      } else {
        faceFeedback.type = 'error'
        faceFeedback.title = '录入失败'
        faceFeedback.desc = result?.msg || '返回状态异常'
        statusMessage.type = 'warning'
        statusMessage.text = '状态异常，正在继续采集...'
      }

      if (faceLoopActive.value) {
        await wait(800)
      }
    }
  } catch (error) {
    if (error?.data?.code === 'PARAMS_INVALID') {
      faceFeedback.type = 'error'
      faceFeedback.title = '参数错误'
      faceFeedback.desc = error?.data?.msg || '上传数据无效'
      statusMessage.type = 'error'
      statusMessage.text = '采集数据异常，请重试'
      faceLoopActive.value = false
      return
    }

    statusMessage.type = 'error'
    statusMessage.text = '人脸录入失败，请检查摄像头权限后重试'
    faceFeedback.type = 'error'
    faceFeedback.title = '录入失败'
    faceFeedback.desc = error?.message || '请检查设备后重试'
    faceLoopActive.value = false
  } finally {
    cleanupFaceMedia()
    isFaceBusy.value = false
  }
}

const checkDevice = async () => {
  try {
    const media = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    media.getTracks().forEach((t) => t.stop())
    statusMessage.type = 'ok'
    statusMessage.text = '摄像头检测通过'
  } catch (error) {
    statusMessage.type = 'error'
    statusMessage.text = '摄像头不可用或权限被拒绝'
  }
}

const logout = () => {
  localStorage.removeItem('auth_token')
  router.push('/')
}

onMounted(() => {
  refreshProfile()
})

onUnmounted(() => {
  faceLoopActive.value = false
  cleanupFaceMedia()
})
</script>
