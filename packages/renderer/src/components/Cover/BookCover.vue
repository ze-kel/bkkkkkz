<template>
  <div class="aspect-[6/8] min-w-[150px] bg-transparent">
    <div v-if="file.cover && !forceFake" class="h-full flex items-end shadow-neutral-200">
      <img :src="`covers://${file.cover}`" @error="() => (forceFake = true)" />
    </div>

    <div
      v-else
      class="p-3 rounded h-full text-neutral-700 dark:text-neutral-400 border-neutral-300 border dark:border-neutral-700 flex flex-col shadow-l shadow-neutral-200"
    >
      <div class="title leading-tight shrink h-1/2 overflow-hidden align-middle text-xl">
        {{ mainTitle }}
      </div>
      <hr class="h-[1px] border-0 w-full bg-neutral-50 dark:bg-neutral-900 my-2" />
      <div class="author flex-grow font-semibold text-md">{{ file.author || 'Unknown' }}</div>
      <div v-if="file.year">
        {{ file.year }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue';
import { debounce as _debounce } from 'lodash';

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
</script>

<style scoped></style>
