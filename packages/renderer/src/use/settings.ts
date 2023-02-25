import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { trpcApi } from '../utils/trpc';
import type { ISettings } from '/@main/services/settings';

export const useSettings = () => {
  const qc = useQueryClient();

  const { isLoading, data } = useQuery({
    queryFn: async () => {
      return await trpcApi.getSettings.query();
    },
    queryKey: ['settings'],
  });

  const mutation = useMutation({
    mutationFn: async (settings: ISettings) => {
      return await trpcApi.saveSettings.mutate(settings);
    },
    onSuccess: () => {
      qc.invalidateQueries(['settings']);
    },
  });

  const changeSettings = mutation.mutate;

  return { settings: data, isLoading, changeSettings };
};
