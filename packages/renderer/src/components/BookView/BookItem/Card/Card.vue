<template>
  <div class="bookCard">
    <div placeholder="Title" class="title header-L" type="text">{{ mainTitle }}</div>
    <hr class="hr" />
    <div placeholder="Author" class="author header-M" type="text">{{ author }}</div>
    <div class="smallInputs">
      <BlockDisplay :value="rating" text="Rating" />
      <BlockDisplay :value="year" text="Year" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, getCurrentInstance, onMounted, ref, watch } from 'vue';
import type { PropType } from 'vue';
import type { IBookData } from '/@main/services/books';
import _debounce from 'lodash-es/debounce';

import BlockDisplay from './BlockDisplay/BlockDisplay.vue';

const props = defineProps({
  title: {
    type: String as PropType<IBookData['title']>,
    required: false,
    default: 'Unknown Title',
  },
  author: {
    type: String as PropType<IBookData['author']>,
    required: false,
    default: 'Unknown Autor',
  },
  rating: {
    type: Number as PropType<IBookData['myRating']>,
    required: false,
    default: -1,
  },
  year: {
    type: Number as PropType<IBookData['year']>,
    required: false,
    default: -1,
  },
});

const mainTitle = computed(() => (props.title ? props.title.split(':')[0] : ''));
</script>

<style scoped>
.bookCard {
  width: 100%;
  align-items: center;
  display: flex;
  align-items: center;
  flex-direction: column;
  padding-bottom: 5px;
  padding: 17px;
  box-shadow: 0px 0px 50px -15px hsla(0, 0%, 2%, 0.05);
  box-shadow: 4px 4px 10px 0px hsla(0, 0%, 0%, 0.06);
  border-radius: 5px;
  width: 100%;
}

.title,
.author,
.subtitle,
.fileName {
  text-align: center;
  width: 100%;
}

.hr {
  width: 66%;
  height: 2px;
  border-radius: 2px;
  background: var(--bg-secondary);
  margin: 7px 0 4px 0;
}

.author {
  color: var(--text-secondary);
  font-weight: 300;
}

.subtitle {
  margin-top: 4px;
  color: var(--text-secondary);
}

.title {
  font-weight: 500;
  color: var(--text-main);
}

.fileName {
  color: var(--text-secondary);
}

.smallInputs {
  margin-top: 16px;
  display: flex;
}
</style>
