<template>
  <div class="flex gap-y-1 gap-x-0.5 flex-wrap">
    <template v-for="(tag, index) in tags" :key="index">
      <ContentEditable
        ref="tagRefs"
        :model-value="tag"
        tag="div"
        spellcheck="false"
        class="bg-neutral-800 w-fit px-2 rounded-lg text-neutral-50 dark:text-neutral-900"
        @update:model-value="(val: string | Number) => saveTag(index, String(val))"
      />
    </template>
    <div
      class="bg-neutral-800 w-fit pl-1 pr-2 rounded-lg text-neutral-50 dark:text-neutral-900 cursor-pointer flex items-center"
      @click="createNewTag"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        class="fill-white hover:fill-neutral-200"
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
import ContentEditable from '/@/components/_UI/ContentEditable.vue';
import { internalTagsList } from '/@main/services/tags';

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
  get: () => {
    const tags = props.modelValue;
    tags.sort((a, b) => a.localeCompare(b));
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
};

const tagRefs = ref([]);

const createNewTag = () => {
  saveTag(tags.value.length, `tag${tags.value.length + 1}`);

  nextTick(() => {
    // Docs suggest that using const tagRefs = ref([]) should work, but I couldn't make it to.
    // Probably will be fixed later.
    const refs = internalInstance?.refs.tagRefs as any[];
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
