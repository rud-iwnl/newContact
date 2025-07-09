import React from 'react';

interface GameProps {
  isHost: boolean;
  isGameStarted: boolean;
  game: any;
  wordInput: string;
  setWordInput: (v: string) => void;
  handleStartGame: () => void;
  handleSetWord: (e: React.FormEvent) => void;
  gameError: string | null;
  displayWord: string;
  wordLength: number;
  revealed: number;
  contact: any;
  contactTimer: number | null;
  contactWord: string;
  setContactWord: (v: string) => void;
  handleContactWord: (e: React.FormEvent) => void;
  myId: string | null;
  contactInputRef: React.RefObject<HTMLInputElement | null>;
  contactFinished: any;
  isWordUsed: (w: string) => boolean;
  handleConfirmContact: () => void;
  handleRejectContact: () => void;
  canConfirmContact: boolean;
  handleResetGame: () => void;
  contactWords: Record<string, string>;
  players: any[];
  showDuoModal: boolean;
  setShowDuoModal: (v: boolean) => void;
  handleStartDuoGame: (difficulty: 'easy' | 'medium' | 'hard') => void;
}

const Game: React.FC<GameProps & { handleRevealAll?: () => void }> = ({
  isHost,
  isGameStarted,
  game,
  wordInput,
  setWordInput,
  handleStartGame,
  handleSetWord,
  gameError,
  displayWord,
  wordLength,
  revealed,
  contact,
  contactTimer,
  contactWord,
  setContactWord,
  handleContactWord,
  myId,
  contactInputRef,
  contactFinished,
  isWordUsed,
  handleConfirmContact,
  handleRejectContact,
  canConfirmContact,
  handleResetGame,
  contactWords,
  handleRevealAll,
  players,
  showDuoModal,
  setShowDuoModal,
  handleStartDuoGame,
}) => {
  return (
    <div>
      {/* --- ИГРОВОЙ ЭКРАН --- */}
      {isHost && !isGameStarted && (
        <div className="mb-2 xs:mb-4">
          <button
            className="w-full py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 transition mb-1 xs:mb-2"
            onClick={handleStartGame}
          >
            Начать игру
          </button>
          {game?.phase === 'waiting' && (
            <form onSubmit={handleSetWord} className="flex flex-col xs:flex-row gap-2 mt-2">
              <input
                className="flex-1 px-3 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="text"
                value={wordInput}
                onChange={e => setWordInput(e.target.value)}
                maxLength={24}
                placeholder="Загадайте слово..."
                autoFocus
              />
              <button
                type="submit"
                className="w-full xs:w-auto px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
              >
                ОК
              </button>
            </form>
          )}
          {gameError && <div className="text-red-500 text-sm mt-2">{gameError}</div>}
        </div>
      )}
      {!isHost && game?.phase === 'waiting' && (
        <div className="mb-2 xs:mb-4 text-center text-gray-700 dark:text-gray-200">Ведущий готовит игру...</div>
      )}
      {isGameStarted && false && (
        <div className="mb-4 text-center">
          <div className="text-lg font-mono tracking-widest text-gray-900 dark:text-white mb-2 animate-fade-in">
            {game?.word?.split('').map((ch: string, i: number) => (
              <span
                key={i}
                className={
                  i < revealed
                    ? `text-blue-600 dark:text-blue-300 font-bold transition inline-block ${i === revealed - 1 ? 'animate-bounce-letter' : ''}`
                    : 'transition'
                }
              >
                {i < revealed ? ch.toUpperCase() : '_'}{' '}
              </span>
            ))}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Длина слова: {wordLength}</div>
        </div>
      )}
      {/* --- КОНТАКТ --- */}
      {contact && (
        <div className="mb-2 xs:mb-4 p-2 xs:p-4 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 border-2 border-yellow-400 animate-pulse">
          <div className="mb-2 font-semibold">Контакт между игроками{contact.hostInvolved ? ' и ведущим' : ''}</div>
          <div className="mb-2">Осталось времени: <span className="font-mono">{Math.ceil((contactTimer || 0) / 1000)} сек</span></div>
          {/* Если контакт втроём — показываем поля для всех */}
          {contact.hostInvolved ? (
            <>
              <div className="mb-2 text-sm font-semibold text-blue-700 dark:text-blue-200">Все участники должны ввести слово</div>
              <div className="flex flex-col gap-2">
                {/* Поле для текущего игрока (ведущий или игрок) */}
                {([contact.from, contact.to, game?.hostId].includes(myId)) && (
                  <form className="flex flex-col xs:flex-row gap-2 mt-2" onSubmit={handleContactWord}>
                    <input
                      ref={contactInputRef}
                      className="flex-1 px-3 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-sm"
                      type="text"
                      value={contactWord}
                      onChange={e => setContactWord(e.target.value)}
                      maxLength={24}
                      placeholder="Ваше слово..."
                      autoFocus
                      disabled={!!contactWords?.[myId || '']}
                    />
                    <button
                      type="submit"
                      className="w-full xs:w-auto px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-base md:text-sm"
                      disabled={!contactWord.trim() || !!contactWords?.[myId || '']}
                    >
                      Отправить
                    </button>
                  </form>
                )}
                {/* Для остальных участников просто статус */}
                {([contact.from, contact.to, game?.hostId].filter(id => id !== myId)).map(id => (
                  <div key={id} className="text-xs text-gray-700 dark:text-gray-300">
                    {id === game?.hostId ? 'Ведущий' : 'Игрок'}: {contactWords?.[id] ? 'Отправил слово' : 'Ждёт ввода...'}
                  </div>
                ))}
              </div>
            </>
          ) : ([contact.from, contact.to].includes(myId)) ? (
            <>
              <div className="mb-1 text-sm font-semibold text-blue-700 dark:text-blue-200">
                {contactWords?.[myId || ''] ? 'Ждём второго игрока...' : 'Ваш ход! Введите слово'}
              </div>
              <form className="flex flex-col xs:flex-row gap-2 mt-2" onSubmit={handleContactWord}>
                <input
                  ref={contactInputRef}
                  className="flex-1 px-3 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base md:text-sm"
                  type="text"
                  value={contactWord}
                  onChange={e => setContactWord(e.target.value)}
                  maxLength={24}
                  placeholder="Ваше слово..."
                  autoFocus
                  disabled={!!contactWords?.[myId || '']}
                />
                <button
                  type="submit"
                  className="w-full xs:w-auto px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition text-base md:text-sm"
                  disabled={!contactWord.trim() || !!contactWords?.[myId || '']}
                >
                  Отправить
                </button>
              </form>
            </>
          ) : (
            <div className="italic text-sm">Ждём, пока оба игрока введут слово...</div>
          )}
        </div>
      )}
      {/* --- КОНЕЦ КОНТАКТА --- */}
      {/* --- РЕЗУЛЬТАТ КОНТАКТА --- */}
      {contactFinished && (
        <div className="mb-4 p-4 rounded bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100">
          <div className="mb-2 font-semibold">Результат контакта:</div>
          <div className="mb-1">{contactFinished.fromName}: {contactFinished.words?.[contactFinished.from] || <span className="italic text-gray-400">—</span>}</div>
          <div className="mb-1">{contactFinished.toName}: {contactFinished.words?.[contactFinished.to] || <span className="italic text-gray-400">—</span>}</div>
          {contactFinished.hostInvolved && contactFinished.hostName && (
            <div className="mb-1">{contactFinished.hostName}: {contactFinished.words?.[game?.hostId] || <span className="italic text-gray-400">—</span>}</div>
          )}
          {contactFinished.contactResult === 'break' && (
            <div className="text-red-500 font-semibold mt-2">Срыв контакта! Ведущий угадал слово.</div>
          )}
          {contactFinished.cancelled && <div className="text-red-500">Контакт отменён</div>}
          {isHost && !contact && (
            <div className="flex gap-2 mt-2">
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                onClick={handleConfirmContact}
                disabled={!canConfirmContact}
              >
                Подтвердить
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 text-white font-semibold hover:bg-red-700 transition"
                onClick={handleRejectContact}
              >
                Отклонить
              </button>
            </div>
          )}
        </div>
      )}
      {/* Кнопка новой игры при полном открытии слова */}
      {isHost && game?.word && game?.revealed === game?.word.length && (
        <div className="mt-4">
          <button
            className="w-full py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 transition"
            onClick={handleResetGame}
          >
            Начать новую игру
          </button>
        </div>
      )}
      {/* Лог использованных слов */}
      {game?.usedWords?.length > 0 && (
        <div className="mb-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Использованные слова:</div>
          <div className="flex flex-wrap gap-2">
            {game.usedWords.map((w: string, i: number) => (
              <span key={i} className="px-2 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xs">{w}</span>
            ))}
          </div>
        </div>
      )}
      {game?.phase === 'waiting' && (
        <div className="mb-4 text-center animate-fade-in">
          <span className="inline-block px-3 py-1 rounded bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100 font-semibold">Фаза: ожидание слова ведущим</span>
        </div>
      )}
      {game?.phase === 'playing' && (
        <div className="mb-4 text-center animate-fade-in">
          <span className="inline-block px-3 py-1 rounded bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100 font-semibold">Фаза: игра</span>
        </div>
      )}
      {/* Кнопка открыть всё слово для ведущего */}
      {isHost && game?.word && game?.revealed < game?.word.length && !contact && (
        <button
          className="w-full py-2 rounded bg-fuchsia-600 text-white font-semibold hover:bg-fuchsia-700 transition mt-2"
          onClick={handleRevealAll}
        >
          Открыть всё слово (завершить игру)
        </button>
      )}
      {/* Кнопка "Играть вдвоём" для ведущего */}
      {isHost && !isGameStarted && players.length === 2 && (
        <button
          className="w-full py-2 rounded bg-purple-600 text-white font-semibold hover:bg-purple-700 transition mb-2"
          onClick={() => setShowDuoModal(true)}
        >
          🥊 Играть вдвоём
        </button>
      )}
      {/* Модальное окно выбора сложности */}
      {showDuoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center">
              Выберите сложность
            </h3>
            <div className="space-y-3">
              <button
                className="w-full py-3 px-4 rounded bg-green-500 text-white font-semibold hover:bg-green-600 transition"
                onClick={() => handleStartDuoGame('easy')}
              >
                🟢 Легко 
              </button>
              <button
                className="w-full py-3 px-4 rounded bg-yellow-500 text-white font-semibold hover:bg-yellow-600 transition"
                onClick={() => handleStartDuoGame('medium')}
              >
                🟡 Средне 
              </button>
              <button
                className="w-full py-3 px-4 rounded bg-red-500 text-white font-semibold hover:bg-red-600 transition"
                onClick={() => handleStartDuoGame('hard')}
              >
                🔴 Сложно 
              </button>
            </div>
            <button
              className="w-full mt-4 py-2 px-4 rounded bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-400 dark:hover:bg-gray-500 transition"
              onClick={() => setShowDuoModal(false)}
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Game; 