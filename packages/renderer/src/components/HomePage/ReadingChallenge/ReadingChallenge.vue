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
        <hr class="bg-neutral-200 dark:bg-neutral-700 h-[1px] border-0 w-full" />
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
      class="mt-3 mb-2 w-full text-center flex justify-center cursor-pointer fill-neutral-900 dark:fill-neutral-50"
      @click="flipExpanded"
    >
      <ChevronDown class="w-6 mr-2" :class="[expanded && 'rotate-180']" />

      <template v-if="!expanded">Show All Years</template>
      <template v-else>Show Only Current Year</template>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';

import ChallengeYear from './ChallengeYear.vue';

import getSortFunction from '/@/components/BookView/getSortFunction';
import { dateReducerAllYears } from '/@/components/BookView/getDateReducer';
import { cloneDeep, cloneDeep as _cloneDeep, findIndex } from 'lodash';
import ChevronDown from '@heroicons/vue/24/outline/ChevronDownIcon';

import type { IFiles, ISavedFile } from '/@main/services/files';
import { trpcApi } from '/@/utils/trpc';
import { useStore } from '/@/use/store';
import { useSettings } from '/@/use/settings';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import type { IReadChallengeData } from '/@main/services/readChalenge';

const store = useStore();
const { settings } = useSettings();
const read = ref<IFiles>({});

const qc = useQueryClient();

const { data } = useQuery({
  async queryFn() {
    return await trpcApi.getReadChallenge.query();
  },
  queryKey: ['readChallenge'],
});

const mutation = useMutation({
  async mutationFn(d: IReadChallengeData) {
    console.log('mutation');
    await trpcApi.saveReadChallenge.mutate(d);
  },
  async onMutate(d) {
    qc.setQueryData(['readChallenge'], d);
  },
});

const load = async () => {
  try {
    read.value = await trpcApi.loadFilesFromTag.query('_i_read');
  } catch (e) {
    console.log('');
  }
};

const currentYear = computed(() => {
  const year = new Date().getFullYear();
  return year;
});

const sortedByYear = computed(() => {
  if (!data.value || !settings.value) return {};
  // Cannot reuse grouping from BookView because we need to have book in all year groups, not in first\last one

  const array = Object.values(read.value);

  const sorted: Record<number, ISavedFile[]> = {};

  array.forEach((book) => {
    if (!book.read) return;
    const dates = book.read?.reduce(dateReducerAllYears(settings.value.dateFormat), []);

    dates.forEach((date) => {
      if (!sorted[date]) sorted[date] = [];
      sorted[date].push(book);
    });
  });

  //@ts-expect-error Typescript is wrong here, this is correct and safe.
  const allYears = Object.keys(sorted) as Array<keyof typeof sorted>;

  const sortFunction = getSortFunction('First Read', settings.value.dateFormat);

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

  mutation.mutate([
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
  mutation.mutate(newData);
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
  mutation.mutate(newData);
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
