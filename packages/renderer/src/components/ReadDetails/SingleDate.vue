<template>
  <div class="dates">
    <template v-if="fullRange">
      <v-date-picker v-model="dates" :model-config="modelConfig" is-range class="picker">
        <template #default="{ inputValue, inputEvents }">
          <div>
            <input v-if="inputValue.start" :value="inputValue.start" v-on="inputEvents.start" />

            <input :value="inputValue.end" v-on="inputEvents.end" />
          </div>
        </template>
      </v-date-picker>
    </template>

    <template v-else>
      <v-date-picker
        v-model="dates.start"
        :model-config="modelConfig"
        class="picker"
        :max-date="dates.end"
      >
        <template #default="{ inputValue, inputEvents }">
          <input :value="inputValue" placeholder="Started Reading" v-on="inputEvents" />
        </template>
      </v-date-picker>

      <v-date-picker
        v-model="dates.end"
        :model-config="modelConfig"
        class="picker"
        :min-date="dates.start"
      >
        <template #default="{ inputValue, inputEvents }">
          <input :value="inputValue" placeholder="Finished Reading" v-on="inputEvents" />
        </template>
      </v-date-picker>
    </template>
  </div>
</template>

<script lang="ts" setup>
import { getCurrentInstance, computed, onBeforeUnmount } from 'vue';
import type { PropType } from 'vue';
import type { IDateRead } from '/@main/services/books';
import useSettings from '/@/use/settings';

const internalInstance = getCurrentInstance();

const range = {
  start: '2020-01-01',
  end: '2020-10-01',
};

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

const modelConfig = computed(() => {
  return {
    type: 'string',
    mask: props.dateFormat.toUpperCase(),
  };
});

const emit = defineEmits<{
  (e: 'update:modelValue', data: IDateRead[]): void;
}>();

const dates = computed({
  get: () => {
    return {
      start: props.modelValue.started,
      end: props.modelValue.finished,
    };
  },
  set: (val) => {
    if (internalInstance) internalInstance.emit('update:modelValue', val);
  },
});

const fullRange = computed(() => {
  return dates.value.start && dates.value.end;
});
</script>

<style scoped>
</style>
