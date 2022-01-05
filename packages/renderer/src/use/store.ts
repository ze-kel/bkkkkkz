import { defineStore, acceptHMRUpdate } from 'pinia';
import { useElectron } from './electron';
import _clamp from 'lodash-es/clamp';
import _cloneDeep from 'lodash-es/cloneDeep';
import type { IFolderTree } from '/@main/services/files';
import type { ILocalSettings } from '/@main/services/settings';
import type { IOpened } from '/@main/services/watcher';
import type { ITags } from '/@main/services/tags';

const api = useElectron();

type StateType = {
  initialized: boolean;
  initialSetup: boolean;
  settings: ILocalSettings | null;
  fileTree: IFolderTree | null;
  tags: ITags | null;
  opened: IOpened[];
  activeOpenedIndex: number | null;
};

export const useStore = defineStore('main', {
  state: (): StateType => {
    return {
      initialized: false,
      initialSetup: false,
      settings: null,
      fileTree: null,
      tags: null,
      opened: [],
      activeOpenedIndex: null,
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
      console.log('update tags', val);
      this.tags = val;
    },
    async newRootPath() {
      const allGood = await api.settings.newRootPath();
      if (allGood) {
        this.initCore();
      }
    },
    addOpened(newOne: IOpened) {
      this.opened.push(newOne);
      this.activeOpenedIndex = this.opened.length - 1;
      this.syncOpened();
    },
    updateOpened(index: number, updated: IOpened) {
      this.opened[index] = updated;
      this.syncOpened();
    },
    closeOpened(index: number) {
      this.opened.splice(index, 1);
      if (this.activeOpenedIndex && this.activeOpenedIndex >= this.opened.length) {
        this.activeOpenedIndex = this.opened.length ? this.opened.length - 1 : null;
      }
      this.syncOpened();
    },
    async syncOpened() {
      await api.files.syncOpened(_cloneDeep(this.opened));
    },

    setOpenedIndex(index: number) {
      if (!this.opened.length) return;
      this.activeOpenedIndex = _clamp(index, 0, this.opened.length - 1);
    },

    async initCore() {
      const allGood = await api.core.init();
      if (allGood) {
        await api.subscriptions.SETTINGS_UPDATE(this.updateSettings);

        const start = await api.settings.getSettings();
        this.updateSettings(start);
        await this.initFileTree();
        await this.initTags();
        this.initialSetup = false;
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
  },
  getters: {
    openedItem(state) {
      if (state.activeOpenedIndex === null) return null;
      return state.opened[state.activeOpenedIndex];
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot));
}
