<template>
  <FileTreeInner v-if="store.fileTree" :content="store.fileTree" />
</template>

<script lang="ts" setup>
import { useStore } from '/@/use/store';
import FileTreeInner from './FileTreeInner.vue';

const store = useStore();
</script>
