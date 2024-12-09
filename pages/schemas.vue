<template>
  <div class="p-4">
    <SchemaEditor />
  </div>
</template>

<script lang="ts" setup>
import { selectAndSetRootPath } from '~/api/rootPath';
import SchemaEditor from '~/components/SchemaEditor/SchemaEditor.vue';
import type { BookFromDb, SchemaItem } from '~/types';

const store = useStore();

const schema = ref<SchemaItem[]>([
  {
    name: 'title',
    value: {
      type: 'Text',
      settings: {
        size: 'L',
      },
    },
  },
]);
const file = ref<BookFromDb>({
  attrs: {},
  path: 'not saved',
  modified: '',
  markdown: '',
});

definePageMeta({
  layout: 'empty',
});
</script>
