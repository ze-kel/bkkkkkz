<template>
  <div class="grid gap-4 py-4" style="grid-template-columns: auto 1fr">
    <div class="flex flex-col items-center gap-2">
      <ShContextMenu>
        <ShContextMenuTrigger class="w-fit">
          <div
            class="aspect-[6/9] w-[175px] bg-transparent"
            :draggable="true"
            @dragstart="startDrag($event)"
          >
            <CoverBookCover :file="openedFile" />
          </div>
        </ShContextMenuTrigger>
        <ShContextMenuContent>
          <ShContextMenuItem @click="setCoverHandle">
            {{ openedFile.cover ? 'Change cover' : 'Add cover' }}
          </ShContextMenuItem>

          <ShContextMenuItem @click="fetchCoverHandle"> Try to fetch cover </ShContextMenuItem>

          <ShContextMenuItem v-if="openedFile.cover" @click="removeCoverHandler">
            Remove cover
          </ShContextMenuItem>
        </ShContextMenuContent>
      </ShContextMenu>

      <RatingStars
        v-model="openedFile.myRating"
        @update:model-value="emit('change')"
        class="mt-3 place-content-center self-center"
      />

      <UiBasicInput
        v-model="openedFile.ISBN13"
        @update:model-value="emit('change')"
        type="number"
        class="min-w-[100px] text-center opacity-50 focus:opacity-100"
        theme="hidden"
        placeholder="isbn13"
      />
    </div>

    <div class="flex flex-col gap-2">
      <UiBasicInput
        v-model="openedFile.title"
        @update:model-value="emit('change')"
        spellcheck="false"
        class="line-clamp-1 min-w-[100px] text-4xl font-light leading-none"
        placeholder="Title"
        theme="hidden"
      />
      <UiBasicInput
        v-model="openedFile.author"
        @update:model-value="emit('change')"
        spellcheck="false"
        class="font-regular -mt-1 w-fit min-w-[100px] text-2xl leading-none"
        theme="hidden"
        placeholder="Author"
      />

      <div class="flex items-center gap-3">
        <UiBasicInput
          v-model="openedFile.year"
          @update:model-value="emit('change')"
          type="number"
          theme="hidden"
          class="w-[75px]"
          placeholder="Year"
        />
      </div>

      <EditorTagsEditor v-model="openedFile.tags" class="" @change="emit('change')" />
      <ReadDetails v-model="openedFile.read" class="mt-3" @update:model-value="emit('change')" />
    </div>
  </div>

  <div ref="forDrag" class="absolute top-[-500px]">
    <UiDragDisplay> {{ dragging }} </UiDragDisplay>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'vue-sonner';
import { fetchCover, removeCover, setCover } from '~/api/files';
import type { IBookFromDb } from '~/api/tauriEvents';
import ReadDetails from './ReadDetails/ReadDetails.vue';

const openedFile = defineModel<IBookFromDb>({
  required: true,
});

const emit = defineEmits(['change']);

///
/// Cover Right click
///
const removeCoverHandler = async () => {
  if ('unsaved' in openedFile.value) return;
  removeCover({ bookFilePath: openedFile.value.path });
};

const setCoverHandle = () => {
  if ('unsaved' in openedFile.value) return;
  setCover({ bookFilePath: openedFile.value.path });
};

const fetchCoverHandle = async () => {
  if (!openedFile.value.ISBN13) {
    toast.error("Can't fetch cover without isbn13", {
      description: 'Please specify ISBN and try again',
    });
    return;
  }

  if ('unsaved' in openedFile.value) {
    toast.error(`Can't fetch cover for unsaved file`, {
      description: 'Save file and try again',
    });
    return;
  }

  const promise = fetchCover({ bookFilePath: openedFile.value.path });

  toast.promise(promise, {
    loading: 'Fetching...',
    success: () => {
      return `Cover updated`;
    },
    error: (e: any) => {
      return String(e);
    },
  });
};

const dragging = ref('');
const forDrag = ref();

const startDrag = (devt: DragEvent) => {
  /*
  if (
    devt.dataTransfer === null ||
    !openedFile.value ||
    'unsaved' in openedFile.value ||
    !openedFile.value.name
  ) {
    return;
  }

  devt.dataTransfer.setData('itemPath', openedFile.value.path);
  devt.dataTransfer.setDragImage(forDrag.value, 0, 0);
  dragging.value = openedFile.value.name;

  if (!store.openedTabs) return;
  const toUpdateIndexes = store.openedTabs.reduce((acc: number[], opened, index) => {
    if ('unsaved' in openedFile.value) return [];
    if (opened.type === 'file' && opened.thing === openedFile.value?.path) {
      acc.push(index);
    }
    return acc;
  }, []);

  devt.dataTransfer.setData('indexesToUpdate', JSON.stringify(toUpdateIndexes));
  */
};
</script>
