import type { ElementHandle } from 'playwright';

export const getFileTreeMenu = async (appEl: ElementHandle) => {
  const roots = await appEl.$$('.T-file-tree-item');

  const menu = Promise.all(
    roots.map(async (element) => {
      const labelEL = await element.$('.T-file-tree-label');
      const label = labelEL === null ? '=TEST NAME GETTER ERROR=' : await labelEL.innerText();
      return { element, label };
    }),
  );

  return menu;
};
