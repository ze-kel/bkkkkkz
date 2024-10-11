<template>
  <div class="flex h-full w-full items-center justify-center">
    <div class="text-lg">Initializing</div>

    <div>DbSetup: {{ dbSetup }}</div>
    <div>DbSetup: {{ cacheSetup }}</div>
    <div>DbSetup: {{ watcherSetup }}</div>

    <div>
      <ShButton> Retry </ShButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStore } from '~~/utils/store';
import { invoke } from '@tauri-apps/api/core';

const store = useStore();

const dbSetup = ref(false);
const cacheSetup = ref(false);
const watcherSetup = ref(false);

const initLoop = () => {

  invoke('')

};

definePageMeta({
  layout: 'empty',
});
</script>
