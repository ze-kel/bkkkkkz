<template>
  <ShDialog v-model:open="settingsOpened">
    <ShDialogContent>
      <ShDialogTitle>Settings</ShDialogTitle>
      <Settings />
    </ShDialogContent>
  </ShDialog>
  <div class="flex items-center justify-start py-2">
    <ShButton variant="ghost" size="icon" @click="() => (settingsOpened = !settingsOpened)">
      <Settings2Icon stroke-width="1" />
    </ShButton>

    <IconsMenuBookAdder>
      <ShButton>
        <PlusIcon stroke-width="1" />
      </ShButton>
    </IconsMenuBookAdder>
  </div>
</template>

<script lang="ts" setup>
import Settings from '../Settings/SettingsPage.vue';

import { PlusIcon, Settings2Icon } from 'lucide-vue-next';

const settingsOpened = ref(false);
</script>
