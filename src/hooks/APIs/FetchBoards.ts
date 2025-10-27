import { BoardModel } from "../../models";
import { getAuthData } from "../../utils/auth";
import { useBoardsStore } from "../../contexts";
import { useCallback, useRef, useState } from "react";

interface FetchBoardsOptions {
  onSuccess?: (boards: BoardModel[]) => void;
  onError?: (error: string) => void;
}

export const useFetchBoards = () => {
  const boardsStore = useBoardsStore();
  const [isFetching, setIsFetching] = useState(false);
  const lastFetchedIdRef = useRef<string | null>(null);

  const fetchBoards = useCallback(
    async (
      organizationId: string,
      options?: FetchBoardsOptions
    ): Promise<void> => {
      const { token, clientId } = getAuthData();
      if (!token || !clientId) {
        console.error("Missing token or clientId");
        return;
      }

      if (!organizationId) {
        console.error("No organizationId provided");
        return;
      }

      setIsFetching(true);
      boardsStore.setLoading(true);
      boardsStore.setError(null);

      try {
        const url = `https://api.trello.com/1/organizations/${organizationId}/boards?key=${clientId}&token=${token}&filter=open`;

        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to fetch boards:", response.status, errorText);
          throw new Error(
            `Failed to fetch: ${response.status} ${response.statusText}`
          );
        }

        const boardModels: BoardModel[] = [];

        // Parse the response JSON
        const trelloBoards = await response.json();

        // Process each board from the API response
        trelloBoards.forEach((board: any) => {
          const boardModel = new BoardModel({
            id: board.id,
            name: board.name,
            desc: board.desc || "",
            organizationId: organizationId,
            closed: board.closed || false,
            url: board.url || "",
          });

          boardsStore.addBoardModel(boardModel);
          boardModels.push(boardModel);
        });

        // Call the success callback if provided
        if (options?.onSuccess) {
          options.onSuccess(boardModels);
        }
      } catch (error) {
        console.error("Error fetching boards:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch boards";
        boardsStore.setError(errorMessage);

        // Call the error callback if provided
        if (options?.onError) {
          options.onError(errorMessage);
        }
      } finally {
        setIsFetching(false);
        boardsStore.setLoading(false);
        lastFetchedIdRef.current = organizationId;
      }
    },
    [boardsStore]
  );

  return { fetchBoards, isFetching };
};
