<template>
  <div class="rounded w-fit overflow-hidden">
    <div class="flex items-center">
      <svg
        class="fill-indigo-600"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4H7V2H9V4H15V2H17V4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22ZM5 10V20H19V10H5ZM5 6V8H19V6H5ZM9.8 19H8V17.2L12.2 13.01L14 14.81L9.8 19ZM14.625 14.182L12.825 12.382L14.2 11.013L16 12.813L14.63 14.183L14.625 14.182Z"
        />
      </svg>
      <div class="ml-2 text-indigo-600 font-semibold">Read dates</div>
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
      class="p-0.5 border cursor-pointer text-indigo-600 border-indigo-600 hover:bg-indigo-600 hover:text-white rounded-md text-center mt-3 transition-colors"
      @click="addNewDate"
    >
      Log new
    </div>
  </div>
</template>

<script lang="ts" setup>
import { getCurrentInstance, computed, onBeforeUnmount } from 'vue';
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

const modelConfig = {
  type: 'string',
  mask: 'YYYY-MM-DD',
};

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
  console.log('rem');
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
