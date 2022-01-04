<template>
  <ContentEditable
    ref="editable"
    v-model="tag"
    tag="div"
    spellcheck="false"
    class="bg-gray-800 w-fit px-2 rounded-lg text-white"
  />
</template>

<script lang="ts" setup>
import { getCurrentInstance, computed, ref, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import ContentEditable from 'vue-contenteditable';

const internalInstance = getCurrentInstance();

const props = defineProps({
  value: {
    type: String,
    default: '',
  },
});

const editable = ref();

defineExpose(editable);

const emit = defineEmits<{
  (e: 'update', data: string): void;
}>();

const tag = computed({
  get: () => props.value,
  set: (val) => {
    if (document.activeElement === editable?.value?.element) {
      return;
    }
    internalInstance?.emit('update', val);
  },
});

onBeforeUnmount(() => {
  // If you have contenteditable focused when closing editor it will cause error in console.
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
});
</script>

<style scoped></style>
