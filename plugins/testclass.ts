import type { Directive } from 'vue';
import { testClassPrefix } from '../tools/tests/binds';

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

export default defineNuxtPlugin({
  name: 'test-class-directive',
  enforce: 'post',

  async setup(nuxtApp) {
    const ENABLE_TEST_CLASS = true;

    if (ENABLE_TEST_CLASS) {
      nuxtApp.vueApp.directive('test-class', testIdDirective);
    } else {
      nuxtApp.vueApp.directive('test-class', testIdDirective);
    }
  },
});
