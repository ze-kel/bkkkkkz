import { createRouter, createWebHashHistory } from 'vue-router';
import Home from './components/App.vue';

const routes = [{ path: '/', name: 'Home', component: Home }];

export default createRouter({
  routes,
  history: createWebHashHistory(),
});
