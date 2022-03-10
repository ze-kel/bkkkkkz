import type { IViewSettings } from '/@main/watcher/openedTabs';

export const getDefaultViewSettings = (): IViewSettings => {
  return {
    grouped: false,
    viewStyle: 'Covers',
    sortBy: 'Title',
    sortDirection: 1,
    searchQuery: '',
  };
};
