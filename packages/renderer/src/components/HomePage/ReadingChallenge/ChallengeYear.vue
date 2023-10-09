<template>
  <div>
    <div class="flex items-center">
      <div class="text-base">
        <span v-if="percentCompletion === 100"> </span>
      </div>
    </div>

    <div class="flex items-center">
      <div class="mr-4 font-mono">{{ year }}</div>

      <div class="h-2 w-full rounded-md border border-neutral-200 dark:border-neutral-800">
        <div
          class="h-full rounded-md bg-neutral-900 dark:bg-neutral-50"
          :style="{ width: `${percentCompletion}%` }"
        ></div>
      </div>

      <div class="ml-3 flex w-fit items-center gap-0 whitespace-nowrap">
        <span class="mr-1 px-1 py-1 text-sm">{{ booksForThatYear.length }}</span>
        <span>/</span>
        <BasicInput
          v-model="editableChallenge"
          type="number"
          placeholder="?"
          theme="hidden"
          class="ml-1 w-[40px] px-1"
          :number="true"
        >
        </BasicInput>
      </div>

      <BasicButton
        variant="ghost"
        size="icon"
        class="ml-1 flex h-4 cursor-pointer items-center rounded transition-colors hover:bg-neutral-800"
        @click="emit('delete')"
      >
        <XIcon
          class="h-4 w-4 cursor-pointer stroke-neutral-200 transition-colors dark:stroke-neutral-600 dark:hover:stroke-neutral-300"
        />
      </BasicButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';

import ContentEditable from '/@/components/_UI/ContentEditable.vue';
import { XIcon } from 'lucide-vue-next';

import type { PropType } from 'vue';
import type { ISavedFile } from '/@main/services/files';
import BasicButton from '/@/components/_UI/BasicButton/BasicButton.vue';
import BasicInput from '/@/components/_UI/BasicInput.vue';

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
