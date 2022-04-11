import type { IOpened } from '/@main/watcher/openedTabs';

const capitalize = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export default function formatHeader(opened: IOpened, rootPath: string) {
  if (!opened) return '';
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

  if (opened.type === 'innerPage') {
    return capitalize(opened.thing);
  }

  return '';
}
