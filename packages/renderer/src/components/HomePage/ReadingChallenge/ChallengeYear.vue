<template>
  <div>
    <div class="flex items-center">
      <div class="text-xl font-light">
        {{ year }}
        <span v-if="percentCompletion === 100">— Completed</span>
      </div>
    </div>

    <div class="flex items-center">
      <div class="h-2 w-full rounded-xl bg-neutral-600">
        <div
          class="h-full rounded-xl bg-indigo-600"
          :style="{ width: `${percentCompletion}%` }"
        ></div>
      </div>

      <div class="ml-3 flex w-fit whitespace-nowrap font-black">
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
        class="ml-1 flex h-4 cursor-pointer items-center rounded transition-colors hover:bg-neutral-800"
        @click="emit('delete')"
      >
        <XIcon
          class="h-4 w-4 cursor-pointer stroke-neutral-200 transition-colors dark:stroke-neutral-600 dark:hover:stroke-neutral-300"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';

import ContentEditable from '/@/components/_UI/ContentEditable.vue';
import { XIcon } from 'lucide-vue-next';

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
