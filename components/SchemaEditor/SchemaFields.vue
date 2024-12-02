<template>
  <div v-if="schema" class="flex flex-col gap-4">
    <div class="flex items-center gap-4">
      <ShButton variant="ghost" size="icon" @click="goBack">
        <ArrowLeftIcon class="w-4" />
      </ShButton>
      <h1 class="font-serif text-3xl">{{ schema.name }}</h1>

      <ShButton variant="outline" @click="save">Save</ShButton>
    </div>

    <div>
      Icon from Lucide

      <p>CamelCase style: StarHalf, BookAudio, etc.</p>

      <div class="flex">
        <UiBasicInput size="M" v-model="schema.icon" />
      </div>

      {{ schema.icon }}
      <component :is="icons[schema.icon]" />
    </div>

    <div>
      <div class="grid max-w-[600px] grid-cols-[40px_3fr_1fr_40px] gap-x-2 gap-y-2">
        <template v-for="(_, i) in schema.items" class="flex gap-2">
          <SchemaEditorShemaItem v-model:model-value="schema.items[i]" @delete="deleteItem(i)" />
        </template>
        <ShButton @click="addNew" variant="outline" class="col-span-4 mt-2 w-full">Add</ShButton>
      </div>
      <div></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { isOurError, rustErrorNotification, type ErrorFromRust } from '~/api/tauriEvents';

import { ArrowLeftIcon } from 'lucide-vue-next';
import { c_load_schema, c_save_schema } from '~/api/tauriActions';
import type { Schema } from '~/api/schema';

import * as icons from 'lucide-vue-next';

const props = defineProps<{
  path: string;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
}>();

const goBack = () => {
  emit('back');
};

const save = async () => {
  if (!schema.value) return;
  const r = await c_save_schema(schema.value.internal_name, schema.value);
  if ('isError' in r) {
    rustErrorNotification(r);
    return;
  }
  goBack();
};

const schema = ref<Schema | null>(null);

onMounted(async () => {
  try {
    const res = await c_load_schema(props.path);
    schema.value = res;
  } catch (e) {
    if (isOurError(e)) {
      rustErrorNotification(e as ErrorFromRust);
    }
    emit('back');
  }
});

const addNew = () => {
  if (!schema.value) return;
  schema.value.items.push({
    name: '',
    value: { type: 'Text', settings: {} },
  });
};
const deleteItem = (index: number) => {
  if (!schema.value) return;
  schema.value.items.splice(index, 1);
};
</script>
