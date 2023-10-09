<template>
  <div v-if="data">
    <div class="flex items-center justify-between gap-3">
      <div class="text-xl font-semibold">Reading Challenge</div>
      <BasicButton
        v-if="allYearsThatHaveChallengeButTheCurrent.length"
        variant="ghost"
        size="sm"
        class="gap-3"
        @click="flipExpanded"
      >
        <template v-if="!expanded"
          >Show All (+{{ allYearsThatHaveChallengeButTheCurrent.length }})</template
        >
        <template v-else>Collapse</template>
      </BasicButton>
    </div>
    <div class="mt-2">
      <ChallengeYear
        v-if="currentYearChallenge"
        :books-for-that-year="sortedByYear[currentYear] || []"
        :year="currentYear"
        :challenge="currentYearChallenge.books"
        @delete="deleteYear(currentYear)"
        @change="(books: number) => changeBooks(currentYear, books)"
      />
    </div>

    <template v-if="expanded">
      <div v-for="year in allYearsThatHaveChallengeButTheCurrent" :key="year[0]">
        <ChallengeYear
          :books-for-that-year="sortedByYear[year[0]] || []"
          :year="Number(year[0])"
          :challenge="year[1].books"
          @delete="deleteYear(year[0])"
          @change="(books: number) => changeBooks(year[0], books)"
        />
      </div>
    </template>

    <div class="my-2 flex">
      <BasicInput v-model="yearInput" class="" placeholder="Year" type="number" />
      <BasicInput v-model="booksInput" class="ml-2" placeholder="Books" type="number" />
      <BasicButton class="ml-2 shrink-0" variant="outline" @click="addYear">Add Year</BasicButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onBeforeMount, ref, watch } from 'vue';

import ChallengeYear from './ChallengeYear.vue';

import getSortFunction from '/@/components/BookView/getSortFunction';
import { dateReducerAllYears } from '/@/components/BookView/getDateReducer';
import { cloneDeep, cloneDeep as _cloneDeep, findIndex } from 'lodash';
import BasicButton from '/@/components/_UI/BasicButton/BasicButton.vue';
import BasicInput from '/@/components/_UI/BasicInput.vue';

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

const save = async () => {
  if (!data.value) return;
  await trpcApi.saveReadChallenge.mutate(_cloneDeep(data.value) || {});
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

  const sorted: Record<string, ISavedFile[]> = {};

  array.forEach((book) => {
    if (!book.read || !store.settings) return;
    const dates = book.read?.reduce(dateReducerAllYears(store.settings.dateFormat), []);

    dates.forEach((date) => {
      if (!sorted[date]) sorted[date] = [];
      sorted[date].push(book);
    });
  });

  const allYears = Object.keys(sorted) as Array<keyof typeof sorted>;

  const sortFunction = getSortFunction('First Read', store.settings.dateFormat);

  allYears.forEach((key: string) => {
    sorted[key].sort((a, b) => sortFunction(a, b, 1));
  });

  return sorted;
});

const currentYearChallenge = computed(() => {
  if (!data.value || !(currentYear.value in data.value)) return { books: 1 };
  console.log(currentYearChallenge);
  return data.value[currentYear.value];
});

const allYearsThatHaveChallengeButTheCurrent = computed(() => {
  if (!data.value) return [];
  const years = Object.entries(data.value);

  years.sort((a, b) => Number(b[0]) - Number(a[0]));
  return years.filter((v) => Number(v[0]) !== currentYear.value);
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

  if (!data.value) {
    data.value = {};
  }

  data.value[Number(yearInput.value)] = { books: booksInput.value };

  yearInput.value = undefined;
  booksInput.value = undefined;
  save();
};

// Interaction
const deleteYear = (year: number | string) => {
  if (!data.value) return;
  delete data.value[year];
  save();
};

const changeBooks = (year: number | string, books: number) => {
  if (!data.value) {
    data.value = {};
  }
  data.value[year] = { books };
  save();
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
