<template>
  <div ref="containerDiv" class="relative flex flex-wrap items-center gap-1">
    <template v-for="(tag, index) in tags" :key="index">
      <ContentEditable
        ref="tagRefs"
        v-test-class="testClasses.editorTag"
        :model-value="tag"
        tag="div"
        spellcheck="false"
        :no-n-l="true"
        class="before:pr-0.5 before:opacity-50 before:content-['#']"
        :class="classes()"
        @keydown="(e: KeyboardEvent) => keyDownHandler(e, index)"
        @update:model-value="(val: string | Number) => saveTag(index, String(val))"
        @returned="createNewTag"
      />
    </template>
    <div
      v-test-class="testClasses.editorAddTag"
      class="cursor-pointer"
      :class="classes()"
      @click="createNewTag"
    >
      <PlusIcon
        class="w-3 fill-neutral-200 pr-0.5 opacity-50 transition-colors group-hover:fill-neutral-400"
      />
      <div>tag</div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue';
import type { PropType, Ref } from 'vue';
import ContentEditable from '~/components/_UI/ContentEditable.vue';
import { PlusIcon } from 'lucide-vue-next';
import { cva } from 'class-variance-authority';
import { testClasses } from '~/tools/tests/binds';

const classes = cva([
  'text-foreground inline-flex items-center rounded-md  px-2.5 py-0.5 text-xs font-semibold transition-all h-6',
  'border-neutral-200 dark:border-neutral-800 border',
  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-950 dark:focus-visible:ring-neutral-300',
]);

const props = defineProps({
  modelValue: {
    type: Array as PropType<string[]>,
    default: () => [],
  },
});

const emit = defineEmits<{
  (e: 'update:modelValue', data: string[]): void;
}>();

const tags = computed({
  get: () => {
    const tags = props.modelValue;
    //tags.sort((a, b) => a.localeCompare(b));
    return tags;
  },
  set: (val) => {
    emit('update:modelValue', val);
  },
});

const saveTag = (index: number, tag: string) => {
  const newTags = [...tags.value];
  if (!tag) {
    newTags.splice(index, 1);
  } else {
    newTags[index] = tag;
  }
  tags.value = newTags;

  if (!tag) {
    nextTick(() => {
      if (!tags.value.length) return;

      // When deleting first tag jump to second otherwise jump to previous
      const indexToSet = index === 0 ? 0 : index - 1;

      const targ = tagRefs.value[indexToSet].element;
      targ.focus();
      selectElement(targ);
    });
  }
};

const tagRefs = ref<{ element: HTMLElement }[]>([]);

const selectElement = (element: HTMLElement, place?: 'end' | 'start') => {
  element.focus();
  const sel = window.getSelection();
  if (sel) {
    const range = document.createRange();

    if (place) {
      // We need to create range for text inside div, not div itself.
      // Otherwise selection.focusOffset(and anchorOfsset) will be 1 and we won't be able to jump to next tag immediatelly.
      // We have ::before on div, but it's not considered a child node therefore [0]
      const text = element.childNodes[0];
      if (!text) {
        // Shouldn't happen, but just in case
        console.error('Somethings is wrong when moving selection between tags');
      } else {
        if (place === 'end') {
          range.setStart(text, text.nodeValue?.length || 0);
          range.setEnd(text, text.nodeValue?.length || 0);
        } else {
          range.setStart(text, 0);
          range.setEnd(text, 0);
        }
      }
    } else {
      // This will select the whole tag
      range.selectNodeContents(element);
    }
    sel.removeAllRanges();
    sel.addRange(range);
  }
};

const createNewTag = () => {
  saveTag(tags.value.length, `tag${tags.value.length + 1}`);

  // Focus and select all
  nextTick(() => {
    const lastTag = tagRefs.value[tagRefs.value.length - 1].element;
    if (lastTag) {
      selectElement(lastTag);
    }
  });
};

const keyDownHandler = (e: KeyboardEvent, index: number) => {
  const tagValue = props.modelValue[index];

  if (e.code !== 'ArrowRight' && e.code !== 'ArrowLeft') return;
  const dir = e.code === 'ArrowLeft' ? -1 : 1;
  const selection = window.getSelection();
  if (!selection) return;

  // If ArrowLeft pressed when cursor is at start of tag move to previous tag
  if (selection.focusOffset === 0 && dir === -1) {
    e.preventDefault();
    if (index === 0) return;
    const tag = tagRefs.value[index - 1].element;
    selectElement(tag, 'end');
    return;
  }

  if (selection.focusOffset >= tagValue.length && dir === 1) {
    e.preventDefault();
    if (index === props.modelValue.length - 1) return;
    const tag = tagRefs.value[index + 1].element;
    selectElement(tag, 'start');
    return;
  }
};
</script>

<style scoped></style>
