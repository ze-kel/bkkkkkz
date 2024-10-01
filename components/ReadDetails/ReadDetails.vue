<template>
  <div class="w-fit rounded">
    <div class="flex flex-col gap-2">
      <div
        v-for="(date, index) in modelValue"
        :key="index"
        class="flex items-center justify-between gap-2"
      >
        <DatePair
          v-if="store.settings"
          :model-value="date"
          :date-format="store.settings.dateFormat"
          @update:model-value="(val) => updateValue(index, val)"
        />
        <BasicButton
          v-test-class="testClasses.editorDateRemove"
          variant="ghost"
          size="icon"
          @click="removeDate(index)"
        >
          <XIcon class="w-4 opacity-50" />
        </BasicButton>
      </div>
      <BasicButton
        v-test-class="testClasses.editorDateAdd"
        variant="ghost"
        size="sm"
        class="mt-2"
        @click="addNewDate"
      >
        Log new reading
      </BasicButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { PropType } from 'vue';
import DatePair from './DatePair.vue';
import { format } from 'date-fns';
import { XIcon } from 'lucide-vue-next';
import { useStore } from '~~/utils/store';
import BasicButton from '~/components/_UI/BasicButton/BasicButton.vue';
import { testClasses } from '~/tools/tests/binds';
import type { IDateRead } from '~/api/books';

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
