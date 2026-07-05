import { request } from './http'

export const playTts = (payload) => {
  return request('/api/train/tts-play/', {
    method: 'POST',
    body: payload
  })
}

export const fetchExercises = () => {
  return request('/api/train/exercises/', { auth: true })
}

export const startTrainSession = (payload) => {
  return request('/api/train/session/start/', {
    method: 'POST',
    auth: true,
    body: payload
  })
}

export const fetchTrainSessionState = (sessionId) => {
  return request(`/api/train/session/${sessionId}/state/`, {
    auth: true
  })
}

export const finishTrainSession = (sessionId, reason = 'user_finish') => {
  return request(`/api/train/session/${sessionId}/finish/`, {
    method: 'POST',
    auth: true,
    body: { reason }
  })
}

export const finishTraining = (payload) => {
  return request('/api/train/finish/', {
    method: 'POST',
    auth: true,
    body: payload
  })
}

export const pollTrainStatus = (activityId) => {
  return request(`/api/train/status/${activityId}/`, {
    auth: true
  })
}
