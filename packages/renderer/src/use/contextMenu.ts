export type ContextButton = {
  label: string;
  handler: () => void;
};

export type ContextMenu = ContextButton[];

export type Handler = (items: ContextMenu, posX: number, posY: number) => void;

let openHandler: Handler;

const registerHandler = (newHandler: Handler) => {
  openHandler = newHandler;
};

const openMenu: Handler = (menuItems, posX, posY) => {
  openHandler(menuItems, posX, posY);
};

export { openMenu, registerHandler };
