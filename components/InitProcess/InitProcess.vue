<template>
  <div
    class="bg-card text-card-foreground w-full max-w-[400px] rounded-lg border-neutral-300 px-6 py-4 shadow-sm dark:border-neutral-600"
  >
    <div class="font-serif text-3xl">Initializing</div>

    <div class="mt-4 flex flex-col gap-3 font-light">
      <div v-for="(step, i) in steps" class="">
        <div
          class="flex justify-between border border-neutral-200 p-2 px-4 dark:border-neutral-800"
          :class="typeof step === 'object' && 'rounded-b-none border-b-0'"
        >
          {{ stepName[i] }}
          <div>
            <CheckIcon v-if="step === true" />
            <LoaderCircle v-else-if="step === false && running" class="animate-spin" />
            <XIcon v-else />
          </div>
        </div>
        <div
          v-if="typeof step === 'object'"
          class="border border-neutral-300 p-4 dark:border-neutral-800"
        >
          <div class="text-regular font-bold">{{ step.title }}</div>
          <div v-if="step.info" class="mt-1 text-xs">{{ step.info }}</div>
          <div class="mt-4 flex gap-2">
            <ShButton
              v-if="step.rawError"
              variant="outline"
              @click="store.setError(step)"
              class="w-full"
            >
              Show full error</ShButton
            >
            <ShButton v-if="step.actionCode" variant="outline" @click="initLoop" class="w-full">
              {{ step.actionLabel }}</ShButton
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useStore } from '~~/utils/store';
import { CheckIcon, LoaderCircle, XIcon } from 'lucide-vue-next';
import { c_init_once, c_prepare_cache, c_watch_path } from '~/api/tauriActions';

const store = useStore();

const init = ref<Awaited<ReturnType<typeof c_init_once>>>(false);
const cacheSetup = ref<Awaited<ReturnType<typeof c_prepare_cache>>>(false);
const watcherSetup = ref<Awaited<ReturnType<typeof c_watch_path>>>(false);

const running = ref(false);

const steps = computed(() => [init.value, cacheSetup.value, watcherSetup.value]);
const stepName = ['Initialize', 'Setup cache', 'Start watcher'];

const resetAll = () => {
  init.value = false;
  cacheSetup.value = false;
  watcherSetup.value = false;
};

const initLoop = async () => {
  running.value = true;
  await store.fetchRootPath();
  const rp = store.rootPath;

  if (init.value !== true) {
    init.value = await c_init_once();
    if (typeof init.value == 'object') {
      running.value = false;
      return;
    }
  }

  if (typeof store.rootPath !== 'string') {
    await navigateTo('/welcome');
    return;
  }

  

  if (cacheSetup.value !== true) {
    cacheSetup.value = await c_prepare_cache();
    if (typeof cacheSetup.value == 'object') {
      running.value = false;
      return;
    }
  }

  if (watcherSetup.value !== true) {
    watcherSetup.value = await c_watch_path();
    if (typeof watcherSetup.value == 'object') {
      running.value = false;
      return;
    }
  }

  await navigateTo('/application');
};

onMounted(() => {
  resetAll();
  initLoop();
});
</script>
