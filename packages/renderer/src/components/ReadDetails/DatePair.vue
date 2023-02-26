<template>
  <div class="flex gap-2">
    <VueDatePicker
      v-model="dateStart"
      :max-date="dateEnd"
      :model-type="dateFormat"
      :auto-apply="true"
      :dark="isDarkMode"
      position="left"
      :hide-input-icon="true"
      :enable-time-picker="false"
    />
    <MiddleIcon class="w-6 stroke-neutral-400 dark:stroke-neutral-600" />
    <VueDatePicker
      v-model="dateEnd"
      :min-date="dateStart"
      :model-type="dateFormat"
      :dark="isDarkMode"
      :auto-apply="true"
      position="left"
      :hide-input-icon="true"
      :enable-time-picker="false"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

import type { PropType } from 'vue';
import type { IDateRead } from '/@main/services/books';
import { useSettings } from '/@/use/settings';
import VueDatePicker from '@vuepic/vue-datepicker';
import { parse } from 'date-fns';

import '@vuepic/vue-datepicker/dist/main.css';

import MiddleIcon from '@heroicons/vue/24/outline/ArrowRightIcon';

const { settings } = useSettings();

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

const isDarkMode = computed(() => {
  if (!settings.value || settings.value.darkMode === -1) return false;
  if (settings.value.darkMode === 0) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? true : false;
  }
  return true;
});

const popoverConfig = {
  visibility: 'focus',
};
</script>

<style>
/*
50
#fafafa
100
#f5f5f5
200
#e5e5e5
300
#d4d4d4
400
#a3a3a3
500
#737373
600
#525252
700
#404040
800
#262626
900
#171717
*/

.dp__theme_dark {
  --dp-background-color: #171717;
  --dp-text-color: #a3a3a3;

  --dp-hover-color: #404040;
  --dp-hover-text-color: #ffffff;

  --dp-hover-icon-color: #959595;

  --dp-primary-color: #737373;
  --dp-primary-text-color: #ffffff;

  --dp-secondary-color: #a9a9a9;
  --dp-border-color: #2d2d2d;
  
  --dp-menu-border-color: #2d2d2d;
  --dp-border-color-hover: #aaaeb7;
  --dp-disabled-color: #737373;
  --dp-scroll-bar-background: #212121;
  --dp-scroll-bar-color: #484848;
  --dp-icon-color: #959595;

  --dp-success-color: #00701a;
  --dp-success-color-disabled: #428f59;
  --dp-danger-color: #e53935;
  --dp-highlight-color: #737373;
}

.dp__theme_light {
  --dp-background-color: #ffffff;
  --dp-text-color: #212121;
  --dp-hover-color: #f3f3f3;
  --dp-hover-text-color: #212121;
  --dp-hover-icon-color: #959595;
  --dp-primary-color: #1976d2;
  --dp-primary-text-color: #f8f5f5;
  --dp-secondary-color: #c0c4cc;
  --dp-border-color: #ddd;
  --dp-menu-border-color: #ddd;
  --dp-border-color-hover: #aaaeb7;
  --dp-disabled-color: #f6f6f6;
  --dp-scroll-bar-background: #f3f3f3;
  --dp-scroll-bar-color: #959595;
  --dp-success-color: #76d275;
  --dp-success-color-disabled: #a3d9b1;
  --dp-icon-color: #959595;
  --dp-danger-color: #ff6f60;
  --dp-highlight-color: rgba(25, 118, 210, 0.1);
}
</style>
