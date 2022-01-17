<template>
  <div class="flex gap-y-1 gap-x-0.5 flex-wrap">
    <ContentEditable
      v-for="(tag, index) in tags"
      :key="index"
      ref="tagRefs"
      :model-value="tag"
      tag="div"
      spellcheck="false"
      class="bg-gray-800 w-fit px-2 rounded-lg text-white"
      @update:model-value="(val: string) => saveTag(index, val)"
    />

    <div
      class="bg-gray-800 w-fit pl-1 pr-2 rounded-lg text-white cursor-pointer flex items-center"
      @click="createNewTag"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        class="fill-white hover:fill-gray-200"
      >
        <path d="M13 13V19H11V13H5V11H11V5H13V11H19V13H13Z" />
      </svg>
      tag
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getCurrentInstance, computed, nextTick, ref } from 'vue';
import type { PropType, Ref } from 'vue';
import Tag from './Tag.vue';
import ContentEditable from '/@/components/_UI/ContentEditable.vue';

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

const tagRefs = ref([]);

const createNewTag = () => {
  saveTag(tags.value.length, `tag${tags.value.length + 1}`);

  nextTick(() => {
    // Docs suggest that using const tagRefs = ref([]) should work, but I couldn't make it to.
    // Probably will be fixed later.
    const refs = internalInstance?.refs.tagRefs as any[];
    console.log('last', refs[0].value);
    const lastTag = refs[refs.length - 1].value;

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
