import { createApp } from 'vue';
import App from './components/App.vue';
import VCalendar from 'v-calendar';
import { createPinia } from 'pinia';
import registerTestClassDirective from './utils/testClassDirective';

import '/@/styles/Global.css';

const app = createApp(App).use(createPinia()).use(VCalendar, {});
registerTestClassDirective(app);
app.mount('#app');
