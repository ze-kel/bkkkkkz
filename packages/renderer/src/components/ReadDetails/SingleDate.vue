<template>
  <div class="w-full">
    <v-date-picker
      v-model="dateStart"
      :model-config="modelConfig"
      :max-date="dates.end"
      :popover="{ visibility: 'focus' }"
    >
      <template #default="{ inputValue, inputEvents }">
        <input
          :value="inputValue"
          class="w-full input-default"
          placeholder="Started"
          v-on="inputEvents"
        />
      </template>
    </v-date-picker>
  </div>

  <div>
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="fill-gray-800"
    >
      <path d="M18.17 13L15.59 15.59L17 17L22 12L17 7L15.59 8.41L18.17 11H2V13H18.17Z" />
    </svg>
  </div>

  <div class="w-full">
    <v-date-picker
      v-model="dateEnd"
      :model-config="modelConfig"
      :min-date="dates.start"
      :popover="{ visibility: 'focus' }"
    >
      <template #default="{ inputValue, inputEvents }">
        <input
          :value="inputValue"
          placeholder="Finished"
          class="w-full input-default"
          v-on="inputEvents"
        />
      </template>
    </v-date-picker>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { PropType } from 'vue';
import type { IDateRead } from '/@main/services/books';

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

const modelConfig = computed(() => {
  return {
    type: 'string',
    mask: props.dateFormat.toUpperCase(),
  };
});

const emit = defineEmits<{
  (e: 'update:modelValue', data: IDateRead): void;
}>();

const dates = computed({
  get: () => {
    return {
      start: props.modelValue.started,
      end: props.modelValue.finished,
    };
  },
  set: (val) => {
    emit('update:modelValue', {
      started: val.start,
      finished: val.end,
    });
  },
});

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

<style scoped></style>
