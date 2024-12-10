<template>
  <div class="p-4">
    <SchemaEditor />
  </div>
</template>

<script lang="ts" setup>
import type { BookFromDb, SchemaItem, TextSettings } from '~/types';

const store = useStore();

const schema = ref<SchemaItem[]>([
  {
    name: 'title',
    value: {
      type: 'Text',
      settings: {
        size: 'L',
      } as TextSettings,
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
