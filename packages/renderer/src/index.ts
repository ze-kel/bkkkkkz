import { createApp } from 'vue';
import App from '/@/App.vue';
import router from '/@/router';
import 'normalize.css';
import '/@/styles/Global.scss';
import '/@/styles/Variables.scss';

import FontAwesomeIcon from './fa-icons';

createApp(App).use(router).component('font-awesome-icon', FontAwesomeIcon).mount('#app');
