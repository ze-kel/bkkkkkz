import { open } from '@tauri-apps/plugin-dialog';
import { TauriStore } from '~/api/tauriStore';

const KEY = 'ROOT_PATH';

const getPathFromUser = async () => {
  if (process.env['FAKE_SET_ROOT_DIR']) {
    return process.env['FAKE_SET_ROOT_DIR'];
  }

  return await open({
    multiple: false,
    directory: true,
  });
};

export const selectAndSetRootPath = async () => {
  const result = await getPathFromUser();
  if (!result) return;

  await TauriStore.set(KEY, result);
  await TauriStore.save();
  return result;
};

export const getRootPath = async () => {
  if (process.env['FORCE_USER_PATH']) {
    return process.env['FORCE_USER_PATH'];
  }

  const res = await TauriStore.get(KEY);

  if (typeof res !== 'string') return null;

  return res;
};
