<template>
  <ShTable>
    <ShTableHeader>
      <ShTableRow>
        <ShTableHead> Title </ShTableHead>
        <ShTableHead> Author </ShTableHead>
        <ShTableHead> Year </ShTableHead>
      </ShTableRow>
    </ShTableHeader>
    <ShTableBody>
      <template v-for="f in files" :key="f.path">
        <BookViewBookContextMenu :path="f.path">
          <ShTableRow>
            <ShTableCell class="w-1/2">
              <template v-if="f.title">
                {{ f.title }}
              </template>
              <template v-else> Unknown title </template>
            </ShTableCell>

            <ShTableCell>
              {{ f.author }}
            </ShTableCell>
            <ShTableCell>
              {{ f.year }}
            </ShTableCell>
          </ShTableRow>
        </BookViewBookContextMenu>
      </template>
    </ShTableBody>
  </ShTable>
</template>

<script lang="ts" setup>
import type { IBookFromDb } from '~/api/watcher/metaCache';

const props = defineProps({
  files: {
    type: Object as PropType<IBookFromDb[]>,
    required: true,
  },
});
</script>
