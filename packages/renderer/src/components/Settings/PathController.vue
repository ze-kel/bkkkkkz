<template>
  <div class="">
    <h2 class="mb-1 font-semibold">{{ title }}</h2>
    <div class="">
      <div class="currentPath mb-0.5 font-mono">{{ path ? path : 'Not Set' }}</div>
      <BasicButton
        v-test-class="testClasses.settingsChangeRootPath"
        class="mt-1"
        variant="outline"
        @click="emit('change')"
      >
        {{ path ? 'Change' : 'Set' }}
      </BasicButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import BasicButton from '/@/components/_UI/BasicButton/BasicButton.vue';
import { testClasses } from '/@/utils/testClassBinds';

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
});

const emit = defineEmits<{
  (e: 'change'): void;
}>();
</script>

<style scoped></style>
