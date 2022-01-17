<template>
  <div class="rounded w-full overflow-hidden">
    <div class="flex items-center">
      <div class="text-gray-800 text-lg font-semibold">Read dates</div>
    </div>
    <div class="grid customGrid gap-y-1 gap-x-2 my-1">
      <template v-for="(date, index) in modelValue" :key="index">
        <div class="text-center text-gray-500">{{ index + 1 }}</div>
        <SingleDate
          v-if="store.settings"
          :model-value="date"
          :date-format="store.settings.dateFormat"
          @update:model-value="(val) => updateValue(index, val)"
        />
        <div @click="removeDate(index)">
          <svg
            class="fill-gray-200 hover:fill-gray-700 cursor-pointer"
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
      class="p-0.5 border cursor-pointer text-gray-800 border-gray-800 hover:bg-gray-800 hover:text-white rounded-md text-center mt-3 transition-colors"
      @click="addNewDate"
    >
      Log new
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getCurrentInstance } from 'vue';
import type { PropType } from 'vue';
import type { IDateRead } from '/@main/services/books';
import SingleDate from './SingleDate.vue';
import { format } from 'date-fns';
import { useStore } from '/@/use/store';

const internalInstance = getCurrentInstance();

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
  internalInstance?.emit('update:modelValue', newValue);
};

const addNewDate = () => {
  if (!store.settings) {
    throw 'TRYING TO OPEN READ DETAILS BEFORE SETTINGS ARE PRESENT';
  }
  const newValue = [
    ...props.modelValue,
    { started: format(new Date(), store.settings.dateFormat) },
  ];
  internalInstance?.emit('update:modelValue', newValue);
};

const removeDate = (index: number) => {
  const newValue = [...props.modelValue];
  newValue.splice(index, 1);
  internalInstance?.emit('update:modelValue', newValue);
};
</script>

<style scoped>
.customGrid {
  grid-template-columns: 1.5rem 6rem 32px 6rem 24px;
}
</style>
