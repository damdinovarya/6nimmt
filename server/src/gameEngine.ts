import { Card, GameRoom, Player } from "../../shared/types";

const ROWS_COUNT = 4;
const ROW_CAPACITY = 5;
const HAND_SIZE = 10;
const DECK_SIZE = 104;

export class GameEngine {
  static calculatePenaltyPoints(cardNumber: number): number {
    if (cardNumber === 55) {
      return 7;
    }
    if (cardNumber % 11 === 0) {
      return 5;
    }
    if (cardNumber % 10 === 0) {
      return 3;
    }
    if (cardNumber % 5 === 0) {
      return 2;
    }
    return 1;
  }

  static generateDeck(): Card[] {
    const cards: Card[] = [];

    for (let i = 1; i <= DECK_SIZE; i++) {
      const penaltyPoints = this.calculatePenaltyPoints(i);
      cards.push({ number: i, penaltyPoints });
    }

    return cards;
  }

  static shuffleDeck(deck: Card[]): Card[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static dealCards(room: GameRoom): void {
    const deck = this.shuffleDeck(this.generateDeck());
    const players = Array.from(room.players.values());

    players.forEach((player, playerIndex) => {
      player.hand = deck.slice(
        playerIndex * HAND_SIZE,
        (playerIndex + 1) * HAND_SIZE
      );
      player.selectedCard = undefined;
      player.hasSubmittedCard = false;
    });

    const rowCards = deck.slice(
      players.length * HAND_SIZE,
      players.length * HAND_SIZE + ROWS_COUNT
    );
    room.gameState.rows = rowCards.map((card) => [card]);

    // Store remaining deck
    room.gameState.deck = deck.slice(players.length * HAND_SIZE + ROWS_COUNT);
  }

  static allPlayersSubmitted(room: GameRoom): boolean {
    return Array.from(room.players.values()).every(
      (player) => player.hasSubmittedCard
    );
  }

  static resolveRound(room: GameRoom): { playersToSelectRow: string[] } {
    const roundCards = room.gameState.roundCards;
    const playersToSelectRow: string[] = [];

    const sortedCards = [...roundCards].sort(
      (a, b) => a.card.number - b.card.number
    );

    for (const { playerId, card } of sortedCards) {
      const player = room.players.get(playerId);
      if (!player) {
        continue;
      }

      const result = this.placeCard(room, card, playerId);

      if (result.mustSelectRow) {
        playersToSelectRow.push(playerId);
        room.gameState.playerToSelectRow = playerId;
        break;
      }
    }

    return { playersToSelectRow };
  }

  // Place a card according to 6nimmt rules
  static placeCard(
    room: GameRoom,
    card: Card,
    playerId: string
  ): { mustSelectRow: boolean; rowTaken?: number } {
    const rows = room.gameState.rows;
    const player = room.players.get(playerId);
    if (!player) {
      return { mustSelectRow: false };
    }

    // Rule 2: Find row with minimum difference
    const rowDiff = (card: Card, row: Card[]): number => {
      const lastCard = row[row.length - 1];
      return card.number > lastCard.number
        ? card.number - lastCard.number
        : Infinity;
    };

    let bestRowIndex = -1;
    let bestDiff = Infinity;
    for (let i = 0; i < rows.length; i++) {
      const diff = rowDiff(card, rows[i]);
      if (diff < bestDiff) {
        bestRowIndex = i;
        bestDiff = diff;
      }
    }

    // Rule 4: Card too small - must select a row
    if (bestRowIndex === -1) {
      return { mustSelectRow: true };
    }

    // Place card in the best row
    const bestRow = rows[bestRowIndex];

    // Rule 3: Sixth card - player takes the row
    if (bestRow.length === ROW_CAPACITY) {
      // Player takes penalty points from the row
      const penaltyPoints = bestRow.reduce(
        (sum, c) => sum + c.penaltyPoints,
        0
      );
      player.penaltyScore += penaltyPoints;

      // Clear the row and place the new card
      rows[bestRowIndex] = [card];

      return { mustSelectRow: false, rowTaken: bestRowIndex };
    } else {
      // Normal placement
      rows[bestRowIndex].push(card);
      return { mustSelectRow: false };
    }
  }

  // Player selects a row to take
  static playerSelectsRow(
    room: GameRoom,
    playerId: string,
    rowIndex: number
  ): boolean {
    const player = room.players.get(playerId);
    if (!player || room.gameState.playerToSelectRow !== playerId) {
      return false;
    }

    const row = room.gameState.rows[rowIndex];
    if (!row) {
      return false;
    }

    const penaltyPoints = row.reduce((sum, c) => sum + c.penaltyPoints, 0);
    player.penaltyScore += penaltyPoints;

    const playerCardEntry = room.gameState.roundCards.find(
      (c) => c.playerId === playerId
    );
    if (!playerCardEntry) {
      return false;
    }

    room.gameState.rows[rowIndex] = [playerCardEntry.card];

    room.gameState.playerToSelectRow = undefined;

    const remainingCards = room.gameState.roundCards
      .filter((c) => c.playerId !== playerId)
      .sort((a, b) => a.card.number - b.card.number);

    // If another player needs to select a row
    for (const { playerId, card } of remainingCards) {
      const result = this.placeCard(room, card, playerId);
      if (result.mustSelectRow) {
        room.gameState.playerToSelectRow = playerId;
        return true;
      }
    }

    return true;
  }

  // Check if the game is over
  static isGameOver(room: GameRoom): boolean {
    return room.gameState.round > room.gameState.maxRounds;
  }

  // Get game winner (player with lowest penalty score)
  static getWinner(room: GameRoom): Player | null {
    const players = Array.from(room.players.values());
    if (players.length === 0) return null;

    return players.reduce((winner, player) =>
      player.penaltyScore < winner.penaltyScore ? player : winner
    );
  }

  // Reset round state
  static resetRound(room: GameRoom): void {
    room.gameState.roundCards = [];
    room.gameState.playerToSelectRow = undefined;

    // Reset player submission state
    Array.from(room.players.values()).forEach((player) => {
      player.selectedCard = undefined;
      player.hasSubmittedCard = false;
    });
  }

  // Initialize game state
  static initializeGame(room: GameRoom): void {
    room.gameState = {
      phase: "playing",
      rows: [],
      deck: [],
      roundCards: [],
      round: 1,
      maxRounds: 10,
    };

    // Reset player scores
    Array.from(room.players.values()).forEach((player) => {
      player.penaltyScore = 0;
      player.hand = [];
      player.selectedCard = undefined;
      player.hasSubmittedCard = false;
    });

    this.dealCards(room);
  }
}
