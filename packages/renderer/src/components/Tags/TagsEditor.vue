<template>
  <div class="flex flex-wrap gap-1">
    <template v-for="(tag, index) in tags" :key="index">
      <ContentEditable
        ref="tagRefs"
        v-test-class="'T-editor-tag'"
        :model-value="tag"
        tag="div"
        spellcheck="false"
        :no-n-l="true"
        :class="classes()"
        @update:model-value="(val: string | Number) => saveTag(index, String(val))"
      />
    </template>
    <div
      v-test-class="'T-editor-add-tag'"
      class="cursor-pointer"
      :class="classes()"
      @click="createNewTag"
    >
      <PlusIcon class="w-4 fill-neutral-200 transition-colors group-hover:fill-neutral-400" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getCurrentInstance, computed, nextTick, ref } from 'vue';
import type { PropType, Ref } from 'vue';
import ContentEditable from '/@/components/_UI/ContentEditable.vue';
import PlusIcon from '@heroicons/vue/24/outline/PlusSmallIcon';
import { cva } from 'class-variance-authority';

const classes = cva([
  'text-foreground inline-flex items-center rounded-md  px-2.5 py-0.5 text-xs font-semibold transition-colors',
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

  nextTick(() => {
    // Add better logic for edge cases
    const targ = tagRefs.value[index].value;
    console.log(targ);
    targ.focus();
  });
};

const tagRefs = ref<Ref<HTMLElement>[]>([]);

const createNewTag = () => {
  saveTag(tags.value.length, `tag${tags.value.length + 1}`);

  nextTick(() => {
    const lastTag = tagRefs.value[tagRefs.value.length - 1].value;

    if (lastTag) {
      lastTag.focus();

      const sel = window.getSelection();
      if (sel) {
        const range = document.createRange();
        range.selectNodeContents(lastTag);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  });
};
</script>

<style scoped></style>
