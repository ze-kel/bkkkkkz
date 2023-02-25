<template>
  <div class="rounded w-full overflow-hidden">
    <div class="grid customGrid gap-y-1 gap-x-2">
      <template v-for="(date, index) in modelValue" :key="index">
        <DatePair
          v-if="settings"
          :model-value="date"
          :date-format="settings.dateFormat"
          @update:model-value="(val) => updateValue(index, val)"
        />
        <div v-test-class="'T-editor-date-remove'" @click="removeDate(index)">
          <svg
            class="fill-neutral-200 dark:fill-neutral-600 dark:hover:fill-neutral-300 transition-colors cursor-pointer"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M15.59 7L12 10.59L8.41 7L7 8.41L10.59 12L7 15.59L8.41 17L12 13.41L15.59 17L17 15.59L13.41 12L17 8.41L15.59 7Z"
            />
          </svg>
        </div>
      </template>
    </div>
    <div
      v-test-class="'T-editor-date-add'"
      class="dark:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer transition-colors w-fit text-sm font-light"
      @click="addNewDate"
    >
      Log new read date
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import type { IDateRead } from '/@main/services/books';
import DatePair from './DatePair.vue';
import { format } from 'date-fns';
import { useSettings } from '/@/use/settings';

const { settings } = useSettings();

const props = defineProps({
  modelValue: {
    type: Array as PropType<IDateRead[]>,
    required: false,
    default: () => [],
  },
});

const emit = defineEmits<{
  (e: 'update:modelValue', data: IDateRead[]): void;
}>();

const updateValue = (index: number, newDates: IDateRead) => {
  const newValue = [...props.modelValue];
  newValue[index] = newDates;
  emit('update:modelValue', newValue);
};

const addNewDate = () => {
  if (!settings.value) {
    throw new Error('TRYING TO OPEN READ DETAILS BEFORE SETTINGS ARE PRESENT');
  }
  const newValue = [
    ...props.modelValue,
    { started: format(new Date(), settings.value.dateFormat) },
  ];
  emit('update:modelValue', newValue);
};

const removeDate = (index: number) => {
  const newValue = [...props.modelValue];
  newValue.splice(index, 1);
  emit('update:modelValue', newValue);
};
</script>

<style scoped>
.customGrid {
  grid-template-columns: 6rem 32px 6rem 24px;
}
</style>
