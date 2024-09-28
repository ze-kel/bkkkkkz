<template>
  <div class="relative h-full">
    <transition name="fade">
      <div
        v-if="!hasFocus && (!modelValue || modelValue === '\n' || modelValue === '\n\n')"
        class="absolute left-[50%] -translate-x-full text-neutral-500"
      >
        No markdown content
      </div>
    </transition>
    <Milkdown v-test-class="testClasses.editorMarkdown" class="h-full" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Editor, rootCtx, defaultValueCtx, editorViewCtx, parserCtx } from '@milkdown/core';
import { Milkdown, useEditor } from '@milkdown/vue';
import { commonmark } from '@milkdown/preset-commonmark';
import { listener, listenerCtx } from '@milkdown/plugin-listener';
import { Slice } from 'prosemirror-model';
import 'prosemirror-view/style/prosemirror.css';
import type { Ctx } from '@milkdown/ctx';
import { testClasses } from '~/tools/tests/binds';

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

const emit = defineEmits<{
  (e: 'update:modelValue', data: string): void;
}>();

// Cache to determine whether update came from this widget or file watcher
let contentCache = '';

const hasFocus = ref(false);

const focusWatcher = (ctx: Ctx) => {
  const view = ctx.get(editorViewCtx);
  hasFocus.value = view.hasFocus();
};

const editor = ref<Editor>();
useEditor(
  (root) =>
    (editor.value = Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, props.modelValue);
        const listener = ctx.get(listenerCtx);
        listener.markdownUpdated((ctx, markdown) => {
          contentCache = markdown;
          emit('update:modelValue', markdown);
        });
        listener.focus(focusWatcher);
        listener.blur(focusWatcher);
      })
      .use(commonmark)
      .use(listener)),
);

const updateEditor = (markdown: string) => {
  if (typeof markdown !== 'string' || !editor.value) return;
  editor.value.action((ctx) => {
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
.fade-enter-active {
  transition: opacity 0.3s cubic-bezier(0.07, 0.56, 0.43, 0.88);
}
.fade-leave-active {
  transition: opacity 0.3s cubic-bezier(0.07, 0.56, 0.43, 0.88);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Typography based on https://ui.shadcn.com/docs/components/typography */

.milkdown {
  height: 100%;
}

.ProseMirror {
  height: 100%;
}

.ProseMirror h1,
h2,
h3,
h4,
h5,
h6 {
  @apply mb-2 font-medium;
}

.ProseMirror h1 {
  @apply scroll-m-20 text-5xl font-extrabold tracking-tight;
}

.ProseMirror h2 {
  @apply scroll-m-20 text-3xl font-semibold tracking-tight transition-colors first:mt-0;
}

.ProseMirror h3 {
  @apply scroll-m-20 text-2xl font-semibold tracking-tight;
}

.ProseMirror h4 {
  @apply scroll-m-20 text-xl font-bold tracking-tight;
}

.ProseMirror h5 {
  @apply text-lg font-semibold;
}

.ProseMirror h6 {
  @apply italic;
}

.ProseMirror blockquote {
  @apply mt-6 border-l-2 pl-6 italic;
}

.ProseMirror ul {
  @apply list-disc [&>li]:mt-1;
}

.ProseMirror ol {
  @apply list-decimal [&>li]:mt-1;
}

.ProseMirror hr {
  @apply my-2 h-0.5 border-none bg-neutral-950 opacity-20 outline-none dark:bg-neutral-50;
}

/* Markdown visualizers */

.ProseMirror h1::before {
  content: '#';
  @apply absolute -left-4 -translate-x-full opacity-10;
}
.ProseMirror h2::before {
  content: '##';
  @apply absolute -left-4 -translate-x-full opacity-10;
}
.ProseMirror h3::before {
  content: '###';
  @apply absolute -left-4 -translate-x-full opacity-10;
}
.ProseMirror h4::before {
  content: '####';
  @apply absolute -left-4 -translate-x-full opacity-10;
}
.ProseMirror h5::before {
  content: '#####';
  @apply absolute -left-4 -translate-x-full opacity-10;
}
.ProseMirror h6::before {
  content: '######';
  font-style: normal;
  @apply absolute -left-4 -translate-x-full opacity-10;
}
</style>
