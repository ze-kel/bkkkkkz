<template>
    <DateInput v-model="dateStart" />
    <MoveRight class="w-4" />
    <DateInput v-model="dateEnd" />
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import type { PropType } from 'vue';
import type { IDateRead } from '/@main/services/books';
import VueDatePicker from '@vuepic/vue-datepicker';
import { parse } from 'date-fns';

import '@vuepic/vue-datepicker/dist/main.css';
import { MoveRight } from 'lucide-vue-next';

import { useStore } from '/@/use/store';
import DateInput from '/@/components/_UI/Calendar/DateInput.vue';

const props = defineProps({
  modelValue: {
    type: Object as PropType<IDateRead>,
    required: true,
  },
  dateFormat: {
    type: String,
    required: true,
  },
});

const emit = defineEmits<{
  (e: 'update:modelValue', data: IDateRead): void;
}>();

const dateStart = computed({
  get: () => props.modelValue.started,
  set: (val) => {
    emit('update:modelValue', { ...props.modelValue, started: val });
  },
});

const dateEnd = computed({
  get: () => props.modelValue.finished,
  set: (val) => {
    emit('update:modelValue', { ...props.modelValue, finished: val });
  },
});
</script>

<style></style>
