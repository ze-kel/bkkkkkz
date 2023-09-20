<script setup lang="ts">
import {
  addMonths,
  format,
  getDaysInMonth,
  getISODay,
  isSameMonth,
  startOfMonth,
  clamp,
  isBefore,
  isAfter,
} from 'date-fns';
import type { Interval } from 'date-fns';
import { computed, ref } from 'vue';
import BasicButton from '/@/components/_UI/BasicButton.vue';

const props = defineProps<{
  modelValue?: Date;
  limits?: {
    start?: Date | undefined;
    end?: Date | undefined;
  };
}>();

const computedLimits = computed(() => {
  const res = props.limits || {};

  if (res.start) {
    res.start = new Date(1970, 0, 1);
  }
  if (!res.end) {
    res.end = new Date(2050, 0, 1);
  }
  return res as Interval;
});

const emits = defineEmits<{
  (e: 'update:modelValue', payload: Date | undefined): void;
}>();

const cursor = ref(startOfMonth(props.modelValue || new Date()));

const toRender = computed(() => getDaysInMonth(cursor.value));

const getDates = (n: number) => {
  return;
};

const dates = computed(() => {
  return Array(toRender.value)
    .fill(0)
    .map((_, i) => i + 1);
});

const firstDayDate = computed(
  () => new Date(cursor.value.getFullYear(), cursor.value.getMonth(), 1),
);

const prefaceWith = computed(() => getISODay(firstDayDate.value) - 1);
const prepend = computed(() => Array(prefaceWith.value).fill(0));

const moveDirection = ref(0);

const moveCursorMonths = (n: number) => {
  cursor.value = clamp(addMonths(cursor.value, n), computedLimits.value);

  moveDirection.value = n < 0 ? -1 : 1;
};

const inLimit = (day: number) => {
  const date = new Date(cursor.value.getFullYear(), cursor.value.getMonth(), day);
  if (isBefore(date, computedLimits.value.start) || isAfter(date, computedLimits.value.end))
    return false;
  return true;
};

const recordDate = (day: number) => {
  if (!inLimit(day)) return;
  emits('update:modelValue', new Date(cursor.value.getFullYear(), cursor.value.getMonth(), day));
};

const higlightSelected = computed(() =>
  props.modelValue && isSameMonth(props.modelValue, cursor.value) ? props.modelValue.getDate() : -1,
);
</script>

<template>
  <div class="grid w-fit grid-cols-7 gap-1">
    <div v-for="(_, i) in prepend" :key="i"></div>

    <BasicButton v-for="day in prepend" :key="day"> {{ day }}</BasicButton>
  </div>
</template>
