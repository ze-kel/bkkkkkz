<template>
  <component
    :is="tag"
    ref="element"
    :class="placeholder && placeholderClasses"
    :contenteditable="contenteditable"
    @input="inputHandler"
    @focus="focusHandler"
    @blur="blurHandler"
    @paste="onPaste"
    @keypress="onKeypress"
  />
</template>

<script lang="ts" setup>
import { ref, onMounted, watch, Events, computed, defineComponent } from 'vue';
import type { PropType } from 'vue';

const props = defineProps({
  tag: {
    type: String,
    default: 'div',
  },
  contenteditable: {
    type: Boolean,
    default: true,
  },
  modelValue: {
    type: String,
    default: '',
  },
  noHTML: {
    type: Boolean,
    default: true,
  },
  noNL: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: 'Placeholder',
  },
  placeholderClasses: {
    type: String,
    default: '',
  },
});
const emit = defineEmits({
  returned: String,
  'update:modelValue': String,
});

// Based on https://github.com/hl037/vue-contenteditable/blob/master/src/components/contenteditable.vue.d.ts

function replaceAll(str: string, search: string, replacement: string) {
  return str.split(search).join(replacement);
}

const element = ref<HTMLElement | null>(null);

const focused = ref();
const placeholder = ref();

function currentContent() {
  if (!element.value) return '';
  return props.noHTML ? element.value.innerText : element.value.innerHTML;
}

function updateContent(newcontent: string, usePlaceholder: boolean) {
  if (!element.value) return;

  if (usePlaceholder && !newcontent) {
    element.value.innerHTML = props.placeholder;
    placeholder.value = true;
  } else {
    placeholder.value = false;
    if (props.noHTML) {
      element.value.innerText = newcontent;
    } else {
      element.value.innerHTML = newcontent;
    }
  }
}

function focusHandler() {
  focused.value = true;
  placeholder.value = false;
  updateContent(props.modelValue, false);
}

function blurHandler() {
  focused.value = false;
  updateContent(props.modelValue, true);
}

function inputHandler() {
  emit('update:modelValue', currentContent());
}

function onPaste(event: ClipboardEvent) {
  event.preventDefault();
  if (!event.clipboardData) return;
  let text = event.clipboardData.getData('text/plain');
  if (props.noNL) {
    text = replaceAll(text, '\r\n', ' ');
    text = replaceAll(text, '\n', ' ');
    text = replaceAll(text, '\r', ' ');
  }
  window.document.execCommand('insertText', false, text);
}

function onKeypress(event: KeyboardEvent) {
  if (event.key == 'Enter' && props.noNL) {
    event.preventDefault();
    emit('returned', currentContent());
  }
}

onMounted(() => {
  updateContent(props.modelValue, true);
});

watch(
  () => props.modelValue,
  (newval) => {
    if (newval != currentContent()) {
      updateContent(newval, !focused.value);
    }
  },
);
</script>
