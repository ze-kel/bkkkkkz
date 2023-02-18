<template>
  <div>
    <div class="text-2xl font-semibold">Reading Challenge</div>
    <div class="mt-2">
      <ChallengeYear
        :books-for-that-year="sortedByYear[currentYear] || []"
        :year="currentYear"
        :challenge="currentYearChallenge"
        @delete="deleteYear(currentYear)"
        @change="(books: number) => changeBooks(currentYear, books)"
      />
    </div>

    <template v-if="expanded">
      <div v-for="year in allYearsThatHaveChallengeButTheCurrent" :key="year.year">
        <hr class="hr-default" />
        <ChallengeYear
          :books-for-that-year="sortedByYear[year.year] || []"
          :year="year.year"
          :challenge="year.books"
          @delete="deleteYear(year.year)"
          @change="(books: number) => changeBooks(year.year, books)"
        />
      </div>

      <div class="my-1 flex">
        <input v-model="yearInput" class="input-default" placeholder="Year" type="number" />
        <input v-model="booksInput" class="input-default ml-2" placeholder="Books" type="number" />
        <button class="basic-button ml-2" @click="addYear">Add Year</button>
      </div>
    </template>

    <div
      v-if="allYearsThatHaveChallengeButTheCurrent.length"
      class="mt-3 mb-2 w-full text-center flex justify-center cursor-pointer fill-neutral-900 dark:fill-neutral-50"
      @click="flipExpanded"
    >
      <svg width="24" height="24" viewBox="0 0 24 24">
        <path v-if="expanded" d="M13 5.83L15.59 8.41L17 7L12 2L7 7L8.41 8.41L11 5.83V22H13V5.83Z" />
        <path v-else d="M16 18H13V2L11 2V18H8L12 22L16 18Z" />
      </svg>
      <template v-if="!expanded">Show All Years</template>
      <template v-else>Show Only Current Year</template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useStore } from '/@/use/store';

import ChallengeYear from './ChallengeYear.vue';

import getSortFunction from '/@/components/BookView/getSortFunction';
import { dateReducerAllYears } from '/@/components/BookView/getDateReducer';
import { cloneDeep as _cloneDeep } from 'lodash';

import type { IFiles, ISavedFile } from '/@main/services/files';
import { trpcApi } from '/@/utils/trpc';

const store = useStore();

const read = ref<IFiles>({});

const load = async () => {
  read.value = await trpcApi.loadFilesFromTag.query('_i_read');
};

const currentYear = computed(() => {
  const year = new Date().getFullYear();
  return year;
});

const sortedByYear = computed(() => {
  // Cannot reuse grouping from BookView because we need to have book in all year groups, not in first\last one

  const array = Object.values(read.value);

  const sorted: Record<number, ISavedFile[]> = {};

  array.forEach((book) => {
    if (!book.read) return;
    const dates = book.read?.reduce(dateReducerAllYears, []);

    dates.forEach((date) => {
      if (!sorted[date]) sorted[date] = [];
      sorted[date].push(book);
    });
  });

  //@ts-expect-error Typescript is wrong here, this is correct and safe.
  const allYears = Object.keys(sorted) as Array<keyof typeof sorted>;

  const sortFunction = getSortFunction('First Read');

  allYears.forEach((key: number) => {
    sorted[key].sort((a, b) => sortFunction(a, b, 1));
  });

  return sorted;
});

const currentYearChallenge = computed(() => {
  return store.settings?.readChallenges[currentYear.value]?.books;
});

const allYearsThatHaveChallengeButTheCurrent = computed(() => {
  const years = _cloneDeep(store.settings?.readChallenges) || {};

  delete years[currentYear.value];
  console.log('years after deletion', years);

  return Object.values(years).sort((a, b) => b.year - a.year);
});

// Show Hide
const expanded = ref(false);
const flipExpanded = () => {
  expanded.value = !expanded.value;
};

// Adding Year
const yearInput = ref<number>();
const booksInput = ref<number>();

const addYear = () => {
  if (!store.settings) throw 'No settings object';
  if (!yearInput.value || !booksInput.value) return;
  store.settings.readChallenges[yearInput.value] = {
    books: booksInput.value,
    year: yearInput.value,
  };
  yearInput.value = undefined;
  booksInput.value = undefined;
};

// Interaction
const deleteYear = (year: number) => {
  if (!store.settings) throw 'No settings object';
  delete store.settings.readChallenges[year];
};

const changeBooks = (year: number, books: number) => {
  console.log('changing', books);
  if (!store.settings) throw 'No settings object';
  store.settings.readChallenges[year] = { year, books };
};

const log = (books: number) => {
  console.log(books);
};

load();
</script>

<style scoped>
.cards {
  grid-template-columns: repeat(auto-fill, minmax(175px, 1fr));
  grid-auto-rows: max-content;
}

.hideFull > .singleCard:nth-child(4) ~ .singleCard {
  display: none;
}
</style>
