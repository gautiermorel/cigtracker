import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';
import History from '../views/History.vue';
import Profile from '../views/Profile.vue';
import Stats from '../views/Stats.vue';
import Settings from '../views/Settings.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: { key: 'home' }
  },
  {
    path: '/history',
    name: 'History',
    component: History,
    meta: { key: 'history' }
  },
  {
    path: '/stats',
    name: 'Stats',
    component: Stats,
    meta: { key: 'stats' }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: { key: 'settings' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { key: 'profile' }
  }
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
