<template>
  <div
    class="grid h-9 cursor-pointer grid-cols-5 items-center gap-5 rounded-sm px-3 transition-colors hover:bg-neutral-100 hover:dark:bg-neutral-900"
  >
    <template v-if="isVisible">
      <div class="truncate">
        {{ onlyMainTitle }}
      </div>
      <div class="truncate">
        {{ currentFile.author }}
      </div>
      <div class="truncate">
        {{ currentFile.year }}
      </div>
      <div class="truncate">
        {{ stringifiedDates }}
      </div>
      <div>
        <RatingStars :model-value="currentFile.myRating" disabled />
      </div>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { computed, type PropType } from 'vue';
import type { IFile } from '~/api/files';
import { useStore } from '~~/utils/store';
import { dateReducerAllYears } from './getDateReducer';
import RatingStars from '~/components/Rating/RatingStars.vue';
const props = defineProps({
  currentFile: {
    type: Object as PropType<IFile>,
    required: true,
  },
  isVisible: {
    type: Boolean,
    default: true,
  },
});

const store = useStore();

const onlyMainTitle = computed(() => props.currentFile.title?.split(':')[0]);

const stringifiedDates = computed(() => {
  if (!props.currentFile.read) return '';

  if (!store.settings) return '';

  return props.currentFile.read
    .reduce(dateReducerAllYears(store.settings.dateFormat), [])
    .join(', ');
});
</script>
