import { createRouter, createWebHistory } from 'vue-router'
import LoginScreen from '../components/LoginScreen.vue'
import Home from '../views/Home.vue'
import Activity from '../views/Activity.vue'

const routes = [
  { path: '/', name: 'Login', component: LoginScreen },
  { path: '/home', name: 'Home', component: Home },
  { path: '/activity', name: 'Activity', component: Activity } 
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router