import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import type { Ref } from 'vue';
import { trpcApi } from '../utils/trpc';

export const useRootPath = () => {
  const qc = useQueryClient();

  const { isLoading, data } = useQuery({
    queryFn: async () => {
      return await trpcApi.getRootPath.query();
    },
    queryKey: ['rootPath'],
  });

  const mutation = useMutation({
    mutationFn: async () => {
      return await trpcApi.setRootPath.mutate();
    },
    onSuccess: () => {
      qc.invalidateQueries(['rootPath']);
    },
  });

  const changeRootPath = mutation.mutate;

  return { rootPath: data, isLoading, changeRootPath };
};

export const useRootPathSafe = () => {
  const { rootPath, isLoading, changeRootPath } = useRootPath();

  if (!rootPath.value) {
    throw new Error('CLIENTSIDE: Trying to acess root path before it is present');
  }

  const rp = rootPath as Ref<string>;

  return { rootPath: rp, isLoading, changeRootPath };
};
