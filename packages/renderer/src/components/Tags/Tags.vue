<template>
  <div class="flex gap-y-1 gap-x-0.5 flex-wrap">
    <Tag
      v-for="(tag, index) in tags"
      ref="tagRefs"
      :key="index"
      :value="tag"
      @update="(val: string) => saveTag(index, val)"
    />

    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      class="fill-gray-800 hover:fill-gray-600 cursor-pointer"
      @click="createNewTag"
    >
      <path d="M13 13V19H11V13H5V11H11V5H13V11H19V13H13Z" />
    </svg>
  </div>
</template>

<script lang="ts" setup>
import { getCurrentInstance, computed, ref, onBeforeUpdate, nextTick, onMounted } from 'vue';
import type { PropType } from 'vue';
import Tag from './Tag.vue';
const internalInstance = getCurrentInstance();

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
  get: () => props.modelValue,
  set: (val) => {
    if (internalInstance) internalInstance.emit('update:modelValue', val);
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
};

const createNewTag = () => {
  saveTag(tags.value.length, 'tag');

  nextTick(() => {
    // Docs suggest that using const tagRefs = ref([]) should work, but I couldn't make it to.
    // Probably will be fixed later.
    const refs = internalInstance?.refs.tagRefs as any[];
    const lastTag = refs[refs.length - 1].value.element;

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
