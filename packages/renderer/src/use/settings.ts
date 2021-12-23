import type { ILocalSettings } from '/@main/services/settings';
import { useElectron } from '/@/use/electron';

const api = useElectron();

let currentSettings: ILocalSettings | null = null;

const updateSettings = (settings: ILocalSettings) => {
  currentSettings = settings;
};

const initSettings = async () => {
  await api.subscriptions.SETTINGS_UPDATE(updateSettings);

  const start = await api.settings.getSettings();

  updateSettings(start);
};

const getSettings = () => {
  if (!currentSettings) throw 'Trying to acess settings before init';
  return currentSettings;
};

const saveSettings = (newSettings: ILocalSettings) => {
  api.settings.saveSettings(newSettings);
};

export default { initSettings, getSettings, saveSettings };
