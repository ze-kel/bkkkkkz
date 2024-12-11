<template>
  <div v-if="store.currentViewSettings" class="flex items-center justify-between gap-2 py-2">
    <div class="flex w-full">
      <UIBasicInput
        v-model="store.currentViewSettings.searchQuery"
        size="M"
        placeholder="Search Books"
        class="mx-auto max-w-96 text-center"
      />
    </div>

    <div class="flex w-fit gap-3"></div>
  </div>
</template>

<script lang="ts" setup>
import { useStore } from '~~/utils/store';
import { GroupIcon, UngroupIcon, ArrowDownAZIcon, ArrowDownZAIcon } from 'lucide-vue-next';

import type { ISortByOption } from '~/api/openedTabs';

const store = useStore();
</script>
