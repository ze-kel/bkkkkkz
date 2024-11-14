import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { toast } from 'vue-sonner';
import { markRaw } from 'vue';

import ErrorToast from '~/components/Error/ErrorToast.vue';

export type ErrorActionCode =
  | 'FileSaveRetry'
  | 'FileSaveRetryForced'
  | 'FileReadRetry'
  | 'InitOnceRetry'
  | 'PrepareCacheRetry'
  | 'WatchPathRetry'
  | 'NoRootPath';

export type ErrorFromRust = {
  isError: boolean;
  title: string;
  info?: string;
  rawError?: string;

  subErrors?: ErrorFromRust[];

  actionLabel?: string;
  actionCode?: ErrorActionCode;
};

export function isOurError(v: unknown): v is ErrorFromRust {
  return Boolean(v && typeof v === 'object' && 'isError' in v && v.isError === true);
}

type EventPayloads = {
  file_remove: string;
  file_add: IBookFromDb;
  file_update: IBookFromDb;
  folder_add: string;
  folder_remove: string;
  error_happened: ErrorFromRust;
};

export const rustErrorNotification = (
  e: ErrorFromRust,
  codeBinds?: Partial<Record<ErrorActionCode, () => void>>,
) => {
  toast.error(e.title, {
    description: markRaw(ErrorToast),
    componentProps: {
      err: e,
    },

    duration: Infinity,
    closeButton: true,
    action: codeBinds &&
      e.actionCode && {
        onClick: codeBinds[e.actionCode],
        label: e.actionLabel || 'Retry',
      },
  });
};

export const handleErrorsFromRust = () => {
  useListenToEvent('error_happened', rustErrorNotification);
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

export type DatePair = {
  started?: string | undefined;
  finished?: string | undefined;
};

export type AttrValue = {
  Text: string;
  TextCollection: string[];
  Date: string;
  DateCollection: string[];
  Number: number;
  NumberDecimal: number;
  DatesPairCollection: DatePair[];
};

export const AttrValueKeys: (keyof AttrValue)[] = [
  'Text',
  'TextCollection',
  'Date',
  'DateCollection',
  'Number',
  'NumberDecimal',
  'DatesPairCollection',
];

export type SchemaItem = {
  name: string;
  value: keyof AttrValue;
  settings: {
    size?: 'S' | 'M' | 'L';
    displayName?: string;
    textFont?: 'Serif' | 'Sans';
    textWeight?: 'Light' | 'Normal' | 'Bold' | 'Black';
    textTheme?: 'Hidden' | 'Default';
    textMultiline?: boolean;

    numberMin?: number;
    numberMax?: number;
    numberStyle?: 'Default' | 'Stars' | 'Slider';
  };
};
export type Schema = {
  items: SchemaItem[];
  internal_name: string;
  name: string;
};

export interface IBookFromDb {
  path: string;
  modified: string;
  markdown: string;

  attrs: Record<string, any>;
}
