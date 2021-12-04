import type { ISavedFile } from './files';

import _difference from 'lodash-es/difference';
import _debounce from 'lodash-es/debounce';
import WebContentsProxy from '../ipc/webContents';
import type { IOpened } from './watcher';

export type ITagData = {
  [key: string]: Set<string>;
};

export type ITags = string[];

type IFilesTagsState = {
  [key: string]: string[];
};

const tags: ITagData = {};
const files: IFilesTagsState = {};

const getTagPaths = (tag: string) => {
  if (!tags[tag]) throw 'Trying to load non existing tag';
  return Array.from(tags[tag]);
};

const getTags = (): ITags => {
  console.log('getting tags', Object.keys(tags));
  return Object.keys(tags);
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

const sendUpdates = _debounce(() =>  WebContentsProxy.TAGS_UPDATE(getTags()), 250);

const processAddedFile = (file: ISavedFile) => {
  if (!file.tags) return;
  file.tags.forEach((tag) => addFile(tag, file.path));
  files[file.path] = file.tags;
  sendUpdates();
};

const processUpdatedFile = (file: ISavedFile, opened: IOpened | null) => {
  const tags = file.tags || [];

  const added = _difference(tags, files[file.path]);
  const removed = _difference(files[file.path], tags);

  added.forEach((tag) => addFile(tag, file.path));
  removed.forEach((tag) => removeFile(tag, file.path));

  files[file.path] = tags;
  sendUpdates();

  if (opened && opened.type === 'tag') {
    if (added.includes(opened.thing)) {
      WebContentsProxy.FILE_ADD(file.path, file);
    }
    if (removed.includes(opened.thing)) {
      WebContentsProxy.FILE_REMOVE(file.path);
    }
  }
};

const processDeletedFile = (path: string) => {
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

export default {
  processAddedFile,
  processDeletedFile,
  processUpdatedFile,
  addFilesBatch,
  getTags,
  getTagPaths,
  hasTag,
};
