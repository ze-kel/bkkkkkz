import { createApp } from 'vue';
import App from './components/App.vue';
import { createPinia } from 'pinia';
import registerTestClassDirective from './utils/testClassDirective';
import type { VueQueryPluginOptions } from '@tanstack/vue-query';
import { VueQueryPlugin } from '@tanstack/vue-query';

import '@vuepic/vue-datepicker/dist/main.css';
import '/@/styles/Global.css';

const vueQueryPluginOptions: VueQueryPluginOptions = {
  queryClientConfig: {
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
      },
    },
  },
};

const app = createApp(App).use(createPinia()).use(VueQueryPlugin, vueQueryPluginOptions);
registerTestClassDirective(app);
app.mount('#app');
