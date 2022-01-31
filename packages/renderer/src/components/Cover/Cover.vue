<template>
  <div class="aspect-[6/8] min-w-[150px] bg-transparent">
    <div v-if="file.cover && !forceFake" class="h-full flex items-end shadow-neutral-200">
      <img :src="`covers://${file.cover}`" @error="() => (forceFake = true)" />
    </div>

    <div
      v-else
      class="p-3 rounded h-full text-neutral-50 dark:text-neutral-900 flex flex-col shadow-l shadow-neutral-200"
      :class="colorClass"
    >
      <div class="title leading-tight shrink h-1/2 overflow-hidden align-middle text-xl">
        {{ mainTitle }}
      </div>
      <hr class="hr-default bg-neutral-50 dark:bg-neutral-900 my-2" />
      <div class="author flex-grow font-semibold text-md">{{ file.author || 'Unknown' }}</div>
      <div v-if="file.year">
        {{ file.year }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue';
import _debounce from 'lodash-es/debounce';
import getRandomNumber from '/@/utils/randomFromString';

import type { PropType } from 'vue';
import type { IBookData } from '/@main/services/books';

const props = defineProps({
  file: {
    type: Object as PropType<IBookData>,
    required: true,
  },
});

const forceFake = ref(false);

watch(
  () => props.file.cover,
  () => {
    if (props.file.cover) {
      forceFake.value = false;
    } else {
      forceFake.value = true;
    }
  },
);

const mainTitle = computed(() => (props.file.title ? props.file.title.split(':')[0] : 'Unknown'));
const baseColors = [
  'bg-orange-500 dark:bg-orange-700',
  'bg-lime-500 dark:bg-lime-700',
  'bg-emerald-400 dark:bg-emerald-700',
  'bg-sky-600 dark:bg-sky-600',
  'bg-indigo-600 dark:bg-indigo-700',
  'bg-purple-600 dark:bg-indigo-700',
  'bg-rose-600 dark:bg-rose-700',
];

const randomColorIndex = getRandomNumber(props.file.title || 'notitle', 0, baseColors.length);

const colorClass = baseColors[randomColorIndex];
</script>

<style scoped></style>
