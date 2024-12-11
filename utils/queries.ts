import { c_get_schemas } from '~/api/tauriActions';

export const useUsableSchemas = () => {
  return useQuery({
    key: ['schemas', 'get'],
    query: c_get_schemas,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });
};
