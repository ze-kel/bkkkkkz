import { defineStore, acceptHMRUpdate } from 'pinia';

import { clamp as _clamp, cloneDeep } from 'lodash';
import { cloneDeep as _cloneDeep } from 'lodash';
import { trpcApi } from '../utils/trpc';

import type { IOpened, IOpenedTabs } from '/@main/services/openedTabs';
import type { IFolderTree } from '/@main/services/files';
import type { ISettings } from '/@main/services/settings';
import type { ITags } from '/@main/watcher/tagUpdates';

export type StateType = {
  rootPath: string | null;
  opened: IOpenedTabs;
  folderTree: IFolderTree | null;
  settings: ISettings | null;
  tagsTree: ITags;
};

export type OpenNewOneParams = {
  index?: number | 'current';
  doNotFocus?: boolean;
};

export const useStore = defineStore('main', {
  state: (): StateType => {
    return {
      rootPath: null,
      tagsTree: [],
      settings: null,
      folderTree: null,
      opened: { tabs: [], active: undefined },
    };
  },
  actions: {
    //
    // Opened Tabs
    //
    openNewOne(item: IOpened, params: OpenNewOneParams = {}) {
      let indexToSet: number;

      if (params.index) {
        if (params.index === 'current') {
          indexToSet = this.opened.active || 0;
        } else {
          indexToSet = params.index;
        }
      } else {
        indexToSet = this.opened.tabs.length;
      }

      // Inner pages can't be opened in two different tabs
      if (item.type === 'innerPage') {
        const existing = this.opened.tabs.findIndex(
          (el) => el.type === item.type && el.thing === item.thing,
        );
        if (existing >= 0) indexToSet = existing;
      }

      indexToSet = _clamp(indexToSet, 0, this.opened.tabs.length);

      this.opened.tabs[indexToSet] = item;

      if (!params.doNotFocus) {
        if (params.index) {
          this.opened.active = indexToSet;
        } else {
          this.opened.active = this.opened.tabs.length - 1;
        }
      }

      this.saveOpened();
    },

    closeOpened(index: number) {
      this.opened.tabs.splice(index, 1);
      if (this.opened.active && this.opened.active >= this.opened.tabs.length) {
        this.opened.active = this.opened.tabs.length - 1;
      }
      this.saveOpened();
    },
    async saveOpened() {
      await trpcApi.setOpenedTabs.mutate(cloneDeep(this.opened));
    },
    async fetchOpened() {
      this.opened = await trpcApi.getOpenedTabs.query();
    },
    async fetchSetting() {
      this.settings = await trpcApi.getSettings.query();
    },
    async fetchTags() {
      this.tagsTree = await trpcApi.getTags.query();
    },
    async fetchRootPath() {
      this.rootPath = await trpcApi.getRootPath.query();
    },

    setOpenedIndex(index: number) {
      if (!this.opened.tabs.length) return;
      this.opened.active = _clamp(index, 0, this.opened.tabs.length - 1);
    },

    saveScrollPosition(index: number, value: number) {
      this.opened.tabs[index].scrollPosition = value;
    },

    //
    // Updates
    //
    updateFolderTree(data: IFolderTree) {
      this.folderTree = data;
    },
    updateSettings(data: ISettings) {
      this.settings = data;
    },
    updateTags(data: ITags) {
      this.tagsTree = data;
    },
  },
  getters: {
    openedItem(state) {
      if (typeof state.opened.active !== 'number') return;
      return state.opened.tabs[state.opened.active];
    },
    currentViewSettings(state) {
      if (typeof state.opened.active !== 'number') return undefined;
      const opened = state.opened.tabs[state.opened.active];

      if (opened.type !== 'folder' && opened.type !== 'tag') return undefined;

      return opened.settings;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot));
}
