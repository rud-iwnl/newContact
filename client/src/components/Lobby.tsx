import React, { useState } from 'react';

// Функция генерации эмодзи по нику
function getEmojiAvatar(name: string) {
  const emojis = [
    '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😜','😝','😛','🤑','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','🥱','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🫠','🫥','🫡','🫢','🫣','🫤','🫦','🫧','🫨','🫩','🫪','🫫','🫬','🫭','🫮','🫯','🫰','🫱','🫲','🫳','🫴','🫵','🫶','🫷','🫸','🫹','🫺','🫻','🫼','🫽','🫾','🫿','🬀','🬁','🬂','🬃','🬄','🬅','🬆','🬇','🬈','🬉','🬊','🬋','🬌','🬍','🬎','🬏','🬐','🬑','🬒','🬓','🬔','🬕','🬖','🬗','🬘','🬙','🬚','🬛','🬜','🬝','🬞','🬟','🬠','🬡','🬢','🬣','🬤','🬥','🬦','🬧','🬨','🬩','🬪','🬫','🬬','🬭','🬮','🬯','🬰','🬱','🬲','🬳','🬴','🬵','🬶','🬷','🬸','🬹','🬺','🬻','🬼','🬽','🬾','🬿','🭀','🭁','🭂','🭃','🭄','🭅','🭆','🭇','🭈','🭉','🭊','🭋','🭌','🭍','🭎','🭏','🭐','🭑','🭒','🭓','🭔','🭕','🭖','🭗','🭘','🭙','🭚','🭛','🭜','🭝','🭞','🭟','🭠','🭡','🭢','🭣','🭤','🭥','🭦','🭧','🭨','🭩','🭪','🭫','🭬','🭭','🭮','🭯','🭰','🭱','🭲','🭳','🭴','🭵','🭶','🭷','🭸','🭹','🭺','🭻','🭼','🭽','🭾','🭿','🯀','🯁','🯂','🯃','🯄','🯅','🯆','🯇','🯈','🯉','🯊','🯋','🯌','🯍','🯎','🯏','🯐','🯑','🯒','🯓','🯔','🯕','🯖','🯗','🯘','🯙','🯚','🯛','🯜','🯝','🯞','🯟','🯠','🯡','🯢','🯣','🯤','🯥','🯦','🯧','🯨','🯩','🯪','🯫','🯬','🯭','🯮','🯯','🯰','🯱','🯲','🯳','🯴','🯵','🯶','🯷','🯸','🯹','🯺','🯻','🯼','🯽','🯾','🯿'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % emojis.length;
  return emojis[idx];
}

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
          <div key={p.id} className="bg-white dark:bg-gray-800 rounded-lg p-2 xs:p-3 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-1 min-w-0">
            <div className="relative">
              {p.avatar ? (
                <img src={p.avatar} alt="avatar" className={`w-12 h-12 xs:w-14 xs:h-14 rounded-full object-cover border-2 ${p.profileBorder || 'border-gray-300'} ${p.profileBg || 'bg-gray-300'}`} />
              ) : (
                <span className={`w-12 h-12 xs:w-14 xs:h-14 rounded-full flex items-center justify-center text-white text-xl xs:text-2xl border-2 ${p.profileBorder || 'border-gray-300'} ${p.profileBg || 'bg-gray-300'}`}>
                  {p.profileEmoji || getEmojiAvatar(p.name)}
                </span>
              )}
              {p.id === hostId && !duoMode && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">👑</span>
              )}
            </div>
            <span className="text-gray-900 dark:text-gray-100 text-xs font-medium truncate w-full text-center">{p.name}</span>
            {typeof p.score === 'number' && (
              <span className="text-xs text-blue-600 dark:text-blue-300 font-bold w-full text-center">🏆 {p.score}</span>
            )}
            {p.profileStatus && <span className="text-[10px] text-gray-500 italic truncate w-full text-center">{p.profileStatus}</span>}
            {p.id === myId && <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">(Вы)</span>}
            {p.id === hostId && !duoMode && <span className="text-xs text-yellow-600 dark:text-yellow-400 font-semibold">(Ведущий)</span>}
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