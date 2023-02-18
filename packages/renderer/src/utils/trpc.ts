import { createTRPCProxyClient } from '@trpc/client';
import { ipcLink } from 'electron-trpc/renderer';
import type { AppRouter } from '/@main/ipc/api';

export const trpcApi = createTRPCProxyClient<AppRouter>({
  links: [ipcLink()],
});
