import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { initialPlayerState, PlayerState } from "./initial-state/player-state";

const initialState: PlayerState[] = [initialPlayerState];

export const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    addPlayer(state, action: PayloadAction<PlayerState>) {
      state.push(action.payload);
    },
    editPlayer(state, action: PayloadAction<PlayerState & { index: number }>) {
      const { index } = action.payload;
      state[index] = action.payload;
    },
  },
});

export const { addPlayer, editPlayer } = playerSlice.actions;
export const playerReducer = playerSlice.reducer;
export default playerSlice.reducer;