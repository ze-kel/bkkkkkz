<template>
  <div
    class="p-3 rounded aspect-[6/8] w-full min-w-[150px] text-white flex flex-col shadow-xl shadow-gray-200"
    :class="bgClass"
  >
    <div class="title leading-tight shrink h-1/2 overflow-hidden align-middle text-xl">
      {{ mainTitle }}
    </div>
    <hr class="hr-default bg-white my-2" />
    <div class="author flex-grow font-semibold text-md">{{ author }}</div>
    <div v-if="year && year > 0">
      {{ year }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue';
import type { PropType } from 'vue';
import type { IBookData } from '/@main/services/books';
import _debounce from 'lodash-es/debounce';
import getRandomNumber from '/@/utils/randomFromString';

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
    type: Number as PropType<IBookData['year']>,
    required: false,
    default: -1,
  },
});

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

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

const randomColorIndex = getRandomNumber(props.title || 'notitle', 0, baseColors.length);

const bgClass = baseColors[randomColorIndex];
</script>

<style scoped></style>
