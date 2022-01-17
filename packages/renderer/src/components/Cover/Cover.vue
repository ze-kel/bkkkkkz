<template>
  <div class="aspect-[6/8] w-full min-w-[150px]">
    <div v-if="cover && !forceFake" class="h-full flex items-end shadow-gray-200">
      <img :src="`covers://${cover}`" @error="() => (forceFake = true)" />
    </div>

    <div
      v-else
      class="p-3 rounded h-full text-white flex flex-col shadow-xl shadow-gray-200"
      :class="bgClass"
    >
      <div class="title leading-tight shrink h-1/2 overflow-hidden align-middle text-xl">
        {{ mainTitle }}
      </div>
      <hr class="hr-default bg-white my-2" />
      <div class="author flex-grow font-semibold text-md">{{ author }}</div>
      <div v-if="year && Number(year) > 0">
        {{ year }}
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
  title: {
    type: String as PropType<IBookData['title']>,
    required: false,
    default: 'Unknown Title',
  },
  author: {
    type: String as PropType<IBookData['author']>,
    required: false,
    default: 'Unknown Autor',
  },
  rating: {
    type: Number as PropType<IBookData['myRating']>,
    required: false,
    default: -1,
  },
  year: {
    type: String as PropType<IBookData['year']>,
    required: false,
    default: -1,
  },
  cover: {
    type: String as PropType<IBookData['cover']>,
    required: false,
    default: undefined,
  },
  menu: {
    type: Boolean,
    default: false,
  },
});

const forceFake = ref(false);

watch(
  () => props.cover,
  () => {
    forceFake.value = false;
  },
);

const mainTitle = computed(() => (props.title ? props.title.split(':')[0] : ''));
const baseColors = [
  'bg-orange-500',
  'bg-lime-500',
  'bg-emerald-400',
  'bg-sky-600',
  'bg-indigo-600',
  'bg-purple-600',
  'bg-rose-600',
];

const randomColorIndex = getRandomNumber(props.title || 'notitle', 0, baseColors.length);

const bgClass = baseColors[randomColorIndex];

</script>

<style scoped></style>
