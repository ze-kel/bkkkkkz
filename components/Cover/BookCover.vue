<template>
  <div class="relative h-full w-full overflow-hidden @container">
    <div
      v-if="!showImage"
      class="absolute left-0 top-0 flex h-full w-full flex-col rounded-md border border-neutral-200 p-3 shadow-lg transition-opacity dark:border-neutral-800"
    >
      <div
        class="title x h-1/2 shrink overflow-hidden align-middle text-xs leading-tight @[10rem]:text-lg"
      >
        {{ mainTitle }}
      </div>
      <hr class="my-2 h-[1px] w-full border-0 bg-neutral-50 dark:bg-neutral-900" />
      <div class="author @[10rem]:text-md flex-grow text-xs font-semibold">
        {{ file.author || 'Unknown' }}
      </div>
      <div v-if="file.year" class="hidden text-xs @[5rem]:block @[10rem]:text-lg">
        {{ file.year }}
      </div>
    </div>
    <div v-else class="flex h-full items-end overflow-hidden rounded-md">
      <img
        :src="data || ''"
        class="block h-full w-full object-cover"
        @error="() => (forceFake = true)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { debounce as _debounce } from 'lodash';
import { convertFileSrc } from '@tauri-apps/api/core';

import type { PropType } from 'vue';
import type { IBookData } from '~/api/books';
import { locateCover } from '~/api/files';

const props = defineProps({
  file: {
    type: Object as PropType<IBookData>,
    required: true,
  },
});

const { data } = useAsyncData(
  'cover:' + props.file.cover,
  async () => {
    if (!props.file.cover) return null;
    const p = await locateCover(props.file.cover);
    if (!p) return null;

    return await convertFileSrc(p);
  },
  { watch: [() => props.file.cover] },
);

const forceFake = ref(false);

const showImage = computed(() => data.value && !forceFake.value);

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
