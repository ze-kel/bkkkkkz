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
  text: {
    type: String,
    required: true,
  },
});

let output = '';
let contentCache = '';
const myListener = {
  markdown: [
    (getMarkdown: () => string) => {
      contentCache = getMarkdown();
      internalInstance?.emit('update', contentCache);
    },
  ],
};

const emit = defineEmits<{
  (e: 'update', thing: string): void;
}>();

const makeEditor = (element: HTMLElement) => {
  return Editor.make()
    .config((ctx) => {
      ctx.set(rootCtx, element);
      ctx.set(defaultValueCtx, props.text);
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
  contentCache = props.text;
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
  () => props.text,
  () => {
    updateEditor(props.text);
  },
);
</script>

<style>
@import url(./style/base.css);
@import url(./style/theme.css);
</style>
