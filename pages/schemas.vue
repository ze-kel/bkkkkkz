<template>
  <div class="flex h-full w-full flex-col items-center">
    <div class="py-20">
      <div class="font-serif text-3xl">Working directory & schema</div>

      <PathController
        v-if="store.rootPath"
        title="Working Directory"
        class="mt-4"
        :path="store.rootPath"
        @change="changeRootPathHandler"
      />

      <div class="mt-4">
        <SchemaEditor />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { selectAndSetRootPath } from '~/api/rootPath';
import PathController from '~/components/Settings/PathController.vue';

const store = useStore();

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
