import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { toast } from 'vue-sonner';

type ErrorFromRust = {
  title: string;
  description: string;
  actionInvoke: string;
  actionLabel: string;
};

type EventPayloads = {
  file_remove: string;
  file_add: IBookFromDb;
  file_update: IBookFromDb;
  folder_add: string;
  folder_remove: string;
  error_happened: ErrorFromRust;
};

export const handleErrorsFromRust = () => {
  const handler = (e: ErrorFromRust) => {
    toast.error(e.title, {
      description: e.description,

      duration: Infinity,
      closeButton: true,
      action: e.actionInvoke
        ? {
            label: e.actionLabel,
            onClick: () => invoke(e.actionInvoke),
          }
        : undefined,
    });
  };
  useListenToEvent('error_happened', handler);
};

export const useListenToEvent = <E extends keyof EventPayloads>(
  name: E,
  callback: (v: EventPayloads[E]) => void | Promise<void>,
) => {
  const u = ref<UnlistenFn>();

  onMounted(async () => {
    u.value = await listen(name, (event) => {
      callback(event.payload as EventPayloads[E]);
    });
  });

  onBeforeUnmount(async () => {
    if (u.value) {
      await u.value();
    }
  });
};

export type AttrValue = {
  Text: string;
  TextCollection: string[];
  Number: number;
  DatesPairCollection: {
    started?: string | undefined;
    finished?: string | undefined;
  }[];
};

export type SchemaItem = {
  Name: string;
  Value: keyof AttrValue;
};

export interface IBookFromDb {
  path: string;
  modified: string;
  markdown: string;

  attrs: Record<string, AttrValue>;
}
