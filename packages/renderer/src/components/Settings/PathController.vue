<template>
  <div class="pathController">
    <h2 class="title">{{ title }}</h2>
    <div class="container">
      <div v-if="path" class="currentPath">{{ path }}</div>
      <Button :text="path ? 'Change' : 'Set'" class="button" @click="emit('change')" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import Button from '/@/components/_UI/Button.vue';

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

<style lang="scss" scoped>
.title {
  font-weight: 400;
  margin-bottom: 8px;
}

.container {
  display: flex;
  align-items: center;
  .button:not(:first-child) {
    margin-left: 8px;
  }
}
</style>
