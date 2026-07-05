<template>
  <div class="w-full h-full flex flex-col relative text-white px-10 py-6">
    
    <header class="flex justify-between items-center mb-8 shrink-0 pl-2">
      <div>
        <h2 class="text-4xl font-bold tracking-tight">运动记录</h2>
        <p class="text-lg text-gray-400 mt-2">回顾训练历程，随时与 AI 教练对话分析</p>
      </div>
      
      <div class="flex bg-black/30 p-1.5 rounded-2xl border border-white/10 shadow-inner backdrop-blur-md">
        <button 
          @click="viewMode = 'list'"
          class="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300"
          :class="viewMode === 'list' ? 'bg-white/15 shadow-md text-white border border-white/10' : 'text-gray-500 hover:text-gray-300'"
        >
          <List class="w-5 h-5" /> 列表
        </button>
        <button 
          @click="viewMode = 'calendar'"
          class="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300"
          :class="viewMode === 'calendar' ? 'bg-white/15 shadow-md text-white border border-white/10' : 'text-gray-500 hover:text-gray-300'"
        >
          <CalendarDays class="w-5 h-5" /> 日历
        </button>
      </div>
    </header>

    <div class="flex-1 flex gap-8 min-h-0">
      
      <div class="w-[35%] flex flex-col h-full overflow-hidden">
        
        <div v-if="isLoading" class="flex justify-center py-20">
          <Loader2 class="w-12 h-12 text-neon-green animate-spin" />
        </div>

        <template v-else>
          <div v-if="viewMode === 'list'" class="flex flex-col gap-4 overflow-y-auto pr-4 custom-scrollbar pb-4 h-full">
            <div 
              v-for="record in activities" :key="record.id"
              @click="selectRecord(record.id)"
              class="p-6 rounded-[2rem] cursor-pointer transition-all duration-300 border shadow-lg group relative overflow-hidden shrink-0"
              :class="selectedRecordId === record.id ? 'bg-white/10 border-neon-green/50' : 'glass-panel hover:bg-white/10 border-white/5'"
            >
              <div v-if="selectedRecordId === record.id" class="absolute inset-0 bg-gradient-to-br from-neon-green/10 to-transparent pointer-events-none"></div>
              
              <div class="flex justify-between items-start mb-5 relative z-10">
                <div class="flex items-center gap-4">
                  <div class="w-14 h-14 rounded-full bg-black/40 flex items-center justify-center text-gray-300 border border-white/5 shadow-inner">
                    <ActivityIcon class="w-6 h-6" />
                  </div>
                  <div>
                    <h4 class="text-xl font-bold tracking-wider">{{ record.activity_type }}</h4>
                    <p class="text-sm text-gray-400 mt-1">{{ record.start_time.substring(0, 16) }}</p>
                  </div>
                </div>
                <span class="px-4 py-1.5 rounded-full text-xs font-bold shadow-sm" :class="getIntensityClass(record.intensity)">
                  {{ record.intensity }}
                </span>
              </div>
              
              <div class="grid grid-cols-2 gap-4 relative z-10 bg-black/20 p-4 rounded-2xl border border-white/5">
                <div>
                  <p class="text-gray-500 text-xs tracking-widest mb-1">训练时长</p>
                  <p class="text-2xl font-mono font-bold text-white">
                    {{ record.duration_seconds ? Math.floor(record.duration_seconds / 60) : Math.floor(record.duration / 60) }}<span class="text-xs ml-1 text-gray-400">MIN</span>
                  </p>
                </div>
                <div>
                  <p class="text-gray-500 text-xs tracking-widest mb-1">完成容量</p>
                  <p class="text-2xl font-mono font-bold text-white">{{ record.total_reps }}<span class="text-xs ml-1 text-gray-400">REPS</span></p>
                </div>
              </div>
            </div>
            
            <div v-if="activities.length === 0" class="text-center py-20 text-gray-500 flex flex-col items-center">
              <History class="w-16 h-16 mb-4 opacity-20" />
              <p class="text-xl">暂无训练记录</p>
            </div>
          </div>

          <div v-if="viewMode === 'calendar'" class="flex flex-col h-full glass-panel rounded-[2rem] p-6 shadow-xl border border-white/10 relative overflow-hidden">
             <div class="flex justify-between items-center mb-6 px-2">
               <h3 class="text-2xl font-bold tracking-widest">本月</h3>
               <span class="text-neon-green font-bold bg-neon-green/10 px-4 py-1 rounded-full border border-neon-green/20 text-sm">
                 {{ activities.length }} 次训练
               </span>
             </div>
             
             <div class="grid grid-cols-7 gap-2 mb-4 text-center text-gray-500 font-bold text-sm tracking-wider">
               <div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div><div>日</div>
             </div>
             
             <div class="grid grid-cols-7 gap-3">
               <div v-for="blank in 2" :key="'blank-'+blank" class="aspect-square"></div>
               <div 
                 v-for="day in calendarDays" :key="day.date"
                 @click="day.record ? selectRecord(day.record.id) : null"
                 class="aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all duration-300"
                 :class="[
                   day.record ? 'cursor-pointer hover:scale-105 shadow-lg' : 'opacity-40 cursor-not-allowed',
                   selectedRecordId === day.record?.id ? 'bg-neon-green text-black font-black scale-105' : (day.record ? 'bg-white/10 hover:bg-white/20 text-white font-bold border border-white/10' : 'bg-transparent text-gray-500')
                 ]"
               >
                 <span class="text-lg z-10">{{ day.date }}</span>
                 <div v-if="day.record && selectedRecordId !== day.record.id" class="w-1.5 h-1.5 rounded-full bg-neon-green mt-1 absolute bottom-2"></div>
               </div>
             </div>
          </div>
        </template>
      </div>

      <div class="w-[65%] glass-panel-light rounded-[3rem] flex flex-col relative shadow-2xl p-10 overflow-hidden">
        
        <div class="flex-1 flex flex-col min-h-0">
          
          <div v-if="!selectedRecord" class="flex-1 flex flex-col items-center justify-center text-gray-400 opacity-60">
            <MousePointerClick class="w-20 h-20 mb-8 text-white/20" stroke-width="1" />
            <p class="text-3xl font-bold tracking-widest text-white">请选择一条记录</p>
            <p class="text-xl mt-3">查看详细体征数据与 AI 深度复盘报告</p>
          </div>

          <div v-else class="flex flex-col h-full overflow-hidden">
            <div class="flex justify-between items-start pb-6 border-b border-white/10 shrink-0">
              <div>
                <h3 class="text-3xl font-bold tracking-tight mb-3 flex items-center gap-4">
                  {{ selectedRecord.activity_type }}
                  <span class="text-sm px-4 py-1.5 bg-white/10 rounded-full font-normal border border-white/10 tracking-wider">
                    {{ selectedRecord.training_mode }}
                  </span>
                </h3>
                <p class="text-gray-400 text-base">{{ selectedRecord.start_time }}</p>
              </div>
              <div class="flex gap-4">
                <div class="text-center bg-black/20 px-5 py-3 rounded-2xl border border-white/5 shadow-inner">
                  <p class="text-gray-500 text-xs tracking-widest mb-1">RPE 疲劳度</p>
                  <p class="text-3xl font-mono text-white">{{ selectedRecord.perceived_exertion || '-' }}<span class="text-sm text-gray-500 ml-1">/10</span></p>
                </div>
                <div class="text-center bg-black/20 px-5 py-3 rounded-2xl border border-white/5 shadow-inner">
                  <p class="text-gray-500 text-xs tracking-widest mb-1">AI 动作评分</p>
                  <p class="text-3xl font-mono text-neon-green font-bold">{{ selectedRecord.quality_score || '-' }}<span class="text-sm text-gray-500 ml-1">分</span></p>
                </div>
              </div>
            </div>

            <div class="flex-1 overflow-y-auto custom-scrollbar pr-4 mt-6 flex flex-col gap-6 pb-2">
              
              <div v-if="selectedRecord.ai_report" class="p-8 rounded-[2rem] bg-gradient-to-br from-ai-start/20 to-ai-end/20 border border-ai-start/30 relative overflow-hidden shadow-lg shrink-0">
                <div class="absolute -top-4 -right-4 p-4 opacity-10 pointer-events-none">
                  <Sparkles class="w-48 h-48" />
                </div>
                <h4 class="text-xl font-bold text-white mb-4 flex items-center gap-3 relative z-10">
                  <Sparkles class="w-5 h-5 text-neon-green" /> 训练深度评估
                </h4>
                <p class="text-gray-200 leading-relaxed text-lg relative z-10 tracking-wide">
                  {{ selectedRecord.ai_report.feedback }}
                </p>
                <div class="mt-6 pt-6 border-t border-white/10 relative z-10 bg-black/10 -mx-8 -mb-8 px-8 py-6">
                  <p class="text-neon-orange font-bold text-base"><span class="text-gray-400 font-medium mr-2">指导建议：</span>{{ selectedRecord.ai_report.suggestion }}</p>
                </div>
              </div>

              <div class="rounded-[2rem] bg-black/30 border border-white/5 flex flex-col p-6 shrink-0 shadow-inner">
                <div class="flex justify-between items-center mb-6">
                   <h4 class="text-lg font-bold text-gray-300 flex items-center gap-2">
                     <HeartPulse class="w-5 h-5 text-neon-red" /> 生理体征曲线
                   </h4>
                   <p class="text-sm text-gray-500">共采集 {{ selectedRecord.sensor_data_series?.length || 0 }} 组关键数据</p>
                </div>
                
                <div v-if="selectedRecord.sensor_data_series && selectedRecord.sensor_data_series.length > 0" class="flex gap-6 mb-6">
                   <div class="flex-1 bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                      <span class="text-gray-400 font-medium">平均心率</span>
                      <p class="text-2xl font-mono text-neon-red font-bold">
                        {{ Math.round(selectedRecord.sensor_data_series.reduce((sum, item) => sum + item.heart_rate, 0) / selectedRecord.sensor_data_series.length) }}
                        <span class="text-sm text-gray-500 font-normal">bpm</span>
                      </p>
                   </div>
                   <div class="flex-1 bg-white/5 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                      <span class="text-gray-400 font-medium">平均血氧</span>
                      <p class="text-2xl font-mono text-neon-green font-bold">
                        {{ (selectedRecord.sensor_data_series.reduce((sum, item) => sum + item.spo2, 0) / selectedRecord.sensor_data_series.length).toFixed(1) }}
                        <span class="text-sm text-gray-500 font-normal">%</span>
                      </p>
                   </div>
                </div>
                
                <div class="w-full h-[280px] bg-black/20 rounded-xl relative border border-white/5 overflow-hidden">
                  <div ref="chartRef" class="absolute inset-0"></div>
                  <div v-if="!selectedRecord.sensor_data_series || selectedRecord.sensor_data_series.length === 0" class="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                    <ActivityIcon class="w-10 h-10 text-gray-600 mb-2 opacity-50" stroke-width="1.5" />
                    <p class="text-sm text-gray-500">本次训练未采集到体征序列数据</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="shrink-0 pt-6 border-t border-white/10 mt-2 bg-transparent z-20">
          <div class="flex items-center gap-2 mb-3 px-2">
            <MessageSquare class="w-4 h-4 text-ai-start" />
            <span class="text-sm font-bold text-gray-400 tracking-widest">向 AI 教练提问</span>
          </div>

          <div class="flex gap-4 mb-4 overflow-x-auto pb-2 custom-scrollbar">
            <button 
              v-for="(chip, idx) in quickQuestions" :key="idx"
              @click="sendAiMessage(chip)"
              class="whitespace-nowrap px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white active:scale-95 transition-all shadow-sm flex items-center gap-2"
            >
              <Zap class="w-3.5 h-3.5 text-neon-green" />
              {{ chip }}
            </button>
          </div>
          
          <div class="relative flex items-center">
            <div class="absolute left-6 w-10 h-10 rounded-full bg-gradient-to-tr from-ai-start to-ai-end flex items-center justify-center shadow-lg pointer-events-none">
              <Mic class="w-5 h-5 text-white" />
            </div>
            <input 
              v-model="chatInput"
              @keyup.enter="sendAiMessage(chatInput)"
              type="text" 
              placeholder="例如：“总结我近期的训练表现” 或 “我的心率恢复正常吗？”"
              class="w-full h-16 bg-black/50 border border-white/10 rounded-full pl-20 pr-20 text-lg text-white outline-none focus:border-neon-green/50 transition-all shadow-inner placeholder-gray-500"
              :disabled="isChatting"
            >
            <button 
              @click="sendAiMessage(chatInput)"
              :disabled="!chatInput || isChatting"
              class="absolute right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-md"
              :class="chatInput && !isChatting ? 'bg-neon-green text-black hover:scale-105 hover:shadow-[0_0_15px_#32FF7E]' : 'bg-white/10 text-gray-500'"
            >
              <Loader2 v-if="isChatting" class="w-5 h-5 animate-spin" />
              <Send v-else class="w-5 h-5 ml-1" />
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch, inject } from 'vue'
import { List, CalendarDays, MousePointerClick, Activity as ActivityIcon, Sparkles, Mic, Send, Loader2, HeartPulse, History, MessageSquare, Zap } from '@lucide/vue'
import * as echarts from 'echarts' // 引入 ECharts

