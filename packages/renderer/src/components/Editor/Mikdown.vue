<template>
  <div class="w-full h-full relative">
    <transition name="fade">
      <div
        v-if="!hasFocus && (!modelValue || modelValue === '\n' || modelValue === '\n\n')"
        class="absolute left-[50%] top-[50%] -translate-x-full -translate-y-full text-neutral-500"
      >
        No markdown content
      </div>
    </transition>
    <div ref="editorRef" v-test-class="'T-editor-markdown'" class="h-full"></div>
  </div>
</template>

<script lang="ts" setup>
import { Slice } from 'prosemirror-model';
import {
  defaultValueCtx,
  Editor,
  rootCtx,
  themeFactory,
  editorViewCtx,
  parserCtx,
} from '@milkdown/core';
import type { Ctx } from '@milkdown/core';
import { commonmark } from '@milkdown/preset-commonmark';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { getCurrentInstance, watch, ref, onMounted } from 'vue';
import { log } from 'console';

const internalInstance = getCurrentInstance();

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

let contentCache = '';

const emit = defineEmits<{
  (e: 'update:modelValue', thing: string): void;
}>();

const myTheme = themeFactory((emotion) => ({
  font: {},
  size: {},
  color: {},
  slots: () => ({}),
}));

const chagesListener = (ctx: Ctx, markdown: string, prevMarkdown: string | null) => {
  contentCache = markdown;
  emit('update:modelValue', contentCache);
};

const hasFocus = ref(false);

const focusWatcher = (ctx: Ctx) => {
  const view = ctx.get(editorViewCtx);
  hasFocus.value = view.hasFocus();
};

const makeEditor = (element: HTMLElement) => {
  return Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, element);
      ctx.set(defaultValueCtx, props.modelValue);
      ctx.get(listenerCtx).markdownUpdated(chagesListener);
      ctx.get(listenerCtx).focus(focusWatcher);
      ctx.get(listenerCtx).blur(focusWatcher);
    })
    .use(myTheme)
    .use(commonmark.headless())
    .use(listener);
};

let editor: Editor;

const editorRef = ref<HTMLElement>();

watch(editorRef, async () => {
  if (!editorRef.value) return;
  editor = await makeEditor(editorRef.value);
  editor.create();
  contentCache = props.modelValue;
});

const updateEditor = (markdown: string) => {
  if (typeof markdown !== 'string' || !editor) return;
  editor.action((ctx) => {
    const view = ctx.get(editorViewCtx);
    const parser = ctx.get(parserCtx);
    const doc = parser(markdown);
    if (!doc) {
      return;
    }
    const state = view.state;
    if (contentCache === markdown) return;
    contentCache = markdown;
    view.dispatch(state.tr.replace(0, state.doc.content.size, new Slice(doc.content, 0, 0)));
  });
};

watch(
  () => props.modelValue,
  () => {
    updateEditor(props.modelValue);
  },
);
</script>

<style>
@import url(./style/base.css);
@import url(./style/theme.css);

.fade-enter-active {
  transition: opacity 0.5s ease;
}
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
