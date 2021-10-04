import { createRouter, createWebHashHistory } from 'vue-router';
import Home from '/@/components/Home.vue';

const routes = [{ path: '/', name: 'Home', component: Home }];

export default createRouter({
  routes,
  history: createWebHashHistory(),
});
