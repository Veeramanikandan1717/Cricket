interface PlayerState {
  name?: string;
  age?: number;
  position?: number;
  type?: PlayerType;
}

enum PlayerType {
  Batter = "Batter",
  Bowler = "Bowler",
  AllRounder = "AllRounder",
  WicketKeeper = "WicketKeeper",
}

const initialPlayerState: PlayerState = {
  name: "",
  age: 0,
  position: 0,
  type: PlayerType.Batter,
};

export type { PlayerState };
export { PlayerType };
export { initialPlayerState };
