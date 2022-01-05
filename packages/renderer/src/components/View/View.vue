<template>
  <div v-if="store.opened" class="w-full">
    <Tab :opened="store.opened"></Tab>
  </div>
</template>

<script lang="ts" setup>
import { useStore } from '/@/use/store';
import Tab from './Tab.vue';

const store = useStore();
</script>
