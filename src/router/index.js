import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/views/pages/conversation';

const routes = [
  { path: '/', component: Home },
  { path: '/chat/:id', component: Home, name: 'Chat' },
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
