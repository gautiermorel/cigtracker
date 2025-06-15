import { createRouter, createWebHistory } from 'vue-router';
import Counter from '../views/Counter.vue';
import History from '../views/History.vue';
import EditHistory from '../views/EditHistory.vue';
import Stats from '../views/Stats.vue';
import Settings from '../views/Settings.vue';

const routes = [
  { path: '/', component: Counter },
  { path: '/history', component: History },
  { path: '/edit-history', component: EditHistory },
  { path: '/stats', component: Stats },
  { path: '/settings', component: Settings }
];

export default createRouter({
  history: createWebHistory(),
  routes,
});
