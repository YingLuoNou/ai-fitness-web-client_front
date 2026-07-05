import { request } from './http'

export const fetchDashboard = () => {
  return request('/api/user/dashboard/', { auth: true })
}

export const fetchUserActivities = () => {
  return request('/api/user/activities/', { auth: true })
}

export const fetchUserActivityDetail = (id) => {
  return request(`/api/user/activities/${id}/`, { auth: true })
}

export const fetchUserProfile = () => {
  return request('/api/user/profile/', { auth: true })
}
