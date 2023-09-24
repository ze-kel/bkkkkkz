<template>
  <DateInput v-model="dateStart" v-test-class="testClasses.editorDateFrom" />
  <MoveRight class="w-4" />
  <DateInput v-model="dateEnd" v-test-class="testClasses.editorDateTo" />
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import type { PropType } from 'vue';
import type { IDateRead } from '/@main/services/books';
import { MoveRight } from 'lucide-vue-next';
import { testClasses } from '/@/utils/testClassBinds';

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
