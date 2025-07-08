import React, { useState } from 'react';

interface Player {
  id: string;
  name: string;
  avatar?: string;
  profileBorder?: string;
  profileBg?: string;
  profileStatus?: string;
  profileEmoji?: string;
  score?: number;
}

interface LobbyProps {
  myLobbyCode: string;
  players: Player[];
  hostId: string | null;
  myId: string | null;
  theme: string;
  setTheme: (theme: string) => void;
  handleChangeHost: (id: string) => void;
  handleLeaveLobby: () => void;
  duoMode?: boolean;
}

const Lobby: React.FC<LobbyProps> = ({
  myLobbyCode,
  players,
  hostId,
  myId,
  theme,
  setTheme,
  handleChangeHost,
  handleLeaveLobby,
  duoMode = false,
}) => {
  const isHost = hostId === myId;
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (myLobbyCode) {
      navigator.clipboard.writeText(myLobbyCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };
  return (
    <div>
      <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center mb-1 gap-2 xs:gap-0">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Лобби: <span className="tracking-wider font-mono">{myLobbyCode}</span></h2>
          {duoMode && (
            <span className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full font-semibold">
              🥊 Дуэль
            </span>
          )}
          <button
            type="button"
            aria-label="Скопировать код лобби"
            className="p-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition text-xs border border-blue-300 dark:border-blue-700"
            onClick={handleCopy}
            tabIndex={0}
          >
            {copied ? '✓' : '⧉'}
          </button>
        </div>
        <button
          aria-label="Переключить тему"
          className="ml-0 xs:ml-2 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition self-start xs:self-auto"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "🌙" : "☀️"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2 items-center justify-center xs:justify-start">
        {players.map((p) => (
          <div key={p.id} className={`flex flex-col items-center p-1 rounded-xl border ${hostId === p.id ? 'border-yellow-400' : p.profileBorder || 'border-blue-400'} bg-white/80 dark:bg-gray-700/80 shadow-sm w-20 xs:w-24`}>
            <span className="block w-10 h-10 xs:w-12 xs:h-12 mt-1 mb-1">
              {p.avatar ? (
                <img src={p.avatar} alt={p.name} className="w-10 h-10 xs:w-12 xs:h-12 rounded-full object-cover border-2 mx-auto" />
              ) : (
                <span className={`w-10 h-10 xs:w-12 xs:h-12 rounded-full flex items-center justify-center text-white text-xl xs:text-2xl mx-auto border-2 ${p.profileBg || 'bg-blue-400'} ${p.profileBorder || 'border-blue-400'}`}>{p.profileEmoji || '😀'}</span>
              )}
            </span>
            <span className="text-gray-900 dark:text-gray-100 text-xs font-medium truncate w-full text-center">{p.name}</span>
            {typeof p.score === 'number' && (
              <span className="text-xs text-blue-600 dark:text-blue-300 font-bold w-full text-center">🏆 {p.score}</span>
            )}
            {p.profileStatus && <span className="text-[10px] text-gray-500 italic truncate w-full text-center">{p.profileStatus}</span>}
            {hostId === p.id && <span className="text-[10px] text-yellow-500 font-bold">Ведущий</span>}
            {isHost && p.id !== myId && (
              <button
                className="mt-1 px-1 py-0.5 text-[10px] rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 hover:bg-yellow-200 dark:hover:bg-yellow-800 transition"
                onClick={() => handleChangeHost(p.id)}
              >
                Сделать ведущим
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-2">
        <button
          className="px-3 py-1 rounded bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-100 hover:bg-red-300 dark:hover:bg-red-600 text-xs font-semibold"
          onClick={handleLeaveLobby}
        >
          Выйти из лобби
        </button>
      </div>
    </div>
  );
};

export default Lobby; 