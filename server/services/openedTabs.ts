import * as path from 'path';
import * as fs from 'fs-extra';
import { z } from 'zod';
import { getRootPath } from './rootPath';
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
  id: z.string(),
  type: z.literal('folder'),
  // Path
  thing: z.string(),
  settings: zViewSettings,
  recursive: z.boolean().optional(),
  scrollPosition: z.number(),
});

export type IOpenedPath = z.infer<typeof zOpenedPath>;

export const zOpenedTag = z.object({
  id: z.string(),
  type: z.literal('tag'),
  // Tag Name
  thing: z.string(),
  settings: zViewSettings,
  scrollPosition: z.number(),
});

export type IOpenedTag = z.infer<typeof zOpenedTag>;

export const zOpenedFile = z.object({
  id: z.string(),
  type: z.literal('file'),
  // Path
  thing: z.string(),
  scrollPosition: z.number(),
});

export type IOpenedFile = z.infer<typeof zOpenedFile>;

export const zOpenedNewFile = z.object({
  id: z.string(),
  type: z.literal('newFile'),
  // Path to be saved at
  thing: z.string(),
  scrollPosition: z.number(),
});

export type IOpenedNewFile = z.infer<typeof zOpenedNewFile>;

export const zOpenedInnerPage = z.object({
  id: z.string(),
  type: z.literal('innerPage'),
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

export const ZOpenedTabs = z.object({
  tabs: z.array(zOpened),
  activeId: z.string().default(''),
});

export type IOpenedTabs = z.infer<typeof ZOpenedTabs>;

const JSON_NAME = 'openedTabs.json';

export const getOpenedTabs = () => {
  const rootPath = getRootPath();

  if (!rootPath) {
    throw new Error('Trying to read settings without root path present');
  }

  const targetFolder = path.join(rootPath, '/.internal/');
  const targetFile = path.join(targetFolder, JSON_NAME);
  fs.ensureDirSync(targetFolder);

  const f = fs.existsSync(targetFile)
    ? JSON.parse(fs.readFileSync(targetFile).toString())
    : { tabs: [] };

  const parsed = ZOpenedTabs.parse(f);
  return parsed;
};

export const setOpenedTabs = (tabs: IOpenedTabs) => {
  const rootPath = getRootPath();

  if (!rootPath) {
    throw new Error('Trying to write settings without root path present');
  }

  const targetFolder = path.join(rootPath, '/.internal/');
  const targetFile = path.join(targetFolder, JSON_NAME);
  fs.ensureDirSync(targetFolder);

  fs.writeFileSync(targetFile, JSON.stringify(tabs));
  return;
};
