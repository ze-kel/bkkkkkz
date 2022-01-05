import { createApp } from 'vue';
import App from '/@/App.vue';
import router from '/@/router';
import VCalendar from 'v-calendar';
import { createPinia } from 'pinia'

import '/@/styles/Global.css';

createApp(App).use(router).use(createPinia()).use(VCalendar, {}).mount('#app');
