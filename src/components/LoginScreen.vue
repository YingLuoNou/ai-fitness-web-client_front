<template>
  <div class="relative w-full h-full flex items-center justify-center overflow-hidden">
    
    <div 
      class="flex flex-col items-center transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
      :class="isPasswordMode ? '-translate-x-[280px] scale-80' : 'translate-x-0 scale-100'"
    >
      
      <div class="relative flex items-center justify-center w-[340px] h-[340px]">
        <div class="absolute inset-0 rounded-full bg-gradient-to-tr from-ai-start via-neon-green to-ai-end animate-spin-slow shadow-[0_0_40px_rgba(50,255,126,0.3)]"></div>
        
        <div class="absolute inset-[4px] bg-black rounded-full overflow-hidden flex items-center justify-center z-10">
          
          <video 
            ref="videoRef" 
            class="absolute inset-0 w-full h-full object-cover transform -scale-x-100" 
            autoplay 
            playsinline 
            muted
          ></video>

          <div v-show="!isPasswordMode" class="absolute inset-0 flex items-center justify-center z-20 bg-black/30 pointer-events-none">
            <ScanFace class="w-36 h-36 text-neon-green opacity-80 animate-breath drop-shadow-[0_0_20px_rgba(50,255,126,0.8)]" stroke-width="1.2" />
          </div>

          <div v-show="!isPasswordMode" class="absolute top-0 w-full h-2 bg-neon-green shadow-[0_0_20px_#32FF7E] z-30 animate-scan pointer-events-none"></div>
        </div>
      </div>

      <div class="mt-12 text-center transition-all duration-500" :class="isPasswordMode ? 'opacity-0' : 'opacity-100'">
        <h2 class="text-4xl font-bold tracking-widest drop-shadow-md" :class="scanStatus.color">{{ scanStatus.title }}</h2>
        <p class="text-xl text-gray-400 mt-4 font-medium">{{ scanStatus.desc }}</p>
      </div>

      <button 
        @click="switchMode(true)"
        class="mt-10 px-10 py-5 rounded-full glass-panel-light flex items-center gap-3 hover:bg-white/10 active:scale-95 transition-all duration-300 z-50 shadow-xl"
        :class="isPasswordMode ? 'opacity-0 pointer-events-none' : 'opacity-100'"
      >
        <User class="w-6 h-6 text-gray-300" />
        <span class="text-xl font-bold tracking-wider">账号密码登录</span>
      </button>
    </div>

    <canvas ref="canvasRef" class="hidden"></canvas>


    <div 
      class="absolute right-24 w-[500px] glass-panel p-12 rounded-[3rem] flex flex-col transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] z-50 shadow-2xl"
      :class="isPasswordMode ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-32 pointer-events-none'"
    >
      <div class="flex items-center justify-between mb-10">
        <h3 class="text-3xl font-bold tracking-widest text-white">系统登录</h3>
        <button @click="switchMode(false)" class="p-3 rounded-full hover:bg-white/10 active:bg-white/20 text-gray-400 transition-all border border-transparent hover:border-white/10">
          <ArrowLeft class="w-8 h-8" />
        </button>
      </div>
      
      <form @submit.prevent="handleAccountLogin" class="space-y-8">
        <div class="space-y-3">
          <label class="text-lg text-gray-400 font-medium pl-3 tracking-wider">用户名 USERNAME</label>
          <div class="relative flex items-center">
            <User class="w-8 h-8 text-gray-400 absolute left-5" />
            <input 
              v-model="loginForm.username" 
              type="text" 
              placeholder="请输入管理员账号"
              class="w-full h-20 bg-white/5 border-2 border-white/10 rounded-3xl pl-16 pr-6 text-2xl text-white outline-none focus:border-neon-green focus:bg-white/10 transition-all shadow-inner"
            >
          </div>
        </div>

        <div class="space-y-3">
          <label class="text-lg text-gray-400 font-medium pl-3 tracking-wider">密码 PASSWORD</label>
          <div class="relative flex items-center">
            <Lock class="w-8 h-8 text-gray-400 absolute left-5" />
            <input 
              v-model="loginForm.password" 
              type="password" 
              placeholder="请输入密码"
              class="w-full h-20 bg-white/5 border-2 border-white/10 rounded-3xl pl-16 pr-6 text-2xl text-white outline-none focus:border-neon-green focus:bg-white/10 transition-all shadow-inner"
            >
          </div>
        </div>

        <p v-if="errorMessage" class="text-neon-red text-lg font-medium pl-3 h-6">{{ errorMessage }}</p>

        <button 
          type="submit"
          :disabled="isLoading"
          class="w-full mt-6 py-6 rounded-3xl text-2xl font-bold tracking-widest transition-all duration-300 flex justify-center items-center gap-3 shadow-lg"
          :class="(loginForm.username && loginForm.password) ? 'btn-neon-primary' : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'"
        >
          <Loader2 v-if="isLoading" class="w-8 h-8 animate-spin" />
          {{ isLoading ? '登录中...' : '进入系统' }}
        </button>
      </form>
    </div>

  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { User, Lock, ArrowLeft, Loader2, ScanFace } from '@lucide/vue'
const router = useRouter()

const API_BASE_URL = 'http://127.0.0.1:8000'

const isPasswordMode = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const loginForm = reactive({
  username: '',
  password: ''
})

const videoRef = ref(null)
const canvasRef = ref(null)
let stream = null
let scanInterval = null