const playVoice = inject('playVoice')
const API_BASE_URL = 'http://127.0.0.1:8000'

const viewMode = ref('list')
const isLoading = ref(false)
const activities = ref([])
const selectedRecordId = ref(null)
const selectedRecord = ref(null)

const chatInput = ref('')
const isChatting = ref(false)
const quickQuestions = [
  "总结本周的训练表现", 
  "评估我的心率恢复能力", 
  "基于近期负荷推荐下次计划"
]

const getIntensityClass = (intensity) => {
  if (intensity === '高强度' || intensity === 'HIGH') return 'bg-neon-red/20 text-neon-red border border-neon-red/30'
  if (intensity === '中强度' || intensity === 'MED') return 'bg-neon-orange/20 text-neon-orange border border-neon-orange/30'
  return 'bg-neon-green/20 text-neon-green border border-neon-green/30'
}

const calendarDays = computed(() => {
  const days = []
  for (let i = 1; i <= 30; i++) {
    const matchedRecord = activities.value.find(act => {
      if(!act.start_time) return false;
      const actDate = parseInt(act.start_time.substring(8, 10), 10)
      return actDate === i
    })
    days.push({
      date: i,
      record: matchedRecord || null
    })
  }
  return days
})

const fetchActivities = async () => {
  const token = localStorage.getItem('auth_token')
  isLoading.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/activities/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.ok) {
      const data = await response.json()
      activities.value = data.records || []
    }
  } catch (err) {
    console.error('获取记录失败', err)
  } finally {
    isLoading.value = false
  }
}

