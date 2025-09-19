export interface Card {
  number: number;
  penaltyPoints: number;
}

export interface Player {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
  penaltyScore: number;
  hand: Card[];
  selectedCard?: number;
  hasSubmittedCard: boolean;
}

export interface GameState {
  phase: "waiting" | "playing" | "round-reveal" | "selecting-row" | "finished";
  rows: Card[][];
  deck: Card[];
  roundCards: { playerId: string; card: Card }[];
  playerToSelectRow?: string;
  round: number;
  maxRounds: number;
}

export interface GameRoom {
  id: string;
  players: Map<string, Player>;
  gameState: GameState;
  maxPlayers: number;
}

// No hand
export interface PublicPlayer {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
  penaltyScore: number;
  hasSubmittedCard: boolean;
}

// No deck, no picked cards
export interface PublicGameState {
  phase: GameState["phase"];
  rows: Card[][];
  roundCards: { playerId: string; card?: Card }[];
  playerToSelectRow?: string;
  round: number;
  maxRounds: number;
}

export interface ServerToClientEvents {
  room_created: (data: { roomId: string; playerId: string }) => void;
  room_joined: (data: { roomId: string; playerId: string }) => void;
  room_error: (data: { message: string }) => void;
  game_state_update: (data: {
    players: PublicPlayer[];
    gameState: PublicGameState;
    roomId: string;
  }) => void;
  game_started: () => void;
  your_hand: (hand: Card[]) => void;
  game_over: (data: { winner: PublicPlayer | null }) => void;
  game_aborted: (data: { reason: string }) => void;
  player_left: (data: { playerName: string }) => void;
}

export interface ClientToServerEvents {
  create_room: (data: { playerName: string }) => void;
  join_room: (data: { playerName: string; roomId: string }) => void;
  leave_room: () => void;
  player_ready: () => void;
  start_game: () => void;
  select_card: (data: { card: number }) => void;
  submit_card: () => void;
  select_row: (data: { row: number }) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  playerId: string;
  playerName: string;
  roomId?: string;
}
