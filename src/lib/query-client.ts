import { QueryClient } from "@tanstack/react-query";
import { toAppError } from "~/types/errors";
import { useUIStore } from "~/stores/ui.store";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 2,
    },
    mutations: {
      onError: (error) => {
        const { message } = toAppError(error);
        useUIStore.getState().addToast(message, "error");
      },
    },
  },
});
