export type ISortByOption =
  | 'Title'
  | 'Author'
  | 'Year'
  | 'Last Read'
  | 'First Read'
  | 'Rating'
  | 'Filename';

export type ISortDirection = -1 | 1;

export type IViewStyle = 'Covers' | 'Lines';

export type IViewSettings = {
  grouped: boolean;
  sortBy: ISortByOption;
  sortDirection: ISortDirection;
  viewStyle: IViewStyle;
  searchQuery: string;
};

export type IOpenedPath = {
  type: 'folder';
  // Path
  thing: string;
  settings: IViewSettings;
  recursive?: boolean;
  scrollPosition: number;
};

export type IOpenedTag = {
  type: 'tag';
  // Tag name
  thing: string;
  settings: IViewSettings;
  scrollPosition: number;
};

export type IOpenedFile = {
  type: 'file';
  // Path
  thing: string;
  scrollPosition: number;
};

export type IOpenedNewFile = {
  type: 'newFile';
  // Path to be saved at
  thing: string;
  scrollPosition: number;
};

export type IOpenedInnerPage = {
  type: 'innerPage';
  thing: 'home' | 'settings';
  scrollPosition: number;
};

export type IOpened = IOpenedTag | IOpenedPath | IOpenedFile | IOpenedNewFile | IOpenedInnerPage;

export let OpenedTabs: IOpened[] = [];

export const updateOpened = (arr: IOpened[]) => {
  OpenedTabs = arr;
};
