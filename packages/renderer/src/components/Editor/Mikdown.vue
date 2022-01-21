<template>
  <div ref="editor" class="h-full"></div>
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
import { commonmark } from '@milkdown/preset-commonmark';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { getCurrentInstance, watch, ref, onMounted } from 'vue';

const internalInstance = getCurrentInstance();

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

let contentCache = '';
const myListener = {
  markdown: [
    (getMarkdown: () => string) => {
      contentCache = getMarkdown();
      emit('update:modelValue', contentCache);
    },
  ],
};

const emit = defineEmits<{
  (e: 'update:modelValue', thing: string): void;
}>();

const makeEditor = (element: HTMLElement) => {
  return Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, element);
      ctx.set(defaultValueCtx, props.modelValue);
      ctx.set(listenerCtx, myListener);
    })
    .use(themeFactory({}))
    .use(commonmark.headless())
    .use(listener);
};

let editor: Editor;

onMounted(async () => {
  const el = internalInstance?.refs.editor as HTMLElement;
  editor = await makeEditor(el);
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
</style>
