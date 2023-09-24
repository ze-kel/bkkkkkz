<template>
  <div v-if="data">
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
        <hr class="h-[1px] w-full border-0 bg-neutral-200 dark:bg-neutral-700" />
        <ChallengeYear
          :books-for-that-year="sortedByYear[year.year] || []"
          :year="year.year"
          :challenge="year.books"
          @delete="deleteYear(year.year)"
          @change="(books: number) => changeBooks(year.year, books)"
        />
      </div>
    </template>

    <div v-if="expanded || !allYearsThatHaveChallengeButTheCurrent.length" class="my-1 flex">
      <input v-model="yearInput" class="" placeholder="Year" type="number" />
      <input v-model="booksInput" class="ml-2" placeholder="Books" type="number" />
      <button class="ml-2" @click="addYear">Add Year</button>
    </div>

    <div
      v-if="allYearsThatHaveChallengeButTheCurrent.length"
      class="mb-2 mt-3 flex w-full cursor-pointer justify-center fill-neutral-900 text-center dark:fill-neutral-50"
      @click="flipExpanded"
    >
      <ChevronDown class="mr-2 w-6" :class="[expanded && 'rotate-180']" />

      <template v-if="!expanded">Show All Years</template>
      <template v-else>Show Only Current Year</template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeMount, ref } from 'vue';

import ChallengeYear from './ChallengeYear.vue';

import getSortFunction from '/@/components/BookView/getSortFunction';
import { dateReducerAllYears } from '/@/components/BookView/getDateReducer';
import { cloneDeep, cloneDeep as _cloneDeep, findIndex } from 'lodash';
import { ChevronDown } from 'lucide-vue-next';

import type { IFiles, ISavedFile } from '/@main/services/files';
import { trpcApi } from '/@/utils/trpc';
import { useStore } from '/@/use/store';
import type { IReadChallengeData } from '/@main/services/readChalenge';

const store = useStore();
const read = ref<IFiles>({});

const data = ref<IReadChallengeData>();

onBeforeMount(async () => {
  data.value = await trpcApi.getReadChallenge.query();
});

const update = async (update: IReadChallengeData) => {
  await trpcApi.saveReadChallenge.mutate(update);
  data.value = update;
};

const load = async () => {
  try {
    read.value = await trpcApi.loadFilesFromTag.query('_i_read');
  } catch (e) {
    console.error('failed loading read tag');
  }
};

const currentYear = computed(() => {
  const year = new Date().getFullYear();
  return year;
});

const sortedByYear = computed(() => {
  if (!data.value || !store.settings) return {};
  // Cannot reuse grouping from BookView because we need to have book in all year groups, not in first\last one

  const array = Object.values(read.value);

  const sorted: Record<number, ISavedFile[]> = {};

  array.forEach((book) => {
    if (!book.read || !store.settings) return;
    const dates = book.read?.reduce(dateReducerAllYears(store.settings.dateFormat), []);

    dates.forEach((date) => {
      if (!sorted[date]) sorted[date] = [];
      sorted[date].push(book);
    });
  });

  //@ts-expect-error Typescript is wrong here, this is correct and safe.
  const allYears = Object.keys(sorted) as Array<keyof typeof sorted>;

  const sortFunction = getSortFunction('First Read', store.settings.dateFormat);

  allYears.forEach((key: number) => {
    sorted[key].sort((a, b) => sortFunction(a, b, 1));
  });

  return sorted;
});

const currentYearChallenge = computed(() => {
  return data.value?.find((v) => v.year === currentYear.value)?.books;
});

const allYearsThatHaveChallengeButTheCurrent = computed(() => {
  const years = _cloneDeep(data.value) || [];

  years.sort((a, b) => b.year - a.year);
  return years.filter((v) => v.year !== currentYear.value);
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
  if (!yearInput.value || !booksInput.value) return;

  if (!data.value) return;

  const newData = cloneDeep(data.value);

  update([
    ...newData,
    {
      books: booksInput.value,
      year: yearInput.value,
    },
  ]);
  yearInput.value = undefined;
  booksInput.value = undefined;
};

// Interaction
const deleteYear = (year: number) => {
  if (!data.value) return;
  const newData = data.value.filter((v) => v.year !== year);
  update(newData);
};

const changeBooks = (year: number, books: number) => {
  const newData = cloneDeep(data.value);
  if (!newData) return;
  const i = newData.findIndex((v) => v.year === year);
  if (i > 0) {
    newData[i] = { year, books };
  } else {
    newData.push({ year, books });
  }
  update(newData);
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
