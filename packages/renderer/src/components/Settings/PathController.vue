<template>
  <div class="">
    <h2 class="font-semibold mb-1">{{ title }}</h2>
    <div class="">
      <div class="currentPath mb-0.5 font-mono">{{ path ? path : 'Not Set' }}</div>
      <button class="basic-button" @click="emit('change')">
        {{ path ? 'Change' : 'Set' }}
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
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
