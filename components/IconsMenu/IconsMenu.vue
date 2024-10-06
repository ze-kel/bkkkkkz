<template>
  <ShDialog v-model:open="settingsOpened">
    <ShDialogContent>
      <ShDialogTitle>Settings</ShDialogTitle>
      <Settings />
    </ShDialogContent>
  </ShDialog>
  <div class="flex items-center justify-start py-2">
    <ShButton
      v-test-class="testClasses.menuSettings"
      variant="ghost"
      size="icon"
      @click="() => (settingsOpened = !settingsOpened)"
    >
      <Settings2Icon stroke-width="1" />
    </ShButton>

    <IconsMenuBookAdder>
      <ShButton v-test-class="testClasses.menuAddBook" variant="ghost" size="icon">
        <PlusIcon stroke-width="1" />
      </ShButton>
    </IconsMenuBookAdder>
  </div>
</template>

<script lang="ts" setup>
import Settings from '../Settings/SettingsPage.vue';
import { testClasses } from '~/tools/tests/binds';

import { PlusIcon, Settings2Icon } from 'lucide-vue-next';

const settingsOpened = ref(false);
</script>
