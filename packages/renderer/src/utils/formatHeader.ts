import { useStore } from '../use/store';
import type { IOpened } from '/@main/services/watcher';

export default function formatHeader(opened: IOpened, rootPath: string) {
  if (opened.type === 'folder') {
    if (opened.thing === rootPath) {
      return 'All Books';
    }
    return opened.thing.replace(rootPath + '/', '');
  }

  if (opened.type === 'tag') {
    return '#' + opened.thing;
  }

  if (opened.type === 'file') {
    return opened.thing.split(/[\\/]/).pop();
  }

  if (opened.type === 'newFile') {
    return 'Unsaved File';
  }

  return '';
}
