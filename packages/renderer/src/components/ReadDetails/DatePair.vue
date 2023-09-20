<template>
  <div class="flex gap-2">
    {{ dateStart }}
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import type { PropType } from 'vue';
import type { IDateRead } from '/@main/services/books';
import VueDatePicker from '@vuepic/vue-datepicker';
import { parse } from 'date-fns';

import '@vuepic/vue-datepicker/dist/main.css';

import MiddleIcon from '@heroicons/vue/24/outline/ArrowRightIcon';
import { useStore } from '/@/use/store';
import BasicCalendar from '/@/components/_UI/BasicCalendar.vue';

const store = useStore();

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

const customPosition = () => ({ top: 0, left: 0 });

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
