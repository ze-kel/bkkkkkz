<template>
  <template v-if="!attr"> Error: {{ schemaItem.name }} has no value </template>
  <template v-else-if="schemaItem.value.type !== attr.type">
    Error: {{ schemaItem.name }} schema type {{ schemaItem.value.type }} does not match book item
    type type
    {{ attr.type }}
  </template>

  <template v-else>
    <UiBasicInput
      v-if="schemaItem.value.type === 'Text' && attr.type === 'Text'"
      v-model:model-value="attr.value"
      :placeholder="schemaItem.value.settings.displayName || schemaItem.name"
      :theme="schemaItem.value.settings.theme"
      :multi-line="schemaItem.value.settings.isMultiline"
      :size="schemaItem.value.settings.size"
      :font="schemaItem.value.settings.font"
      :weight="schemaItem.value.settings.weight"
    />

    <UIBasicInput
      v-else-if="schemaItem.value.type === 'Number' && attr.type === 'Number'"
      :placeholder="schemaItem.value.settings.displayName || schemaItem.name"
      is-number
      v-model:value-number="attr.value"
    />

    <EditorTagsEditor
      v-else-if="schemaItem.value.type === 'TextCollection' && attr.type === 'TextCollection'"
      v-model:model-value="attr.value"
    />

    <EditorReadDetails
      v-else-if="
        schemaItem.value.type === 'DatesPairCollection' && attr.type === 'DatesPairCollection'
      "
      v-model:model-value="attr.value"
    />
  </template>
</template>

<script setup lang="ts">
import type { AttrValue, SchemaItem } from '~/types';

const attr = defineModel<AttrValue>();

const props = defineProps<{
  schemaItem: SchemaItem;
}>();
</script>
