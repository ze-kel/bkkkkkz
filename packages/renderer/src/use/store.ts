import { defineStore, acceptHMRUpdate } from 'pinia';
import { useElectron } from './electron';
import { internalTagsList } from '/@main/services/tags';

import _clamp from 'lodash-es/clamp';
import _cloneDeep from 'lodash-es/cloneDeep';

import type { IFolderTree } from '/@main/services/files';
import type { ILocalSettings } from '/@main/services/settings';
import type { IOpened, IViewSettings, IViewStyle } from '/@main/services/watcher';
import type { ITags } from '/@main/services/tags';
import { getDefaultViewSettings } from '../utils/getDefaultViewSettings';

const api = useElectron();

export type StateType = {
  initialized: boolean;
  initialSetup: boolean;
  settings: ILocalSettings | null;
  fileTree: IFolderTree | null;
  tagsInternal: ITags | null;
  opened: IOpened[];
  activeOpenedIndex: number;
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
      const allGood = await api.settings.newRootPath();
      if (allGood) {
        this.initCore();
      }
    },

    //
    // Opened Tabs
    //
    addOpened(type: IOpened['type'], thing: string, open = true, recursive?: boolean) {
      if (type === 'folder' || type === 'tag') {
        let settings: IViewSettings;
        if (
          this.openedItem &&
          (this.openedItem.type === 'tag' || this.openedItem.type === 'folder')
        ) {
          settings = _cloneDeep(this.openedItem.settings);
        } else {
          settings = getDefaultViewSettings();
        }

        const newOne: IOpened = { type, thing, settings };

        if (newOne.type === 'folder') {
          newOne.recursive = recursive;
        }

        this.opened.push(newOne);
      } else {
        const newOne: IOpened = { type, thing };
        this.opened.push(newOne);
      }

      if (open) {
        this.activeOpenedIndex = this.opened.length - 1;
      }
    },
    updateOpened(index: number, type: IOpened['type'], thing: string, recursive?: boolean) {
      let newOne: IOpened;
      if (type === 'folder' || type === 'tag') {
        newOne = { type, thing, settings: getDefaultViewSettings() };
      } else {
        newOne = { type, thing };
      }

      if (newOne.type === 'folder') {
        newOne.recursive = recursive;
      }

      this.opened[index] = newOne;
    },
    closeOpened(index: number) {
      this.opened.splice(index, 1);
      if (this.activeOpenedIndex !== null && this.activeOpenedIndex >= this.opened.length) {
        this.activeOpenedIndex = this.opened.length - 1;
      }
    },
    async syncOpened() {
      await api.files.syncOpened(_cloneDeep(this.opened), this.activeOpenedIndex);
    },

    setOpenedIndex(index: number) {
      if (!this.opened.length) return;
      this.activeOpenedIndex = _clamp(index, 0, this.opened.length - 1);
    },

    //
    // Initialization
    //
    async initCore() {
      const allGood = await api.core.init();
      if (allGood) {
        try {
          await api.subscriptions.SETTINGS_UPDATE(this.updateSettings);

          const start = await api.settings.getSettings();
          this.updateSettings(start);
          await this.initFileTree();
          await this.initTags();

          this.initialSetup = false;

          if (this.settings && this.settings.lastOpened.length) {
            this.opened = this.settings.lastOpened;
            this.activeOpenedIndex = this.settings.lastActiveIndex;
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
      const initial = await api.files.getFileTree();
      this.fileTree = initial;
      this.initialized = true;
      api.subscriptions.TREE_UPDATE(this.updateTree);
    },

    async initTags() {
      api.subscriptions.TAGS_UPDATE(this.updateTags);
      const start = await api.files.getTags();
      this.updateTags(start);
    },

    async saveSettings() {
      api.settings.saveSettings(_cloneDeep(this.settings));
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
