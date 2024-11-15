<template>
  <div class="mx-auto max-w-[600px]">
    <div class="flex flex-row items-center justify-between">
      <h1 class="font-serif text-3xl">Collections</h1>
      <ShDialog>
        <ShDialogTrigger>
          <ShButton>Add new collection</ShButton>
        </ShDialogTrigger>

        <ShDialogContent v-model:open="isCreateDialogOpen">
          <ShDialogTitle>Create new collection</ShDialogTitle>

          <div>
            <h4>Collection name (folder name)</h4>
            <BasicInput v-model="newSchemaName" size="M" class="mt-2 font-mono" />
            <template v-if="defaultSchemas && defaultSchemas.length > 0">
              <h4 class="mt-4">Template</h4>

              <ShSelect v-model:model-value="newSchemaTemplate">
                <ShSelectTrigger class="mt-2"> {{ selectedDefaultSchema?.name }}</ShSelectTrigger>
                <ShSelectContent class="max-h-[200px]">
                  <ShSelectItem
                    v-for="(s, i) in defaultSchemas"
                    size="xs"
                    variant="outline"
                    :key="s.name"
                    :value="String(i)"
                  >
                    <div>
                      {{ s.name }}
                    </div>
                    <div class="text-xs opacity-70">
                      {{ s.description }}
                    </div>
                  </ShSelectItem>
                </ShSelectContent>
              </ShSelect>
              <p class="mt-2 font-mono text-xs opacity-70"></p>
              <p></p>
            </template>
            <ShButton variant="outline" class="mt-4 w-full" @click="addNewSchema">Create</ShButton>
          </div>
        </ShDialogContent>
      </ShDialog>
    </div>
    <div v-if="hasSchemas" class="mt-6 flex flex-col gap-4">
      <ShButton
        v-for="schema in schemas?.schemas"
        :key="schema.internal_name"
        variant="outline"
        class="hove flex h-fit cursor-pointer flex-col gap-2 rounded-none border px-4 py-2"
      >
        <div class="text-lg">
          {{ schema.name }}
        </div>
        <div class="font-mono text-xs opacity-70">
          <template v-if="schema.items.length > 0" v-for="item in schema.items"
            >{{ item.name }}{{ ' ' }}
          </template>
          <template v-else>No items</template>
        </div>
      </ShButton>
    </div>
    <div v-else>
      <h2>You do not have any schemas yet</h2>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  c_get_default_schemas,
  c_load_schemas,
  c_save_schema,
  type DefaultSchema,
} from '~/api/tauriActions';
import { rustErrorNotification, type Schema } from '~/api/tauriEvents';
import BasicInput from '../_ui/BasicInput.vue';
import { useQuery, useQueryCache } from '@pinia/colada';

const qc = useQueryCache();

const { data: defaultSchemas } = useQuery({
  key: ['defaultSchemas'],
  query: c_get_default_schemas,
});

const { data: schemas } = useQuery({
  key: ['schemas'],
  query: c_load_schemas,
});

const hasSchemas = computed(() => schemas.value && Object.keys(schemas.value.schemas).length > 0);

const addNewSchema = async () => {
  if (!newSchemaName.value || !selectedDefaultSchema.value) return;
  const res = await c_save_schema(newSchemaName.value, {
    items: selectedDefaultSchema.value.schema_items,
    name: newSchemaName.value,
    internal_name: newSchemaName.value,
    internal_path: '',
    version: 'to be set by backend',
  });

  isCreateDialogOpen.value = false;

  qc.invalidateQueries({ key: ['schemas'] });
};

const isCreateDialogOpen = ref(false);
const newSchemaName = ref('');
const newSchemaTemplate = ref<string>('0');
const selectedDefaultSchema = computed(() => {
  if (!defaultSchemas.value) return null;
  return defaultSchemas.value[Number(newSchemaTemplate.value)];
});
</script>
