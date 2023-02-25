import type { IViewSettings } from '../../../main/src/services/openedTabs';

export const getDefaultViewSettings = (): IViewSettings => {
  return {
    grouped: false,
    viewStyle: 'Covers',
    sortBy: 'Title',
    sortDirection: 1,
    searchQuery: '',
  };
};
