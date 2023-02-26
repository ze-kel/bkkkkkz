<template>
  <div>
    <div class="flex items-center">
      <div class="text-xl font-light">
        {{ year }}
        <span v-if="percentCompletion === 100">— Completed</span>
      </div>
    </div>

    <div class="flex items-center">
      <div class="bg-neutral-600 rounded-xl w-full h-2">
        <div
          class="bg-indigo-600 rounded-xl h-full"
          :style="{ width: `${percentCompletion}%` }"
        ></div>
      </div>

      <div class="ml-3 font-black whitespace-nowrap flex w-fit">
        <span class="mr-1">{{ booksForThatYear.length }}</span>
        /
        <ContentEditable
          v-model="editableChallenge"
          placeholder="?"
          class="ml-1 min-w-[20px]"
          :number="true"
        />
      </div>

      <div
        class="hover:bg-neutral-800 rounded flex items-center h-4 ml-1 transition-colors cursor-pointer"
        @click="emit('delete')"
      >
        <CrossIcon
          class="w-4 h-4 stroke-neutral-200 dark:stroke-neutral-600 dark:hover:stroke-neutral-300 transition-colors cursor-pointer"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';

import ContentEditable from '/@/components/_UI/ContentEditable.vue';
import CrossIcon from '@heroicons/vue/24/outline/XMarkIcon';

import type { PropType } from 'vue';
import type { ISavedFile } from '/@main/services/files';

const props = defineProps({
  booksForThatYear: {
    type: Array as PropType<ISavedFile[]>,
    default: () => [],
  },
  year: {
    type: Number,
    required: true,
  },
  challenge: {
    type: Number,
    default: undefined,
  },
});

const emit = defineEmits<{
  (e: 'delete'): void;
  (e: 'change', books: number): void;
}>();

const editableChallenge = computed({
  get: () => props.challenge,
  set: (val: number | undefined) => {
    if (!val) return;
    emit('change', val);
  },
});

const percentCompletion = computed(() => {
  if (!props.challenge) return 0;
  return Math.min((props.booksForThatYear.length / props.challenge) * 100, 100);
});
</script>

<style scoped></style>
