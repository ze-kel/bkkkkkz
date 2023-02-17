import _difference from 'lodash-es/difference';
import _debounce from 'lodash-es/debounce';
import WebContentsProxy from '../ipc/webContents';
import { OpenedTabs } from './openedTabs';
import type { IFile, ISavedFile } from '../services/files';
import type { IWatcherModule } from './watcherCore';

export type ITagData = {
  [key: string]: Set<string>;
};

export type ITags = string[];

type IFilesTagsState = {
  [key: string]: string[];
};

const tags: ITagData = {};
const files: IFilesTagsState = {};

export const INTERNAL_TAG_PREFIX = '_i_';
export const INTERNAL_TAGS = {
  read: INTERNAL_TAG_PREFIX + 'read',
  reading: INTERNAL_TAG_PREFIX + 'reading',
  unread: INTERNAL_TAG_PREFIX + 'unread',
};

const generateInternalTags = (file: IFile) => {
  const toReturn = new Set<string>();

  if (file.read) {
    file.read.forEach((dates) => {
      if (dates.finished) {
        toReturn.add(INTERNAL_TAGS.read);
      } else {
        toReturn.add(INTERNAL_TAGS.reading);
      }
    });
  }

  if (toReturn.size === 0) return [INTERNAL_TAGS.unread];

  return Array.from(toReturn);
};

const getTagPaths = (tag: string) => {
  if (!tags[tag]) throw 'Trying to load non existing tag';
  return Array.from(tags[tag]);
};

const getTags = (): ITags => {
  return Object.keys(tags).filter((tag) => !tag.startsWith(INTERNAL_TAG_PREFIX));
};

const addFile = (tag: string, path: string) => {
  if (!tags[tag]) {
    tags[tag] = new Set();
  }
  tags[tag].add(path);
};

const removeFile = (tag: string, path: string) => {
  if (!tags[tag]) return;

  tags[tag].delete(path);

  if (tags[tag].size === 0) removeTag(tag);
};

const removeTag = (tag: string) => {
  if (!tags[tag]) return;
  delete tags[tag];
};

const sendUpdates = _debounce(() => WebContentsProxy.TAGS_UPDATE(getTags()), 250);

const processAddedFile = (file: ISavedFile) => {
  const tags = file.tags || [];

  tags.push(...generateInternalTags(file));

  if (!tags.length) return;
  tags.forEach((tag) => addFile(tag, file.path));
  files[file.path] = tags;
  sendUpdates();
};

const processUpdatedFile = (file: ISavedFile) => {
  const tags = file.tags || [];

  const internal = generateInternalTags(file);

  tags.push(...internal);

  const added = _difference(tags, files[file.path]);
  const removed = _difference(files[file.path], tags);

  if (!added.length && !removed.length) return;

  added.forEach((tag) => addFile(tag, file.path));
  removed.forEach((tag) => removeFile(tag, file.path));

  files[file.path] = tags;
  sendUpdates();

  OpenedTabs.forEach((item, index) => {
    if (item.type === 'tag') {
      if (added.includes(item.thing)) {
        WebContentsProxy.FILE_ADD(file, [index]);
      }
      if (removed.includes(item.thing)) {
        WebContentsProxy.FILE_REMOVE(file.path, [index]);
      }
    }
  });
};

const processDeletedFile = (path: string) => {
  if (!files[path]) return;

  files[path].forEach((tag) => removeFile(tag, path));
  delete files[path];

  sendUpdates();
};

const addFilesBatch = (filesArray: ISavedFile[]) => {
  filesArray.forEach((file) => processAddedFile(file));
};

const hasTag = (tag: string, path: string): boolean => {
  if (!tags[tag]) return false;

  return tags[tag].has(path);
};

const getRelevantIndexes = (pathInQuestion: string): number[] => {
  const relevantTo: number[] = [];

  OpenedTabs.forEach((openedEntry, index) => {
    if (openedEntry.type === 'tag') {
      if (hasTag(openedEntry.thing, pathInQuestion)) {
        relevantTo.push(index);
      }
    }
  });
  return relevantTo;
};

export const TagUpdates: IWatcherModule = {
  initialFiles(files) {
    addFilesBatch(files);
  },
  addFile(file) {
    processAddedFile(file);
    const relevantIndexex = getRelevantIndexes(file.path);
    if (relevantIndexex.length) WebContentsProxy.FILE_ADD(file, relevantIndexex);
  },
  changeFile(file) {
    processUpdatedFile(file);
  },
  unlinkFile(path) {
    const relevantIndexex = getRelevantIndexes(path);
    if (relevantIndexex.length) WebContentsProxy.FILE_REMOVE(path, relevantIndexex);
    processDeletedFile(path);
  },
};

export default {
  processAddedFile,
  processDeletedFile,
  processUpdatedFile,
  addFilesBatch,
  getTags,
  getTagPaths,
  hasTag,
};
