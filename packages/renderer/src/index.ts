import { createApp } from 'vue';
import App from './components/App.vue';
import { createPinia } from 'pinia';
import registerTestClassDirective from './utils/testClassDirective';

import '@vuepic/vue-datepicker/dist/main.css';
import '/@/styles/Global.css';

const app = createApp(App).use(createPinia());
registerTestClassDirective(app);
app.mount('#app');
