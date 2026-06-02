import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addBookToListFn } from "../list.queries";

export function useAddBookToList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      listId,
      bookId,
      position,
    }: {
      listId: string;
      bookId: string;
      position: number;
    }) => addBookToListFn(listId, bookId, position),
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ["lists", "user"] });
    },
  });
}
