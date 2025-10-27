import { useBoardsStore } from "../../contexts";
import { getAuthData } from "../../utils/auth";
import { BoardModel } from "../../models";

export const useFetchBoardMeta = () => {
  const boardsStore = useBoardsStore();

  const fetchBoardMeta = async (boardId: string) => {
    // ✅ Already present? then don't fetch again
    if (boardsStore.getBoardById(boardId)) return;

    const { token, clientId } = getAuthData();
    if (!token || !clientId) return;

    try {
      const response = await fetch(
        `https://api.trello.com/1/boards/${boardId}?fields=name,desc,url,closed,idOrganization&key=${clientId}&token=${token}`
      );

      if (!response.ok) return;

      const data = await response.json();

      const boardModel = new BoardModel({
        id: data.id,
        name: data.name,
        desc: data.desc || "",
        organizationId: data.idOrganization || "",
        closed: data.closed || false,
        url: data.url || "",
      });

      boardsStore.addBoardModel(boardModel);
    } catch (err) {
      console.error("Failed to fetch board meta:", err);
    }
  };

  return { fetchBoardMeta };
};
