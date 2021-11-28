<template>
  <div class="smallInput">
    <div class="text-S text">{{ text }}</div>
    <hr class="hr" />
    <div type="number" class="input header-S">{{ displayed }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue';

const internalInstance = getCurrentInstance();

const props = defineProps({
  value: {
    type: Number,
    default: null,
  },
  text: {
    type: String,
    required: true,
  },
  placeholder: {
    type: String,
    default: '—',
  },
});

const displayed = computed(() =>
  props.value && props.value > 0 ? props.value : props.placeholder,
);
</script>

<style lang="scss" scoped>
.smallInput {
  width: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;

  .text {
    color: var(--text-secondary);
  }

  .input {
    text-align: center;
    -webkit-appearance: none;
    width: 100%;
    color: var(--text-main);
    font-weight: 500;
  }
}

.hr {
  width: 66%;
  height: 1px;
  background: var(--accent-main-grad);
  margin: 5px 0;
}
</style>
