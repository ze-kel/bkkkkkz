<template>
  <div class="root">
    <Card v-for="item in openedFiles" :key="item.path" :current-file="item" class="card" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, watchEffect } from 'vue';
import type { PropType } from 'vue';
import Card from './Card.vue';
import { useElectron } from '/@/use/electron';
import type { IFile, IFolder } from '/@main/services/files';
import _debounce from 'lodash-es/debounce';

const api = useElectron();

const props = defineProps({
  openedFiles: {
    type: Array as PropType<IFile[]>,
    required: true,
  },
});

</script>

<style scoped>
.root {
  display: flex;
  flex-direction: column;
  height: fit-content;
  padding: 20px 0;
}

.card {
  width: 100%;
}
</style>
