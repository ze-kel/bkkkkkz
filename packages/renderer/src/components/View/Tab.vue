<template>
  <div class="w-full">
    <Editor v-if="opened.type === 'file'" :opened="opened"></Editor>
    <BookView v-else :opened="opened" />
  </div>
</template>

<script lang="ts" setup>
import BookView from '/@/components/BookView/BookView.vue';
import { useStore } from '/@/use/store';
import Editor from '../Editor/Editor.vue';
import type { IOpened } from '/@main/services/watcher';
import type { PropType } from 'vue';

const store = useStore();

const props = defineProps({
  opened: {
    type: Object as PropType<IOpened>,
    required: true,
  },
});
</script>
