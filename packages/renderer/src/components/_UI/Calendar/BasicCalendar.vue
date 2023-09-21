<script setup lang="ts">
import {
  addMonths,
  format,
  getDaysInMonth,
  getISODay,
  isSameMonth,
  startOfMonth,
  clamp,
  isBefore,
  isAfter,
  parse,
} from 'date-fns';
import type { Interval } from 'date-fns';
import { computed, onMounted, ref, watch, nextTick } from 'vue';
import BasicButton from '/@/components/_UI/BasicButton.vue';
import { useStore } from '/@/use/store';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-vue-next';
import DaysRenderer from '/@/components/_UI/Calendar/DaysRenderer.vue';

const store = useStore();

// Input is a date string in a format that you can change in settings
// This function converts it do js Date
const stringToDate = (dateString: string) => {
  if (!store.settings) {
    throw new Error('No settings loaded');
  }
  return parse(dateString, store.settings.dateFormat, new Date());
};
const dateToString = (date: Date) => {
  if (!store.settings) {
    throw new Error('No settings loaded');
  }
  return format(date, store.settings.dateFormat);
};

const props = defineProps<{
  modelValue?: string;
  limits?: {
    start?: string;
    end?: string;
  };
}>();

const computedLimits = computed(() => {
  const res = {
    start: props.limits?.start ? stringToDate(props.limits.start) : new Date(1970, 0, 1),
    end: props.limits?.end ? stringToDate(props.limits.end) : new Date(2050, 0, 1),
  };
  return res as Interval;
});

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string): void;
}>();

const convertedModelValue = computed(() =>
  props.modelValue ? stringToDate(props.modelValue) : undefined,
);

const currentMonthString = computed(() => format(cursor.value, 'MMMM yyyy'));

// Day in a month we are currently viewin
const cursor = ref(startOfMonth(props.modelValue ? stringToDate(props.modelValue) : new Date()));

// Whetner to transiton to new month from left or right
const moveDirection = ref(0);
const moveCursorMonths = (n: number) => {
  cursor.value = clamp(addMonths(cursor.value, n), computedLimits.value);

  moveDirection.value = n < 0 ? -1 : 1;
};

const recordDate = (day: number) => {
  emits(
    'update:modelValue',
    dateToString(new Date(cursor.value.getFullYear(), cursor.value.getMonth(), day)),
  );
};

// Animation: transition between months
const previousCursor = ref();
const isAnimating = ref(false);
const animationOffTimeout = ref();

watch(cursor, (_, oldVal) => {
  previousCursor.value = oldVal;

  if (animationOffTimeout.value) {
    clearTimeout(animationOffTimeout.value);
  }

  isAnimating.value = true;

  animationOffTimeout.value = setTimeout(() => {
    isAnimating.value = false;
  }, 300);
});

const currentMonthClass = computed(() => {
  if (!isAnimating.value) return '';
  return moveDirection.value === 1 ? 'inRight' : 'inLeft';
});

const previousMonth = computed(() => {
  if (!isAnimating.value) return '';
  return moveDirection.value === 1 ? 'outLeft' : 'outRight';
});

// Animaton: height transition
const height = ref(0);
const transitionHeigth = ref(false);

const elementWithNumbersRef = ref<HTMLElement>();

const updateHeight = () => {
  if (!elementWithNumbersRef.value) return;
  const bcr = elementWithNumbersRef.value.getBoundingClientRect();
  height.value = bcr.height;
};

onMounted(() => {
  updateHeight();
  transitionHeigth.value = true;
  nextTick(() => {});
});

watch(cursor, () => {
  nextTick(() => {
    updateHeight();
  });
});
</script>

<template>
  <div class="overflow-hidden">
    <div class="flex items-center justify-between">
      <BasicButton variant="outline" size="icon" @click="moveCursorMonths(-1)">
        <ChevronLeftIcon class="w-5" />
      </BasicButton>
      {{ currentMonthString }}
      <BasicButton variant="outline" size="icon" @click="moveCursorMonths(1)">
        <ChevronRightIcon class="w-5" />
      </BasicButton>
    </div>
    <div
      class="heightTransition relative mt-2"
      :style="{ height: transitionHeigth ? height + 'px' : 'auto' }"
    >
      <div
        ref="elementWithNumbersRef"
        :key="cursor.toDateString()"
        class="grid w-fit grid-cols-7 gap-1"
        :class="currentMonthClass"
      >
        <DaysRenderer
          :cursor="cursor"
          :limits="computedLimits"
          :selected="convertedModelValue"
          @click-day="recordDate"
        />
      </div>
      <div
        v-if="isAnimating"
        :key="previousCursor.toDateString()"
        class="2 absolute left-0 top-0 grid w-fit grid-cols-7 gap-1"
        :class="previousMonth"
      >
        <DaysRenderer
          :cursor="previousCursor"
          :limits="computedLimits"
          :selected="convertedModelValue"
          @click-day="recordDate"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.heightTransition {
  transition: 0.3s height cubic-bezier(0.07, 0.56, 0.43, 0.88);
}

.inLeft,
.inRight,
.outLeft,
.outRight {
  animation-duration: 0.3s;
}

.inRight,
.inLeft {
  animation-timing-function: cubic-bezier(0.07, 0.56, 0.43, 0.88);
}

.outLeft,
.outRight {
  animation-timing-function: cubic-bezier(0.07, 0.56, 0.43, 0.88);
}

.inRight {
  animation-name: inRight;
}

.inLeft {
  animation-name: inLeft;
}
.outLeft {
  animation-name: outLeft;
}

.outRight {
  animation-name: outRight;
}

@keyframes inRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes inLeft {
  from {
    opacity: 0;
    transform: translateX(-100%);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes outLeft {
  from {
    opacity: 1;
    transform: translateX(0);
  }

  to {
    opacity: 0;
    transform: translateX(-100%);
  }
}

@keyframes outRight {
  from {
    opacity: 1;
    transform: translateX(0);
  }

  to {
    opacity: 0;
    transform: translateX(100%);
  }
}
</style>
