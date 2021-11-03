<template>
  <div class="root">
    <div>{{ currentFile.path }}</div>
    <textarea v-model="currentFileContent" class="textarea"></textarea>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { PropType } from 'vue';
import type { IFile, IFolder } from '/@main/services/files';
import _debounce from 'lodash-es/debounce';
import fileRouter from '/@/use/filesRouter';

const props = defineProps({
  currentFile: {
    type: Object as PropType<IFile>,
    required: true,
  },
});

const currentFileContent = ref<string>('');
const skipNextSave = ref<boolean>(true);

onMounted(async () => {
  const initialContent = await fileRouter.watchFile(props.currentFile.path, (c: string) => {
    currentFileContent.value = c;
  });

  currentFileContent.value = initialContent;
});

const save = () => {
  if (!currentFileContent.value) return;
  fileRouter.save(props.currentFile.path, currentFileContent.value);
  skipNextSave.value = true;
};

const debouncedSave = _debounce(save, 1000);

watch(currentFileContent, () => {
  if (skipNextSave.value) {
    skipNextSave.value = false;
    return;
  }
  debouncedSave();
});
</script>

<style scoped>
.textarea {
  min-height: 250px;
}
</style>