const scanStatus = reactive({
  title: '靠近即可唤醒',
  desc: 'RK3588正在进行人脸检测...',
  color: 'text-white'
})

const startCamera = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ 
      video: { width: 640, height: 480, facingMode: 'user' } 
    })
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      videoRef.value.onloadedmetadata = () => {
        startFacePolling()
      }
    }
  } catch (err) {
    console.error("摄像头调用失败:", err)
    scanStatus.title = '摄像头未就绪'
    scanStatus.desc = '请检查一体机摄像头硬件连接'
    scanStatus.color = 'text-neon-red'
  }
}

const stopCamera = () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
  }
  stopFacePolling()
}

const captureAndSendFace = async () => {
  // 如果处于密码输入模式，或正在处理登录，则停止发送人脸流
  if (isPasswordMode.value || isLoading.value) return

  const video = videoRef.value
  const canvas = canvasRef.value
  if (!video || !canvas) return

  const ctx = canvas.getContext('2d')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  
  const base64Image = canvas.toDataURL('image/jpeg', 0.8)

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/face-login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ face_data: base64Image }) // 注意这里的键名与后端保持一致
    })

    if (response.ok) {
      const data = await response.json()
      
      // 核心业务逻辑：通过后端传回的细分 code，改变 UI 的文案和发光颜色
      switch (data.code) {
        case 'AUTH_SUCCESS':
          stopFacePolling()
          scanStatus.title = '识别成功'
          scanStatus.desc = `欢迎回来，${data.username}`
          scanStatus.color = 'text-neon-green'  // 绿色：放行
          handleLoginSuccess(data.token || data.access)
          break
          
        case 'NO_FACE':
          scanStatus.title = '靠近即可唤醒...'
          scanStatus.desc = data.msg            // "未检测到人脸，请面向屏幕"
          scanStatus.color = 'text-white'       // 白色：常态
          break
          
        case 'TOO_FAR':
        case 'NOT_FACING':
          scanStatus.title = '请调整姿态'
          scanStatus.desc = data.msg            // "请靠近体测一体机摄像头" / "请抬起头，正对屏幕中央"
          scanStatus.color = 'text-neon-orange' // 橙色：警告用户调整
          break
          
        case 'IMG_ERROR':
          scanStatus.title = '图像异常'
          scanStatus.desc = data.msg
          scanStatus.color = 'text-neon-red'    // 红色：错误
          break
          
        default:
          scanStatus.title = '识别中...'
          scanStatus.desc = data.msg || '正在比对人脸特征'
          scanStatus.color = 'text-white'
      }
    } else {
      // 捕获 HTTP 级错误 (比如 404, 403)
      const errorData = await response.json().catch(() => ({}))
      
      if (response.status === 404) {
        scanStatus.title = '未匹配到档案'
        scanStatus.desc = errorData.msg || '请先使用账号登录并绑定人脸'
        scanStatus.color = 'text-neon-orange'
      } else if (response.status === 403) {
        scanStatus.title = '账号异常'
        scanStatus.desc = errorData.msg || '该账号已被禁用'
        scanStatus.color = 'text-neon-red'
      } else {
        scanStatus.title = '服务异常'
        scanStatus.desc = errorData.msg || '无法连接到人脸识别服务'
        scanStatus.color = 'text-neon-red'
      }
    }
  } catch (error) {
    console.warn('Face login poll error:', error)
  }
}

const startFacePolling = () => {
  if (!scanInterval) {
    scanInterval = setInterval(captureAndSendFace, 1500)
  }
}

const stopFacePolling = () => {
  if (scanInterval) {
    clearInterval(scanInterval)
    scanInterval = null
  }
}

const switchMode = (isPassword) => {
  isPasswordMode.value = isPassword
  errorMessage.value = ''
  if (isPassword) {
    stopFacePolling()
  } else {
    startFacePolling()
  }
}

const handleAccountLogin = async () => {
  if (!loginForm.username || !loginForm.password) return
  
  isLoading.value = true
  errorMessage.value = ''

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: loginForm.username,
        password: loginForm.password
      })
    })

    const data = await response.json()

    if (response.ok) {
      handleLoginSuccess(data.token || data.access)
    } else {
      errorMessage.value = data.detail || data.error || '账号或密码错误，请重试'
    }
  } catch (error) {
    console.error('Login error:', error)
    errorMessage.value = '无法连接到服务器，请检查网络'
  } finally {
    isLoading.value = false
  }
}

const handleLoginSuccess = (token) => {
  if (token) {
    localStorage.setItem('auth_token', token)
    // 延迟 800ms，让用户看清楚“识别成功”的绿色字样，然后再丝滑切走
    setTimeout(() => {
      router.push('/home')
    }, 800)
  }
}

onMounted(() => {
  startCamera()
})

onBeforeUnmount(() => {
  stopCamera()
})
</script>

<style scoped>
/* 避免视频画面水平翻转导致的不适（镜面效果） */
.transform.-scale-x-100 {
  transform: scaleX(-1);
}

/* 独立的外层流光圆环旋转动画，不影响内部视频 */
.animate-spin-slow {
  animation: spin 6s linear infinite;
}

/* 模拟科幻扫描线从上到下移动 */
@keyframes scan {
  0% { transform: translateY(-10px); opacity: 0; }
  10% { opacity: 1; }
  90% { opacity: 1; }
  100% { transform: translateY(320px); opacity: 0; }
}
.animate-scan {
  animation: scan 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
</style>