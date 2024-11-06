<template>
  <div class="flex flex-col gap-2">
    <div v-for="item in schema" class="flex gap-2">
      <BasicInput v-model="item.Name" placeholder="Name" />
      <ShSelect v-model:model-value="item.Value">
        <ShSelectTrigger class="">
          {{ item.Value }}
        </ShSelectTrigger>
        <ShSelectContent>
          <ShSelectItem v-for="k in keys" :value="k">{{ k }}</ShSelectItem>
        </ShSelectContent>
      </ShSelect>
      <ShButton size="icon" variant="ghost">
        <DeleteIcon class="w-4" />
      </ShButton>
    </div>
    <ShButton @click="addNew" variant="outline" class="mt-2 w-full">Add</ShButton>
  </div>
</template>

<script setup lang="ts">
import type { AttrValue, SchemaItem } from '~/api/tauriEvents';
import BasicInput from '../_UI/BasicInput.vue';
import { XIcon as DeleteIcon } from 'lucide-vue-next';

const schema = ref<SchemaItem[]>([]);

const keys: (keyof AttrValue)[] = ['Text', 'TextCollection', 'Number', 'DatesPairCollection'];

const addNew = () => {
  schema.value.push({
    Name: '',
    Value: 'Text',
  });
};
</script>
