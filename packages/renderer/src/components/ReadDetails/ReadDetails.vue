<template>
  <div class="w-full rounded">
    <div class="flex flex-col gap-2">
      <template v-for="(date, index) in modelValue" :key="index">
        <DatePair
          v-if="store.settings"
          :model-value="date"
          :date-format="store.settings.dateFormat"
          @update:model-value="(val) => updateValue(index, val)"
        />
        <div v-test-class="'T-editor-date-remove'" @click="removeDate(index)">
          <CrossIcon
            class="h-4 w-4 cursor-pointer stroke-neutral-200 transition-colors dark:stroke-neutral-600 dark:hover:stroke-neutral-300"
          />
        </div>
      </template>
    </div>
    <div
      v-test-class="'T-editor-date-add'"
      class="w-fit cursor-pointer text-sm font-light transition-colors dark:text-neutral-600 dark:hover:text-neutral-200"
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
import CrossIcon from '@heroicons/vue/24/outline/XMarkIcon';
import { useStore } from '/@/use/store';

const store = useStore();

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
  if (!store.settings) {
    throw new Error('TRYING TO OPEN READ DETAILS BEFORE SETTINGS ARE PRESENT');
  }
  const newValue = [
    ...props.modelValue,
    { started: format(new Date(), store.settings.dateFormat) },
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
