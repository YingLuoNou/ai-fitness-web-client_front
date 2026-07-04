import { createRouter, createWebHistory } from 'vue-router'
import LoginScreen from '../components/LoginScreen.vue'
import Home from '../views/Home.vue' // 我们下一步要建的页面

const routes = [
  { path: '/', name: 'Login', component: LoginScreen },
  { path: '/home', name: 'Home', component: Home }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router