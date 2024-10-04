import EventEmitter from 'eventemitter3';

export type Events = 'FILE_ADD' | 'FILE_UPDATE' | 'FILE_REMOVE' | 'META_UPDATE' | 'TREE_UPDATE';

export const apiEventsEmitter = new EventEmitter<Events>();

export const useApiEventListener = (event: Events, func: (...v: any[]) => void | Promise<void>) => {
  onBeforeMount(() => {
    apiEventsEmitter.addListener(event, func);
  });

  onUnmounted(() => {
    apiEventsEmitter.removeListener(event, func);
  });
};
