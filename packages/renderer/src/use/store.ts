import { defineStore, acceptHMRUpdate } from 'pinia';
import { useElectron } from './electron';
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
  opened: IOpened | null;
};

export const useStore = defineStore('main', {
  state: (): StateType => {
    return {
      initialized: false,
      initialSetup: false,
      settings: null,
      fileTree: null,
      tags: null,
      opened: null,
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
      this.tags = val;
    },
    async newRootPath() {
      const allGood = await api.settings.newRootPath();
      if (allGood) {
        this.initCore();
      }
    },
    newOpened(newOne: IOpened | null) {
      this.opened = newOne;
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
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot));
}
