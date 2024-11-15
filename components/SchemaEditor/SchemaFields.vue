<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-[3fr_1fr_1fr_40px] gap-x-2 gap-y-2">
      <template v-for="item in schema" class="flex gap-2">
        <UiBasicInput v-model="item.name" placeholder="Name" class="basis-36" />

        <ShSelect v-model:model-value="item.value">
          <ShSelectTrigger class="">
            {{ item.value }}
          </ShSelectTrigger>
          <ShSelectContent>
            <ShSelectItem v-for="k in AttrValueKeys" :value="k">{{ k }}</ShSelectItem>
          </ShSelectContent>
        </ShSelect>
        <ShButton variant="outline">
          <div class="flex w-6 items-center justify-center">
            <CogIcon class="w-5" />
          </div>
        </ShButton>
        <ShButton size="icon" variant="ghost">
          <div class="flex w-6 items-center justify-center">
            <DeleteIcon class="w-5" />
          </div>
        </ShButton>
      </template>
    </div>

    <ShButton @click="addNew" variant="outline" class="mt-2 w-full">Add</ShButton>
  </div>
</template>

<script setup lang="ts">
import { AttrValueKeys, type AttrValue, type SchemaItem } from '~/api/tauriEvents';

import { XIcon as DeleteIcon, CogIcon } from 'lucide-vue-next';

const schema = defineModel<SchemaItem[]>({ required: true });

const addNew = () => {
  schema.value.push({
    name: '',
    value: 'Text',
    settings: {},
  });
};
</script>
