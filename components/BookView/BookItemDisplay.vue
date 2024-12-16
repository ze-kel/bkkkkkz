<template>
  {{ displayValue }}
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { BookFromDb, SchemaItem } from '~/types';

const props = defineProps({
  schemaItem: {
    type: Object as PropType<SchemaItem>,
    required: true,
  },
  book: {
    type: Object as PropType<BookFromDb>,
    required: true,
  },
});

const displayValue = computed(() => {
  const i = props.book.attrs[props.schemaItem.name];
  if (!i) return '';

  switch (props.schemaItem.value.type) {
    case 'Date':
      if (typeof i === 'string') return i;
    case 'Text':
      if (typeof i === 'string') return i;
    case 'TextCollection':
      if (typeof i === 'string') return i;
    case 'Number':
      if (typeof i === 'number') return i;
  }

  return i;
});
</script>
