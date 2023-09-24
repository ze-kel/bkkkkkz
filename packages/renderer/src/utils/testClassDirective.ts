import type { App, Directive } from 'vue';
import { trpcApi } from './trpc';
import { testClassPrefix } from '/@/utils/testClassBinds';


type IBinding = { value: string | string[] };

const testIdDirective: Directive = (el: HTMLElement, binding: IBinding) => {
  const classes = el.classList.values();

  for (const cl of classes) {
    if (cl.startsWith(testClassPrefix)) {
      el.classList.remove(cl);
    }
  }

  if (Array.isArray(binding.value)) {
    el.classList.add(...binding.value.filter((v) => typeof v === 'string' && v.length));
  } else if (typeof binding.value === 'string') {
    el.classList.add(binding.value);
  }
};

const registerTestClassDirective = async (app: App<Element>) => {
  if (await trpcApi.isTest.query()) {
    app.directive('test-class', testIdDirective);
  } else {
    app.directive('test-class', testIdDirective);
  }
};

export default registerTestClassDirective;
