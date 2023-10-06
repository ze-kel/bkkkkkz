<template>
  <div class="relative h-full w-full overflow-hidden">
    <div
      v-if="!showImage"
      class="absolute left-0 top-0 flex h-full w-full flex-col rounded-md border border-neutral-200 p-3 shadow-lg transition-opacity dark:border-neutral-800"
    >
      <div
        class="title overflow-hiddenalign-middle h-1/2 shrink overflow-hidden text-xl leading-tight"
      >
        {{ mainTitle }}
      </div>
      <hr class="my-2 h-[1px] w-full border-0 bg-neutral-50 dark:bg-neutral-900" />
      <div class="author text-md flex-grow font-semibold">{{ file.author || 'Unknown' }}</div>
      <div v-if="file.year">
        {{ file.year }}
      </div>
    </div>
    <div v-else class="flex h-full items-end overflow-hidden rounded-md">
      <img
        :src="`covers://${file.cover}`"
        class="block h-full w-full object-cover"
        @error="() => (forceFake = true)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
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

const showImage = computed(() => props.file.cover && !forceFake.value);

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