// ================= ECharts 相关逻辑 =================
const chartRef = ref(null)
let chartInstance = null

// 当选中的记录发生变化且包含体征数据时，渲染图表
watch(selectedRecord, async (newVal) => {
  if (newVal && newVal.sensor_data_series && newVal.sensor_data_series.length > 0) {
    await nextTick() // 等待 DOM 更新挂载 chartRef
    renderChart(newVal.sensor_data_series)
  } else {
    // 如果没有数据，销毁历史图表实例
    if (chartInstance) {
      chartInstance.dispose()
      chartInstance = null
    }
  }
})

const renderChart = (seriesData) => {
  if (!chartRef.value) return
  if (!chartInstance) {
    chartInstance = echarts.init(chartRef.value)
  }

  // 数据映射解析
  const xAxisData = seriesData.map(item => `${item.offset}s`)
  const hrData = seriesData.map(item => item.heart_rate)
  const spo2Data = seriesData.map(item => item.spo2)

  const option = {
    // 深色模式网格设定
    grid: { top: 40, right: 50, bottom: 20, left: 50, containLabel: true },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(12, 12, 14, 0.9)',
      borderColor: 'rgba(255,255,255,0.1)',
      textStyle: { color: '#fff', fontSize: 16 },
      padding: [12, 16],
      formatter: function (params) {
        const dataIndex = params[0].dataIndex
        const phase = seriesData[dataIndex].phase
        const reps = seriesData[dataIndex].current_rep
        let tip = `<div style="font-weight:bold;margin-bottom:8px;">${params[0].axisValue} - ${phase} <span style="font-size:12px;color:#aaa">(第${reps}次)</span></div>`
        params.forEach(p => {
          tip += `${p.marker} <span style="color:#ddd">${p.seriesName}:</span> <strong style="color:${p.color}">${p.value}</strong><br/>`
        })
        return tip
      }
    },
    legend: {
      data: ['心率 (BPM)', '血氧 (%)'],
      textStyle: { color: '#888', fontSize: 14 },
      top: 0
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: { color: '#888', margin: 12 }
    },
    // 双 Y 轴设计
    yAxis: [
      {
        type: 'value',
        name: '心率',
        min: 60,
        max: 200, // 运动心率合理区间
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)', type: 'dashed' } },
        axisLabel: { color: '#FF4D4D', fontWeight: 'bold' },
        nameTextStyle: { color: '#FF4D4D', padding: [0, 20, 0, 0] }
      },
      {
        type: 'value',
        name: '血氧',
        min: 90,
        max: 100, // 血氧合理区间
        splitLine: { show: false }, // 隐藏第二条分割线防止网格杂乱
        axisLabel: { color: '#32FF7E', fontWeight: 'bold' },
        nameTextStyle: { color: '#32FF7E', padding: [0, 0, 0, 20] }
      }
    ],
    series: [
      {
        name: '心率 (BPM)',
        type: 'line',
        yAxisIndex: 0,
        data: hrData,
        smooth: true,
        symbolSize: 8,
        itemStyle: { color: '#FF4D4D' },
        lineStyle: { width: 3 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255,77,77,0.3)' },
            { offset: 1, color: 'rgba(255,77,77,0)' }
          ])
        }
      },
      {
        name: '血氧 (%)',
        type: 'line',
        yAxisIndex: 1,
        data: spo2Data,
        smooth: true,
        symbolSize: 8,
        itemStyle: { color: '#32FF7E' },
        lineStyle: { width: 3 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(50,255,126,0.3)' },
            { offset: 1, color: 'rgba(50,255,126,0)' }
          ])
        }
      }
    ]
  }
  chartInstance.setOption(option)
}

// 监听窗口尺寸变化，自适应重绘图表
const handleResize = () => {
  if (chartInstance) chartInstance.resize()
}
// ================= ECharts 逻辑结束 =================

const selectRecord = async (id) => {
  if(!id) return
  selectedRecordId.value = id
  const token = localStorage.getItem('auth_token')
  try {
    const response = await fetch(`${API_BASE_URL}/api/user/activities/${id}/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.ok) {
      selectedRecord.value = await response.json()
    }
  } catch (err) {
    console.error('获取详情失败', err)
  }
}

const sendAiMessage = async (message) => {
  if (!message || isChatting.value) return
  
  const textToSend = message
  chatInput.value = ''
  isChatting.value = true
  
  const token = localStorage.getItem('auth_token')
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/ask/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: textToSend })
    })

    if (response.ok) {
      const data = await response.json()
      if(playVoice) {
         playVoice(data.reply)
      }
    }
  } catch (err) {
    console.error('Chat 失败', err)
  } finally {
    isChatting.value = false
  }
}

onMounted(() => {
  fetchActivities()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) chartInstance.dispose()
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}
</style>