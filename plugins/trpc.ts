import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';
import type { AppRouter } from '~/server/trpc/api';
import { createTRPCProxyClient } from '@trpc/client';
import { ipcLink } from 'electron-trpc/renderer';

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;

export default defineNuxtPlugin({
  name: 'trpc',
  setup: () => {
    const trpc = createTRPCProxyClient<AppRouter>({
      links: [ipcLink()],
    });

    return {
      provide: {
        trpc,
      },
    };
  },
});
