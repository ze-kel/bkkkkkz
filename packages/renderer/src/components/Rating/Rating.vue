<template>
  <div
    class="flex fill-neutral-800 dark:fill-neutral-100"
    :class="!disabled && 'cursor-pointer'"
    @mouseleave="clearHovered"
    @click="setRating"
  >
    <div v-for="index in 5" :key="index" class="relative">
      <div class="h-full w-[50%] absolute" @mouseenter="setHovered(index - 0.5)"></div>
      <div class="h-full w-[50%] left-[50%] absolute" @mouseenter="setHovered(index)"></div>
      <template v-if="index <= Number(displayedValue.value)">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path
            d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.828 1.48 8.279-7.416-3.967-7.417 3.967 1.481-8.279-6.064-5.828 8.332-1.151z"
          />
        </svg>
      </template>
      <template v-else-if="index - 0.5 === Number(displayedValue.value)">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path
            d="M12 5.173l2.335 4.817 5.305.732-3.861 3.71.942 5.27-4.721-2.524v-12.005zm0-4.586l-3.668 7.568-8.332 1.151 6.064 5.828-1.48 8.279 7.416-3.967 7.416 3.966-1.48-8.279 6.064-5.827-8.332-1.15-3.668-7.569z"
          />
        </svg>
      </template>
      <template v-else>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
          <path
            d="M12 5.173l2.335 4.817 5.305.732-3.861 3.71.942 5.27-4.721-2.524-4.721 2.525.942-5.27-3.861-3.71 5.305-.733 2.335-4.817zm0-4.586l-3.668 7.568-8.332 1.151 6.064 5.828-1.48 8.279 7.416-3.967 7.416 3.966-1.48-8.279 6.064-5.827-8.332-1.15-3.668-7.569z"
          />
        </svg>
      </template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';

const props = defineProps({
  modelValue: {
    type: Number,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{
  (e: 'update:modelValue', data: number): void;
}>();

const rating = computed({
  get: () => props.modelValue,
  set: (val) => {
    emit('update:modelValue', val);
  },
});

const hoveredRating = ref(-1);

const clearHovered = () => {
  if (props.disabled) return;
  hoveredRating.value = -1;
};

const setHovered = (val: number) => {
  if (props.disabled) return;
  hoveredRating.value = val;
};

const displayedValue = computed(() => (hoveredRating.value < 0 ? rating : hoveredRating));

const setRating = () => {
  if (props.disabled) return;
  if (hoveredRating.value >= 0) {
    rating.value = hoveredRating.value;
  }
};
</script>

<style scoped></style>
