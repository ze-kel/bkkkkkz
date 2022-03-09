import type { App, Directive } from 'vue';
import { useElectron } from '../use/electron';

type IBinding = { value: string | string[] };

const testIdDirective: Directive = (el: HTMLElement, binding: IBinding) => {
  if (Array.isArray(binding.value)) {
    el.classList.add(...binding.value);
  } else if (typeof binding.value === 'string') {
    el.classList.add(binding.value);
  }
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
