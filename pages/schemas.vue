<template>
  <div class="grid w-full grid-cols-2 gap-4 p-10">
    <div class="col-span-2 font-serif text-3xl">Working directory & schema</div>
    <div>
      <SchemaEditor v-model="schema" />
    </div>

    {{ file }}

    <div>
      <EditorMetaEditor :schema="schema" v-model="file" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { selectAndSetRootPath } from '~/api/rootPath';
import type { IBookFromDb, SchemaItem } from '~/api/tauriEvents';

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

const changeRootPathHandler = async () => {
  const updated = await selectAndSetRootPath();
  if (updated) {
    store.fetchRootPath();
  }
};
</script>
