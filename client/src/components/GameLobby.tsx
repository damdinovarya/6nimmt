import { useState } from "react";
import "./styles/GameLobby.css";

interface Props {
  onJoinRoom: (name: string, code: string) => void;
  onCreateRoom: (name: string) => void;
  error: string;
}

const GameLobby = ({ onJoinRoom, onCreateRoom, error }: Props) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const handleJoin = () => {
    if (!name || !code) {
      return;
    }
    onJoinRoom(name.trim(), code.trim());
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      return;
    }
    onCreateRoom(name.trim());
  };

  return (
    <div className="game-lobby">
      <h1 className="lobby-title">Корова 006</h1>

      <div className="lobby-form">
        <input
          className="input"
          placeholder="Ваше имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="input"
          placeholder="Код комнаты"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />

        <div className="lobby-buttons">
          <button className="btn btn--success" onClick={handleJoin}>
            Войти в комнату
          </button>

          <button className="btn btn--primary" onClick={handleCreate}>
            Создать комнату
          </button>
        </div>
      </div>

      <div className="lobby-rules">
        <h2>Правила игры</h2>
        <p>
          В игре участвуют карты с номерами от 1 до 104. Каждая карта имеет
          штрафные очки ("коровы").
        </p>
        <ul>
          <li>В начале раунда каждому игроку раздаётся по 10 карт.</li>
          <li>На стол выкладываются 4 стартовых ряда (по одной карте).</li>
          <li>
            Все игроки одновременно выбирают по одной карте и вскрывают их.
          </li>
          <li>Карты по возрастанию добавляются в ряды:</li>
          <ul>
            <li>
              Если карта больше последней карты ряда — кладётся в этот ряд.
            </li>
            <li>
              Если подходит в несколько рядов — кладётся в тот, где разница
              минимальна.
            </li>
            <li>
              Если карта меньше всех последних карт — игрок обязан забрать весь
              ряд, а его карта становится первой.
            </li>
          </ul>
          <li>
            Если игрок кладёт 6-ю карту в ряд — он забирает все 5 предыдущих, а
            его карта остаётся.
          </li>
        </ul>
        <p>
          Цель: собрать как можно меньше штрафных очков. Побеждает игрок с
          наименьшей суммой после всех раундов.
        </p>
      </div>

      {error && <div className="lobby-error">{error}</div>}
    </div>
  );
};

export default GameLobby;
