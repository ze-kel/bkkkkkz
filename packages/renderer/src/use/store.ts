import { defineStore, acceptHMRUpdate } from 'pinia';

import { clamp as _clamp } from 'lodash';
import { cloneDeep as _cloneDeep } from 'lodash';
import { trpcApi } from '../utils/trpc';

import type { IFolderTree } from '/@main/services/files';
import type { ILocalSettings } from '/@main/services/settings';
import type { IOpened } from '/@main/watcher/openedTabs';
import type { ITags } from '/@main/watcher/tagUpdates';

export type StateType = {
  initialized: boolean;
  initialSetup: boolean;
  settings: ILocalSettings | null;
  fileTree: IFolderTree | null;
  tagsInternal: ITags | null;
  opened: IOpened[];
  activeOpenedIndex: number;
};

export type OpenNewOneParams = {
  index?: number | 'current';
  doNotFocus?: boolean;
};

export const useStore = defineStore('main', {
  state: (): StateType => {
    return {
      initialized: false,
      initialSetup: false,
      settings: null,
      fileTree: null,
      tagsInternal: null,
      opened: [],
      activeOpenedIndex: -1,
    };
  },
  actions: {
    updateSettings(val: ILocalSettings) {
      this.settings = val;
    },
    updateTree(val: IFolderTree) {
      this.fileTree = val;
    },
    updateTags(val: ITags) {
      this.tagsInternal = val;
    },
    async newRootPath() {
      const allGood = await trpcApi.newRootPath.mutate();
      if (allGood) {
        this.initCore();
      }
    },

    //
    // Opened Tabs
    //
    openNewOne(item: IOpened, params: OpenNewOneParams = {}) {
      let indexToSet: number;

      if (params.index) {
        if (params.index === 'current') {
          indexToSet = this.activeOpenedIndex;
        } else {
          indexToSet = params.index;
        }
      } else {
        indexToSet = this.opened.length;
      }

      // Inner pages can't be opened in two different tabs
      if (item.type === 'innerPage') {
        const existing = this.opened.findIndex(
          (el) => el.type === item.type && el.thing === item.thing,
        );
        if (existing >= 0) indexToSet = existing;
      }

      indexToSet = _clamp(indexToSet, 0, this.opened.length);

      this.opened[indexToSet] = item;

      if (!params.doNotFocus) {
        if (params.index) {
          this.activeOpenedIndex = indexToSet;
        } else {
          this.activeOpenedIndex = this.opened.length - 1;
        }
      }

      this.syncOpened();
    },

    closeOpened(index: number) {
      this.opened.splice(index, 1);
      if (this.activeOpenedIndex !== null && this.activeOpenedIndex >= this.opened.length) {
        this.activeOpenedIndex = this.opened.length - 1;
      }
      this.syncOpened();
    },
    async syncOpened() {
      await trpcApi.syncOpened.mutate({
        opened: _cloneDeep(this.opened),
        index: this.activeOpenedIndex,
      });
    },

    setOpenedIndex(index: number) {
      if (!this.opened.length) return;
      this.activeOpenedIndex = _clamp(index, 0, this.opened.length - 1);
    },

    saveScrollPosition(index: number, value: number) {
      this.opened[index].scrollPosition = value;
    },

    //
    // Initialization
    //
    async initCore() {
      const allGood = await trpcApi.init.query();
      if (allGood) {
        try {
          await trpcApi.settingsUpdate.subscribe(undefined, { onData: this.updateSettings });

          const start = await trpcApi.getSettings.query();
          this.updateSettings(start);
          await this.initFileTree();
          await this.initTags();

          this.initialSetup = false;

          if (this.settings && this.settings.lastOpened.length) {
            this.opened = _cloneDeep(this.settings.lastOpened);
            this.activeOpenedIndex = this.settings.lastActiveIndex;
            this.syncOpened();
          }
        } catch (e) {
          console.log('e', e);
        }
      } else {
        this.initialSetup = true;
        this.initialized = false;
      }
    },

    async initFileTree() {
      const initial = await trpcApi.getFileTree.query();
      console.log('initial', initial);
      this.fileTree = initial;
      this.initialized = true;
      await trpcApi.treeUpdate.subscribe(undefined, { onData: this.updateTree });
    },

    async initTags() {
      await trpcApi.tagsUpdate.subscribe(undefined, { onData: this.updateTags });
      const start = await trpcApi.getTags.query();
      this.updateTags(start);
    },

    async saveSettings() {
      trpcApi.saveSettings.mutate(_cloneDeep(this.settings));
    },
  },
  getters: {
    openedItem(state) {
      if (state.activeOpenedIndex === null) return null;
      return state.opened[state.activeOpenedIndex];
    },
    currentViewSettings(state) {
      if (state.activeOpenedIndex === null) return undefined;
      const opened = state.opened[state.activeOpenedIndex];

      if (opened.type !== 'folder' && opened.type !== 'tag') return undefined;

      return opened.settings;
    },

    tags(state) {
      if (!state.tagsInternal) return [];
      return state.tagsInternal.sort((a, b) => a.localeCompare(b));
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot));
}
