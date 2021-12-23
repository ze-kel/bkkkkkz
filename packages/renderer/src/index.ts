import { createApp } from 'vue';
import App from '/@/App.vue';
import router from '/@/router';
import VCalendar from 'v-calendar';

import 'normalize.css';
import '/@/styles/Global.scss';

createApp(App).use(router).use(VCalendar, {}).mount('#app');
