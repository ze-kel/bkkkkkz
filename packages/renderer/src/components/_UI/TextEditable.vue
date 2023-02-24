<template>
  <div
    v-if="!isEditing"
    :class="['cursor-text transition-colors', !isValid && 'border-red-500']"
    @click="swtichToEdit"
  >
    {{ modelValue ? modelValue : placeholder }}
  </div>
  <input
    v-else
    ref="element"
    v-model="innerValue"
    spellcheck="false"
    :placeholder="placeholder"
    class=""
    @blur="tryToSumbit"
  />
</template>

<script lang="ts" setup>
import { ref, nextTick, computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: undefined,
  },
  placeholder: {
    type: String,
    default: '',
  },
  number: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: 'update:modelValue', val: string | number): void;
}>();

const element = ref<HTMLInputElement | null>(null);
const innerValue = ref(props.modelValue || '');
const isEditing = ref(false);

const swtichToEdit = () => {
  isEditing.value = true;
  nextTick(() => {
    if (!element.value) return;
    element.value.focus();
  });
};

const isValid = computed(() => {
  if (!props.number) return true;

  return !Number.isNaN(Number(innerValue.value));
});

const tryToSumbit = () => {
  isEditing.value = false;
  if (!isValid.value) return;

  if (props.number) {
    emit('update:modelValue', Number(innerValue.value) || 0);
  } else {
    emit('update:modelValue', innerValue.value || '');
  }
};
</script>
