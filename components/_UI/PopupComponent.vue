<template>
  <div
    v-if="opened"
    class="absolute left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-neutral-800 bg-opacity-75"
    @mousedown.self="close"
  >
    <div
      class="popup relative flex items-center justify-center rounded-lg bg-neutral-50 p-8 shadow-md dark:bg-neutral-900"
      @click.stop=""
    >
      <BasicButton
        v-test-class="testClasses.modalClose"
        variant="ghost"
        size="icon"
        class="absolute right-2 top-2"
        @click="close"
      >
        <XIcon class="opacity-80" />
      </BasicButton>
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
import BasicButton from '~/components/_UI/BasicButton/BasicButton.vue';
import { XIcon } from 'lucide-vue-next';
import { testClasses } from '~/plugins/testClass/binds';

const props = defineProps({
  opened: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const close = () => {
  emit('close');
};
</script>

<style scoped>
.popup {
  min-width: 450px;
  min-height: 200px;
  box-sizing: border-box;
}
</style>
