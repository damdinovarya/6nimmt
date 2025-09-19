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

      {error && <div className="lobby-error">{error}</div>}
    </div>
  );
};

export default GameLobby;
