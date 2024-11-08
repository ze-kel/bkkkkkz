<template>
  <div class="w-full rounded">
    <div class="flex flex-col gap-2">
      <div
        v-for="(date, index) in modelValue"
        :key="index"
        class="flex w-fit items-center justify-between gap-2"
      >
        <UiCalendarDateInput v-model="date.started" />
        <MoveRightIcon class="w-4" />
        <UiCalendarDateInput v-model="date.finished" />

        <ShButton variant="ghost" size="icon" @click="removeDate(index)">
          <XIcon class="w-4 opacity-50" />
        </ShButton>
      </div>
      <ShButton variant="ghost" size="xs" class="mt-2" @click="addNewDate">
        Log new reading
      </ShButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { format } from 'date-fns';
import { MoveRightIcon, XIcon } from 'lucide-vue-next';
import type { DatePair } from '~/api/tauriEvents';

const datePairs = defineModel<DatePair[]>();

const addNewDate = () => {
  if (!datePairs.value) {
    datePairs.value = [{ started: format(new Date(), 'yyyy-MM-dd') }];
    return;
  }
  datePairs.value.push({ started: format(new Date(), 'yyyy-MM-dd') });
};

const removeDate = (index: number) => {
  if (!datePairs.value) return;
  datePairs.value.splice(index, 1);
};
</script>

<style scoped>
.customGrid {
  grid-template-columns: 6rem 32px 6rem 24px;
}
</style>
