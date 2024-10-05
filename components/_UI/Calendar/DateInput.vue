<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from '~~/utils/store';
import { format, parse } from 'date-fns';
import BasicCalendar from '~/components/_UI/Calendar/BasicCalendar.vue';
import { ChevronDown, CalendarDays } from 'lucide-vue-next';

const store = useStore();

const props = defineProps<{
  modelValue?: string;
  limits?: {
    start?: string;
    end?: string;
  };
}>();

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string): void;
}>();

const formattedDate = computed(() => {
  if (!store.settings) {
    throw new Error('No settings loaded');
  }
  if (!props.modelValue) return 'Select Date';

  const parsed = parse(props.modelValue, store.settings.dateFormat, new Date());
  return format(parsed, 'dd MMMM yyyy');
});

const isOpened = ref(false);
</script>

<template>
  <div>
    <ShPopover>
      <ShPopoverTrigger>
        <ShButton class="flex w-60 justify-between gap-6" variant="outline">
          <div class="flex items-center gap-3">
            <CalendarDays class="w-4" />
            {{ formattedDate }}
          </div>
          <ChevronDown class="w-4 opacity-50" />
        </ShButton>
      </ShPopoverTrigger>
      <ShPopoverContent>
        <BasicCalendar
          :model-value="props.modelValue"
          @update:model-value="
            (v) => {
              emits('update:modelValue', v);
              isOpened = false;
            }
          "
        >
        </BasicCalendar>
      </ShPopoverContent>
    </ShPopover>
  </div>
</template>
