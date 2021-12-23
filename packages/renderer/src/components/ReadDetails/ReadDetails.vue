<template>
  <div class="editor">
    <SingleDate
      v-for="(_, index) in dates"
      :key="index"
      v-model="dates[index]"
      :date-format="dateFormat"
    />
  </div>
</template>

<script lang="ts" setup>
import { getCurrentInstance, computed, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import type { IDateRead } from '/@main/services/books';
import useSettings from '/@/use/settings';
import SingleDate from './SingleDate.vue';

const internalInstance = getCurrentInstance();

const settings = useSettings.getSettings();

const dateFormat = settings.dateFormat;

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

const dates = computed({
  get: () => props.modelValue,
  set: (val) => {
    if (internalInstance) internalInstance.emit('update:modelValue', val);
  },
});
</script>

<style lang="scss" scoped></style>
