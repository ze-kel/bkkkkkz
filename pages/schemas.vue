<template>
  <div class="p-4">
    <SchemaEditor />
  </div>
</template>

<script lang="ts" setup>
import { selectAndSetRootPath } from '~/api/rootPath';
import type { IBookFromDb, SchemaItem } from '~/api/tauriEvents';
import SchemaEditor from '~/components/SchemaEditor/SchemaEditor.vue';

const store = useStore();

const schema = ref<SchemaItem[]>([{ name: 'title', value: 'Text', settings: {} }]);
const file = ref<IBookFromDb>({
  attrs: {},
  path: 'not saved',
  modified: '',
  markdown: '',
});

definePageMeta({
  layout: 'empty',
});
</script>
