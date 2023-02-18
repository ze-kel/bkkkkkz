import { z } from 'zod';
export const zSortByOption = z.enum([
  'Title',
  'Author',
  'Year',
  'Last Read',
  'First Read',
  'Rating',
  'Filename',
]);

export type ISortByOption = z.infer<typeof zSortByOption>;

export const zSortDirection = z.literal<-1>(-1).or(z.literal<1>(1));

export type ISortDirection = z.infer<typeof zSortDirection>;

export const zViewStyle = z.enum(['Covers', 'Lines']);

export type IViewStyle = z.infer<typeof zViewStyle>;

export const zViewSettings = z.object({
  grouped: z.boolean(),
  sortBy: zSortByOption,
  sortDirection: zSortDirection,
  viewStyle: zViewStyle,
  searchQuery: z.string(),
});

export type IViewSettings = z.infer<typeof zViewSettings>;

export const zOpenedPath = z.object({
  type: z.literal('folder'),
  // Path
  thing: z.string(),
  settings: zViewSettings,
  recursive: z.boolean().optional(),
  scrollPosition: z.number(),
});

export type IOpenedPath = z.infer<typeof zOpenedPath>;

export const zOpenedTag = z.object({
  type: z.literal('tag'),
  // Tag Name
  thing: z.string(),
  settings: zViewSettings,
  scrollPosition: z.number(),
});

export type IOpenedTag = z.infer<typeof zOpenedTag>;

export const zOpenedFile = z.object({
  type: z.literal('file'),
  // Path
  thing: z.string(),
  scrollPosition: z.number(),
});

export type IOpenedFile = z.infer<typeof zOpenedFile>;

export const zOpenedNewFile = z.object({
  type: z.literal('newFile'),
  // Path to be saved at
  thing: z.string(),
  scrollPosition: z.number(),
});

export type IOpenedNewFile = z.infer<typeof zOpenedNewFile>;

export const zOpenedInnerPage = z.object({
  type: z.literal('innerPage'),
  // Path to be saved at
  thing: z.enum(['home', 'settings']),
  scrollPosition: z.number(),
});

export type IOpenedInnerPage = z.infer<typeof zOpenedInnerPage>;

export const zOpened = z.discriminatedUnion('type', [
  zOpenedFile,
  zOpenedInnerPage,
  zOpenedNewFile,
  zOpenedPath,
  zOpenedTag,
]);

export type IOpened = z.infer<typeof zOpened>;

export let OpenedTabs: IOpened[] = [];

export const updateOpened = (arr: IOpened[]) => {
  OpenedTabs = arr;
};
