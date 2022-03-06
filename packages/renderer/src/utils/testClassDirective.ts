import type { App, Directive } from 'vue';
import { useElectron } from '../use/electron';

const testIdDirective: Directive = (el: HTMLElement, binding, vnode) => {
  if (typeof binding.value === 'string') el.classList.add(binding.value);
};

const registerTestClassDirective = async (app: App<Element>) => {
  const electron = useElectron();

  if (await electron.core.isTest()) {
    app.directive('test-class', testIdDirective);
  } else {
    app.directive('test-class', {});
  }
};

export default registerTestClassDirective;
