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

interface ChatProps {
  isGameStarted: boolean;
  displayWord: string;
  wordLength: number;
  chat: any[];
  players: Player[];
  myId: string | null;
  newMsgIds: string[];
  isHost: boolean;
  usedContacts: string[];
  isWordUsed: (w: string) => boolean;
  handleContact: (id: string) => void;
  handleReaction: (id: string, reaction: string | null) => void;
  chatInput: string;
  setChatInput: (v: string) => void;
  chatInputRef: React.RefObject<HTMLInputElement | null>;
  handleSendMessage: (e: React.FormEvent) => void;
  chatError: string | null;
}

const REACTIONS = [
  { key: 'like', emoji: '✅' },
  { key: 'dislike', emoji: '❌' },
];

function getEmojiAvatar(name: string) {
  const emojis = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😜','😝','😛','🤑','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','🥱','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🫠','🫥','🫡','🫢','🫣','🫤','🫦'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % emojis.length;
  return emojis[idx];
}

const Chat: React.FC<ChatProps> = ({
  isGameStarted,
  displayWord,
  wordLength,
  chat,
  players,
  myId,
  newMsgIds,
  isHost,
  usedContacts,
  isWordUsed,
  handleContact,
  handleReaction,
  chatInput,
  setChatInput,
  chatInputRef,
  handleSendMessage,
  chatError,
}) => {
  const chatEndRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat]);

  return (
    <>
      {isGameStarted && (
        <div className="mb-2 text-center">
          <div className="text-2xl font-mono tracking-widest text-blue-700 dark:text-blue-300 font-bold animate-fade-in">
            {displayWord}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Длина слова: {wordLength}</div>
        </div>
      )}
      {isGameStarted && (
        <div className="flex-1 flex flex-col">
          <div className="h-48 md:h-64 overflow-y-auto bg-gray-50 dark:bg-gray-700 rounded-xl p-2 mb-2 flex flex-col gap-2 shadow-inner border border-gray-200 dark:border-gray-600">
            {chat.length === 0 && <div className="text-gray-400 text-center">Нет сообщений</div>}
            {chat.map((msg, idx) => {
              const likes = (Object.values(msg.reactions || {}) as string[]).filter(r => r === 'like').length;
              const dislikes = (Object.values(msg.reactions || {}) as string[]).filter(r => r === 'dislike').length;
              const myReaction = msg.reactions?.[myId || ''] || null;
              const user = players.find(p => p.id === msg.userId);
              return (
                <div key={msg.id} className={`flex items-center gap-2 rounded-lg px-2 py-1 bg-white/80 dark:bg-gray-800/80 shadow-sm ${newMsgIds.includes(msg.id) ? 'ring-2 ring-blue-300 dark:ring-blue-600' : ''}`}>
                  {/* Аватар */}
                  <span className="w-8 h-8 flex items-center justify-center">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-gray-300 dark:border-gray-600" />
                    ) : (
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-lg border ${user?.profileBg || 'bg-blue-400'} ${user?.profileBorder || 'border-blue-400'}`}>{user?.profileEmoji || getEmojiAvatar(user?.name || '?')}</span>
                    )}
                  </span>
                  {/* Ник и текст */}
                  <div className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold text-gray-700 dark:text-gray-200 truncate">{msg.userName}</span>
                    <span className="block text-sm text-gray-900 dark:text-gray-100 break-words">{msg.text}</span>
                  </div>
                  {/* Кнопка контакт */}
                  {!isHost && msg.userId !== myId && !usedContacts.includes(msg.id) && !isWordUsed(msg.text) && (
                    <button
                      className="ml-1 px-2 py-1 text-xs rounded bg-green-500 text-white hover:bg-green-600 transition whitespace-nowrap"
                      onClick={() => handleContact(msg.id)}
                    >
                      контакт
                    </button>
                  )}
                  {/* Реакции */}
                  <div className="flex items-center gap-1 ml-2 min-w-[48px] md:min-w-[48px] justify-end">
                    {REACTIONS.map(r => {
                      const count = (Object.values(msg.reactions || {}) as string[]).filter((val: string) => val === r.key).length;
                      return (
                        <button
                          key={r.key}
                          className={`text-base p-0.5 ${myReaction === r.key ? 'scale-110' : 'opacity-70'} hover:scale-110 transition`}
                          style={{ minWidth: 22 }}
                          onClick={() => handleReaction(msg.id, myReaction === r.key ? null : r.key)}
                        >
                          {r.emoji}
                          <span className="text-xs align-top ml-0.5">{count > 0 ? count : ''}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>
          {!isHost && (
            <form className="flex gap-2 pb-2 md:pb-0" onSubmit={handleSendMessage}>
              <input
                ref={chatInputRef}
                className="flex-1 px-3 py-3 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-sm"
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                maxLength={40}
                placeholder="Введите ассоциацию..."
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-3 md:py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-base md:text-sm"
                disabled={!chatInput.trim()}
              >
                Отправить
              </button>
            </form>
          )}
          {chatError && (
            <div className="fixed left-0 right-0 bottom-0 z-50 mx-auto w-fit mb-4 px-4 py-2 rounded bg-red-600 text-white text-sm shadow-lg animate-fade-in">
              {chatError}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Chat; 