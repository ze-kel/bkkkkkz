<script lang="ts" setup>
import {
  keymap,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLineGutter,
  EditorView,
  ViewUpdate,
} from '@codemirror/view';
import { EditorState, Facet, type Extension } from '@codemirror/state';
import { defaultHighlightStyle, syntaxHighlighting, foldKeymap } from '@codemirror/language';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';

import { markdown, markdownKeymap } from '@codemirror/lang-markdown';
import { oneDark } from './theme';

const editorWrapper = useTemplateRef('editorWrapper');
const editor = shallowRef<EditorView | null>();

const emit = defineEmits(['change']);

const props = defineProps({
  initialValue: {
    type: String,
    default: '',
  },
});

defineExpose({ editor });

const updateHook = (update: ViewUpdate) => {
  if (update.docChanged) {
    emit('change');
  }
};

onMounted(() => {
  if (!editorWrapper.value) return;

  const listener: Extension = [EditorView.updateListener.of(updateHook)];

  editor.value = new EditorView({
    doc: props.initialValue,

    extensions: [
      highlightActiveLineGutter(),
      history(),
      drawSelection(),
      dropCursor(),
      EditorState.allowMultipleSelections.of(false),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      rectangularSelection(),
      crosshairCursor(),
      markdown({}),
      oneDark,
      keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap, ...markdownKeymap]),
      listener,
      EditorView.lineWrapping,
    ],
    parent: editorWrapper.value,
  });
});

const colorMode = useColorMode();
</script>

<template>
  <div
    ref="editorWrapper"
    class="root editorStyling h-full"
    :class="colorMode.value === 'dark' && 'dark'"
  ></div>
</template>

<style>
.root {
  /* Neutral */
  --neutral-50: hsl(0 0% 98%);
  --neutral-100: hsl(0 0% 96.1%);
  --neutral-200: hsl(0 0% 89.8%);
  --neutral-300: hsl(0 0% 83.1%);
  --neutral-400: hsl(0 0% 63.9%);
  --neutral-500: hsl(0 0% 45.1%);
  --neutral-600: hsl(0 0% 32.2%);
  --neutral-700: hsl(0 0% 25.1%);
  --neutral-800: hsl(0 0% 14.9%);
  --neutral-900: hsl(0 0% 9%);
  --neutral-950: hsl(0 0% 3.9%);

  --font:                                         
;
}

.editorStyling {
  --text: var(--neutral-950);
  --cursor: var(--neutral-800);
  --selection: var(--neutral-300);

  --fold: var(--neutral-800);
}

.dark.editorStyling {
  --text: var(--neutral-50);
  --cursor: var(--neutral-200);
  --selection: var(--neutral-800);
  --fold: var(--neutral-200);
}
</style>
