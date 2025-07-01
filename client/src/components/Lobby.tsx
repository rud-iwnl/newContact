import React from 'react';

interface Player {
  id: string;
  name: string;
  avatar?: string;
  profileBorder?: string;
  profileBg?: string;
  profileStatus?: string;
  profileEmoji?: string;
}

interface LobbyProps {
  myLobbyCode: string;
  players: Player[];
  hostId: string | null;
  myId: string | null;
  theme: string;
  setTheme: (theme: string) => void;
  handleChangeHost: (id: string) => void;
}

const Lobby: React.FC<LobbyProps> = ({
  myLobbyCode,
  players,
  hostId,
  myId,
  theme,
  setTheme,
  handleChangeHost,
}) => {
  const isHost = hostId === myId;
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Лобби: {myLobbyCode}</h2>
        <button
          aria-label="Переключить тему"
          className="ml-2 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {theme === "dark" ? "🌙" : "☀️"}
        </button>
      </div>
      <div className="flex flex-wrap gap-2 items-center">
        {players.map((p) => (
          <div key={p.id} className={`flex flex-col items-center p-1 rounded-xl border ${hostId === p.id ? 'border-yellow-400' : p.profileBorder || 'border-blue-400'} bg-white/80 dark:bg-gray-700/80 shadow-sm w-24`}>
            <span className="block w-12 h-12 mt-1 mb-1">
              {p.avatar ? (
                <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-full object-cover border-2 mx-auto" />
              ) : (
                <span className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl mx-auto border-2 ${p.profileBg || 'bg-blue-400'} ${p.profileBorder || 'border-blue-400'}`}>{p.profileEmoji || '😀'}</span>
              )}
            </span>
            <span className="text-gray-900 dark:text-gray-100 text-xs font-medium truncate w-full text-center">{p.name}</span>
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
    </div>
  );
};

export default Lobby; 