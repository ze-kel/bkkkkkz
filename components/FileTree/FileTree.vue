<template>
  <FileTreeInner v-for="folder in transformed" :content="folder" :root-name="props.schemaName" />
</template>

<script lang="ts" setup>
import FileTreeInner from './FileTreeInner.vue';
import { useStore } from '~~/utils/store';
import { filePathsToTree } from './filePathsToTree';
import { useListenToEvent } from '~/api/tauriEvents';
import { throttle } from 'lodash';
import { c_get_all_folders } from '~/api/tauriActions';

const props = defineProps<{
  schemaPath: string;
  schemaName: string;
}>();

const { data, refetch, status } = useQuery({
  key: () => ['folders', props.schemaPath],
  query: async () => await c_get_all_folders(props.schemaPath),
});

const transformed = computed(() =>
  !data.value || 'isError' in data.value ? [] : filePathsToTree(data.value, props.schemaPath || ''),
);

const throttledRefresh = throttle(refetch, 1000, {
  leading: true,
});

useListenToEvent('folder_add', (v) => {
  if (v.schema_path === props.schemaPath) {
    throttledRefresh();
  }
});
useListenToEvent('folder_remove', (v) => {
  if (v.schema_path === props.schemaPath) {
    throttledRefresh();
  }
});
</script>
