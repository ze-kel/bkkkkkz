import { createApp } from 'vue';
import App from './components/App.vue';
import VCalendar from 'v-calendar';
import { createPinia } from 'pinia';
import registerTestClassDirective from './utils/testClassDirective';
import type { VueQueryPluginOptions } from '@tanstack/vue-query';
import { VueQueryPlugin } from '@tanstack/vue-query';

import '/@/styles/Global.css';
import 'v-calendar/dist/style.css';

const vueQueryPluginOptions: VueQueryPluginOptions = {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  },
};

const app = createApp(App)
  .use(createPinia())
  .use(VCalendar, {})
  .use(VueQueryPlugin, vueQueryPluginOptions);
registerTestClassDirective(app);
app.mount('#app');
