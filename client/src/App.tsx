import React, { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import Lobby from './components/Lobby';
import Game from './components/Game';
import Chat from './components/Chat';

const getInitialTheme = () => {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("theme");
    if (stored) return stored;
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  }
  return "light";
};

// Функция генерации эмодзи по нику
function getEmojiAvatar(name: string) {
  // Простой набор эмодзи (можно расширить)
  const emojis = [
    '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😜','😝','😛','🤑','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','🥱','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🫠','🫥','🫡','🫢','🫣','🫤','🫦','🫧','🫨','🫩','🫪','🫫','🫬','🫭','🫮','🫯','🫰','🫱','🫲','🫳','🫴','🫵','🫶','🫷','🫸','🫹','🫺','🫻','🫼','🫽','🫾','🫿','🬀','🬁','🬂','🬃','🬄','🬅','🬆','🬇','🬈','🬉','🬊','🬋','🬌','🬍','🬎','🬏','🬐','🬑','🬒','🬓','🬔','🬕','🬖','🬗','🬘','🬙','🬚','🬛','🬜','🬝','🬞','🬟','🬠','🬡','🬢','🬣','🬤','🬥','🬦','🬧','🬨','🬩','🬪','🬫','🬬','🬭','🬮','🬯','🬰','🬱','🬲','🬳','🬴','🬵','🬶','🬷','🬸','🬹','🬺','🬻','🬼','🬽','🬾','🬿','🭀','🭁','🭂','🭃','🭄','🭅','🭆','🭇','🭈','🭉','🭊','🭋','🭌','🭍','🭎','🭏','🭐','🭑','🭒','🭓','🭔','🭕','🭖','🭗','🭘','🭙','🭚','🭛','🭜','🭝','🭞','🭟','🭠','🭡','🭢','🭣','🭤','🭥','🭦','🭧','🭨','🭩','🭪','🭫','🭬','🭭','🭮','🭯','🭰','🭱','🭲','🭳','🭴','🭵','🭶','🭷','🭸','🭹','🭺','🭻','🭼','🭽','🭾','🭿','🯀','🯁','🯂','🯃','🯄','🯅','🯆','🯇','🯈','🯉','🯊','🯋','🯌','🯍','🯎','🯏','🯐','🯑','🯒','🯓','🯔','🯕','🯖','🯗','🯘','🯙','🯚','🯛','🯜','🯝','🯞','🯟','🯠','🯡','🯢','🯣','🯤','🯥','🯦','🯧','🯨','🯩','🯪','🯫','🯬','🯭','🯮','🯯','🯰','🯱','🯲','🯳','🯴','🯵','🯶','🯷','🯸','🯹','🯺','🯻','🯼','🯽','🯾','🯿'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % emojis.length;
  return emojis[idx];
}

// Список реакций
const REACTIONS = [
  { key: 'like', emoji: '👍' },
  { key: 'love', emoji: '❤️' },
  { key: 'fun', emoji: '😂' },
  { key: 'think', emoji: '🤔' },
  { key: 'dislike', emoji: '❌' },
];

// --- Новые состояния профиля ---
const EMOJI_CHOICES = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😜','😝','😛','🤑','🤗','🤩','🤔','🤨','😐','😑','😶','🙄','😏','😣','😥','😮','🤐','😯','😪','😫','🥱','😴','😌','😛','😜','😝','🤤','😒','😓','😔','😕','🙃','🫠','🫥','🫡','🫢','🫣','🫤','🫦'];
const BORDER_COLORS = [
  { value: 'border-blue-400', label: 'Синий' },
  { value: 'border-pink-400', label: 'Розовый' },
  { value: 'border-green-400', label: 'Зелёный' },
  { value: 'border-yellow-400', label: 'Жёлтый' },
  { value: 'border-purple-400', label: 'Фиолетовый' },
  { value: 'border-red-400', label: 'Красный' },
  { value: 'border-orange-400', label: 'Оранжевый' },
  { value: 'border-cyan-400', label: 'Голубой' },
  { value: 'border-lime-400', label: 'Лаймовый' },
  { value: 'border-fuchsia-400', label: 'Фуксия' },
];
const BG_COLORS = [
  { value: 'bg-blue-400', label: 'Синий' },
  { value: 'bg-pink-400', label: 'Розовый' },
  { value: 'bg-green-400', label: 'Зелёный' },
  { value: 'bg-yellow-400', label: 'Жёлтый' },
  { value: 'bg-purple-400', label: 'Фиолетовый' },
  { value: 'bg-red-400', label: 'Красный' },
  { value: 'bg-orange-400', label: 'Оранжевый' },
  { value: 'bg-cyan-400', label: 'Голубой' },
  { value: 'bg-lime-400', label: 'Лаймовый' },
  { value: 'bg-fuchsia-400', label: 'Фуксия' },
];
const STATUS_CHOICES = [
  '', 'Играю!', 'В поиске...', 'Готов к контакту', 'AFK', 'Ведущий',
];

// Добавляю маппинг для цветов
const COLOR_LABELS: Record<string, string> = {
  'blue': 'Синий',
  'pink': 'Розовый',
  'green': 'Зелёный',
  'yellow': 'Жёлтый',
  'purple': 'Фиолетовый',
  'red': 'Красный',
  'orange': 'Оранжевый',
  'cyan': 'Голубой',
  'lime': 'Лаймовый',
  'fuchsia': 'Фуксия',
};

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme());
  const [nickname, setNickname] = useState(localStorage.getItem("nickname") || "");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [lobbyCode, setLobbyCode] = useState("");
  const [mode, setMode] = useState<"join" | "create">("join");
  const [screen, setScreen] = useState<'start' | 'lobby'>("start");
  const [socketStatus, setSocketStatus] = useState<'disconnected' | 'connected'>('disconnected');
  const [pong, setPong] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Новые состояния для лобби
  const [players, setPlayers] = useState<{id: string, name: string, avatar?: string, profileBorder?: string, profileBg?: string, profileStatus?: string, profileEmoji?: string}[]>([]);
  const [hostId, setHostId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [myLobbyCode, setMyLobbyCode] = useState<string>("");
  const [myId, setMyId] = useState<string | null>(null);
  const [usedContacts, setUsedContacts] = useState<string[]>([]);

  // Новые состояния для игры
  const [game, setGame] = useState<any>(null);
  const [wordInput, setWordInput] = useState("");
  const [gameError, setGameError] = useState<string | null>(null);

  // Состояния для чата
  const [chat, setChat] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState<string | null>(null);

  // Состояния для контакта
  const [contact, setContact] = useState<any>(null);
  const [contactWord, setContactWord] = useState("");
  const [contactWords, setContactWords] = useState<any>({});
  const [contactTimer, setContactTimer] = useState<number | null>(null);
  const [contactFinished, setContactFinished] = useState<any>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const contactInputRef = useRef<HTMLInputElement | null>(null);

  // --- Новые состояния профиля ---
  const [profileBorder, setProfileBorder] = useState(localStorage.getItem('profileBorder') || 'border-blue-400');
  const [profileBg, setProfileBg] = useState(localStorage.getItem('profileBg') || 'bg-blue-400');
  const [profileStatus, setProfileStatus] = useState(localStorage.getItem('profileStatus') || '');
  const [profileEmoji, setProfileEmoji] = useState(localStorage.getItem('profileEmoji') || '');

  const [emojiDropdownOpen, setEmojiDropdownOpen] = useState(false);
  const emojiDropdownRef = useRef<HTMLDivElement>(null);

  const [lastSeenMsgId, setLastSeenMsgId] = useState<string | null>(null);
  const [newMsgIds, setNewMsgIds] = useState<string[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (nickname) localStorage.setItem("nickname", nickname);
  }, [nickname]);

  useEffect(() => {
    localStorage.setItem('profileBorder', profileBorder);
    localStorage.setItem('profileBg', profileBg);
    localStorage.setItem('profileStatus', profileStatus);
    localStorage.setItem('profileEmoji', profileEmoji);
  }, [profileBorder, profileBg, profileStatus, profileEmoji]);

  // Подключение к серверу и обработка событий лобби
  useEffect(() => {
    let socket = socketRef.current;
    if (screen === 'lobby') {
      if (!socket) {
        socket = io();
        socketRef.current = socket;
      }
      if (socket != null) {
        const s = socket as Socket;
        s.on('connect', () => {
          setSocketStatus('connected');
          setMyId(s.id || null);
        });
        s.on('disconnect', () => setSocketStatus('disconnected'));
        s.off('updateLobby');
        s.on('updateLobby', (lobby) => {
          console.log('updateLobby', lobby);
          setPlayers(lobby.players);
          setHostId(lobby.hostId);
          setMyLobbyCode(lobby.code);
          setGame(lobby.game || null);
          setUsedContacts(lobby.usedContacts || []);
          setContact(null);
          setContactFinished(null);
          setContactTimer(null);
          setContactWord("");
          setContactWords({});
        });
        s.on('gameState', (gameState) => {
          setGame(gameState);
        });
        s.emit('ping', (data: string) => setPong(data));
        s.off('chatUpdate');
        s.on('chatUpdate', (messages) => {
          setChat(messages);
        });
        s.off('contactStarted');
        s.on('contactStarted', (data) => {
          setContact(data);
          setContactWord("");
          setContactWords({});
          setContactTimer(data.expiresAt - Date.now());
          setContactFinished(null);
        });
        s.off('contactUpdate');
        s.on('contactUpdate', (data) => {
          setContactWords(data.words);
        });
        s.off('contactFinished');
        s.on('contactFinished', (data) => {
          setContactFinished(data);
          setContact(null);
          setContactTimer(null);
        });
      }
    }
    if (screen === 'start' && socket) {
      socket.disconnect();
      socketRef.current = null;
      setSocketStatus('disconnected');
      setPong(null);
      setPlayers([]);
      setHostId(null);
      setMyLobbyCode("");
      setError(null);
      setGame(null);
      setWordInput("");
      setGameError(null);
    }
    // eslint-disable-next-line
  }, [screen]);

  useEffect(() => {
    if (screen === 'lobby' && socketRef.current) {
      setMyId(socketRef.current.id || null);
    }
  }, [screen]);

  // Таймер контакта
  useEffect(() => {
    if (!contact || !contactTimer) return;
    const interval = setInterval(() => {
      setContactTimer((t) => (t && t > 1000 ? t - 1000 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [contact, contactTimer]);

  // Автоскролл чата
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat]);

  // Фокусировка поля чата после отправки
  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [chat]);

  // Фокусировка поля контакта при открытии
  useEffect(() => {
    if (contact && contactInputRef.current) {
      contactInputRef.current.focus();
    }
  }, [contact]);

  // Закрытие popup при клике вне
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (emojiDropdownRef.current && !emojiDropdownRef.current.contains(e.target as Node)) {
        setEmojiDropdownOpen(false);
      }
    }
    if (emojiDropdownOpen) {
      document.addEventListener('mousedown', handleClick);
    } else {
      document.removeEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [emojiDropdownOpen]);

  // Отслеживаем новые сообщения
  useEffect(() => {
    if (chat.length > 0) {
      const lastMsg = chat[chat.length - 1];
      if (lastSeenMsgId && lastMsg.id !== lastSeenMsgId) {
        // Новые сообщения после последнего видимого
        const idx = chat.findIndex(m => m.id === lastSeenMsgId);
        const newIds = chat.slice(idx + 1).map(m => m.id);
        setNewMsgIds(newIds);
        // Убираем подсветку через 2.5 сек
        setTimeout(() => setNewMsgIds(ids => ids.filter(id => !newIds.includes(id))), 2500);
      }
      setLastSeenMsgId(lastMsg.id);
    }
  }, [chat]);

  // Автоматическое подтверждение контакта и поэтапное открытие всего слова, если оба игрока ввели загаданное слово
  useEffect(() => {
    if (!contact || !game?.word || !contactWords) return;
    const ids = contact.hostInvolved ? [contact.from, contact.to, game.hostId] : [contact.from, contact.to];
    const allEntered = ids.every(id => contactWords[id]);
    if (!allEntered) return;
    // Сравниваем слова без учёта регистра и пробелов
    const normalize = (w: string) => w.trim().toLowerCase();
    const mainWord = normalize(game.word);
    const allGuessed = ids.every(id => normalize(contactWords[id] || '') === mainWord);
    if (allGuessed && socketRef.current && myId === game.hostId && game.revealed < game.word.length) {
      socketRef.current.emit('confirmContact', { code: myLobbyCode });
    }
  }, [contactWords, contact, game, myId, myLobbyCode]);

  // После завершения контакта, если слово угадано, но не открыто полностью, продолжаем открывать
  useEffect(() => {
    if (!game?.word || !contactFinished || !myId || myId !== game.hostId) return;
    // Сравниваем слова без учёта регистра и пробелов
    const normalize = (w: string) => w.trim().toLowerCase();
    const mainWord = normalize(game.word);
    const ids = contactFinished.hostInvolved ? [contactFinished.from, contactFinished.to, game.hostId] : [contactFinished.from, contactFinished.to];
    const allGuessed = ids.every(id => normalize(contactFinished.words?.[id] || '') === mainWord);
    if (allGuessed && game.revealed < game.word.length && socketRef.current) {
      socketRef.current.emit('confirmContact', { code: myLobbyCode });
    }
  }, [contactFinished, game, myId, myLobbyCode]);

  // Обработка создания/входа в лобби
  const handleLobbyEnter = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!nickname) return setError("Введите никнейм");
    if (mode === "join" && !lobbyCode) return setError("Введите код лобби");
    const socket = socketRef.current || io();
    socketRef.current = socket;
    socket.on('connect', () => setSocketStatus('connected'));
    socket.on('disconnect', () => setSocketStatus('disconnected'));
    socket.on('updateLobby', (lobby) => {
      setPlayers(lobby.players);
      setHostId(lobby.hostId);
      setMyLobbyCode(lobby.code);
    });
    if (mode === "create") {
      socket.emit('createLobby', { name: nickname, avatar, profileBorder, profileBg, profileStatus, profileEmoji }, (res: any) => {
        if (res.error) return setError(res.error);
        setPlayers(res.players);
        setHostId(res.hostId);
        setMyLobbyCode(res.code);
        setScreen('lobby');
        localStorage.setItem('lastLobbyCode', res.code);
      });
    } else {
      socket.emit('joinLobby', { code: lobbyCode, name: nickname, avatar, profileBorder, profileBg, profileStatus, profileEmoji }, (res: any) => {
        if (res.error) return setError(res.error);
        setPlayers(res.players);
        setHostId(res.hostId);
        setMyLobbyCode(res.code);
        setScreen('lobby');
        localStorage.setItem('lastLobbyCode', res.code);
      });
    }
  };

  // Выход из лобби
  const handleLeaveLobby = () => {
    if (socketRef.current && myLobbyCode) {
      socketRef.current.emit('leaveLobby', { code: myLobbyCode });
    }
    setScreen('start');
    localStorage.removeItem('lastLobbyCode');
  };

  // Ведущий начинает игру
  const handleStartGame = () => {
    setGameError(null);
    console.log('emit startGame', myLobbyCode, myId);
    if (!socketRef.current || !myLobbyCode) return;
    socketRef.current.emit('startGame', { code: myLobbyCode }, (res: any) => {
      if (res?.error) setGameError(res.error);
    });
  };

  // Ведущий задаёт слово
  const handleSetWord = (e: React.FormEvent) => {
    e.preventDefault();
    setGameError(null);
    if (!wordInput || wordInput.length < 3) return setGameError('Слово должно быть не короче 3 букв');
    if (!socketRef.current || !myLobbyCode) return;
    socketRef.current.emit('setWord', { code: myLobbyCode, word: wordInput }, (res: any) => {
      if (res?.error) setGameError(res.error);
      else setWordInput("");
    });
  };

  // Проверка на повтор слова
  const isWordUsed = (word: string) => {
    return game?.usedWords?.some((w: string) => w.trim().toLowerCase() === word.trim().toLowerCase());
  };

  // Отправка сообщения
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setChatError(null);
    if (!chatInput.trim()) return;
    if (isWordUsed(chatInput)) {
      setChatError('Это слово уже использовано!');
      return;
    }
    if (!socketRef.current || !myLobbyCode) return;
    socketRef.current.emit('sendMessage', { code: myLobbyCode, text: chatInput }, (res: any) => {
      if (res?.error) setChatError(res.error);
      else setChatInput("");
    });
  };

  // Инициация контакта
  const handleContact = (messageId: string) => {
    if (contact) return; // Если уже есть активный контакт, не даём отправить новый
    if (!socketRef.current || !myLobbyCode) return;
    socketRef.current.emit('contactRequest', { code: myLobbyCode, messageId });
  };

  // Отправка слова для контакта
  const handleContactWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactWord.trim() || !socketRef.current || !myLobbyCode) return;
    // Проверка: слово должно начинаться с открытых букв
    if (game?.word && game?.revealed) {
      const prefix = game.word.slice(0, game.revealed).toLowerCase();
      if (contactWord.trim().toLowerCase().slice(0, prefix.length) !== prefix) {
        setGameError(`Слово должно начинаться с: ${game.word.slice(0, game.revealed).toUpperCase()}`);
        return;
      }
    }
    socketRef.current.emit('contactWord', { code: myLobbyCode, word: contactWord }, () => {
      setContactWord("");
      setGameError(null);
    });
  };

  // Подтверждение/отклонение контакта ведущим
  const handleConfirmContact = () => {
    if (!socketRef.current || !myLobbyCode) return;
    socketRef.current.emit('confirmContact', { code: myLobbyCode });
  };
  const handleRejectContact = () => {
    if (!socketRef.current || !myLobbyCode) return;
    socketRef.current.emit('rejectContact', { code: myLobbyCode });
  };

  // Проверка совпадения слов для подтверждения контакта
  const canConfirmContact = contactFinished &&
    contactFinished.words?.[contactFinished.from]?.trim().toLowerCase() === contactFinished.words?.[contactFinished.to]?.trim().toLowerCase() &&
    !isWordUsed(contactFinished.words?.[contactFinished.from] || '');

  // Сброс игры (новая игра)
  const handleResetGame = () => {
    if (!socketRef.current || !myLobbyCode) return;
    socketRef.current.emit('resetGame', { code: myLobbyCode });
  };

  // Добавление/удаление реакции
  const handleReaction = (messageId: string, reaction: string | null) => {
    if (!socketRef.current || !myLobbyCode) return;
    socketRef.current.emit('addReaction', { code: myLobbyCode, messageId, reaction });
  };

  // Смена ведущего
  const handleChangeHost = (newHostId: string) => {
    if (!socketRef.current || !myLobbyCode) return;
    socketRef.current.emit('changeHost', { code: myLobbyCode, newHostId }, (res: any) => {
      if (res?.error) setError(res.error);
    });
  };

  // Обработчик для кнопки 'Я знаю' (только для ведущего)
  const handleHostKnows = (messageId: string) => {
    if (!socketRef.current || !myLobbyCode) return;
    socketRef.current.emit('hostKnows', { code: myLobbyCode, messageId });
  };

  // --- Внутри App ---
  useEffect(() => {
    // Попытка восстановления сессии
    const savedCode = localStorage.getItem('lastLobbyCode');
    const savedNick = localStorage.getItem('nickname');
    if (screen === 'start' && savedCode && savedNick) {
      // Автовход
      setLobbyCode(savedCode);
      setNickname(savedNick);
      setError(null);
      // Используем сохранённую кастомизацию
      const border = localStorage.getItem('profileBorder') || 'border-blue-400';
      const bg = localStorage.getItem('profileBg') || 'bg-blue-400';
      const status = localStorage.getItem('profileStatus') || '';
      const emoji = localStorage.getItem('profileEmoji') || '';
      setProfileBorder(border);
      setProfileBg(bg);
      setProfileStatus(status);
      setProfileEmoji(emoji);
      // Пробуем войти
      const socket = socketRef.current || io();
      socketRef.current = socket;
      socket.emit('joinLobby', { code: savedCode, name: savedNick, avatar, profileBorder: border, profileBg: bg, profileStatus: status, profileEmoji: emoji }, (res: any) => {
        if (res.error) {
          setError('Не удалось восстановить сессию: ' + res.error);
          localStorage.removeItem('lastLobbyCode');
        } else {
          setPlayers(res.players);
          setHostId(res.hostId);
          setMyLobbyCode(res.code);
          setScreen('lobby');
        }
      });
    }
    // eslint-disable-next-line
  }, []);

  if (screen === "lobby") {
    const isHost = hostId === myId;
    const isGameStarted = !!game?.started;
    const wordLength = game?.word?.length || 0;
    const revealed = game?.revealed || 1;
    const displayWord = game?.word
      ? game.word
          .split('')
          .map((ch: string, i: number) => (i < revealed ? ch.toUpperCase() : '_'))
          .join(' ')
      : '';

    return (
      <div className="fixed inset-0 min-h-screen min-w-screen bg-gray-100 dark:bg-gray-900 transition-colors flex items-center justify-center overflow-auto">
        <div className="w-full max-w-full sm:max-w-2xl md:max-w-4xl p-1 xs:p-2 md:p-6 rounded-none xs:rounded-2xl shadow-none xs:shadow-2xl bg-white dark:bg-gray-800 flex flex-col md:flex-row gap-2 xs:gap-4 md:gap-6 min-h-screen md:min-h-[80vh]">
          {/* Левая колонка: инфо, игроки, управление */}
          <div className="flex flex-col gap-2 xs:gap-4 w-full md:w-[320px] min-w-0">
            <Lobby
              myLobbyCode={myLobbyCode}
              players={players}
              hostId={hostId}
              myId={myId}
              theme={theme}
              setTheme={setTheme}
              handleChangeHost={handleChangeHost}
              handleLeaveLobby={handleLeaveLobby}
            />
            <Game
              isHost={isHost}
              isGameStarted={isGameStarted}
              game={game}
              wordInput={wordInput}
              setWordInput={setWordInput}
              handleStartGame={handleStartGame}
              handleSetWord={handleSetWord}
              gameError={gameError}
              displayWord={displayWord}
              wordLength={wordLength}
              revealed={revealed}
              contact={contact}
              contactTimer={contactTimer}
              contactWord={contactWord}
              setContactWord={setContactWord}
              handleContactWord={handleContactWord}
              myId={myId}
              contactInputRef={contactInputRef}
              contactFinished={contactFinished}
              isWordUsed={isWordUsed}
              handleConfirmContact={handleConfirmContact}
              handleRejectContact={handleRejectContact}
              canConfirmContact={canConfirmContact}
              handleResetGame={handleResetGame}
              contactWords={contactWords}
              handleRevealAll={() => {
                if (!game?.word || !socketRef.current || !myLobbyCode) return;
                socketRef.current.emit('revealAll', { code: myLobbyCode });
              }}
            />
          </div>
          {/* Разделитель */}
          <div className="hidden md:block w-px bg-gray-200 dark:bg-gray-700 mx-2 rounded-full" />
          {/* Правая колонка: чат и сообщения */}
          <div className="flex-1 min-w-0 flex flex-col">
            <Chat
              isGameStarted={isGameStarted}
              displayWord={displayWord}
              wordLength={wordLength}
              chat={chat}
              players={players}
              myId={myId}
              newMsgIds={newMsgIds}
              isHost={isHost}
              usedContacts={usedContacts}
              isWordUsed={isWordUsed}
              handleContact={handleContact}
              handleReaction={handleReaction}
              chatInput={chatInput}
              setChatInput={setChatInput}
              chatInputRef={chatInputRef}
              handleSendMessage={handleSendMessage}
              chatError={chatError}
              handleHostKnows={handleHostKnows}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 min-h-screen min-w-screen bg-gray-100 dark:bg-gray-900 transition-colors flex items-center justify-center">
      <div className="w-full max-w-md p-6 rounded-xl shadow-xl bg-white dark:bg-gray-800">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Контакт</h1>
          <button
            aria-label="Переключить тему"
            className="ml-2 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
        </div>
        <form className="space-y-4 min-h-[420px] flex flex-col justify-between" onSubmit={handleLobbyEnter}>
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-1">Никнейм</label>
            <input
              className="w-full px-3 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              maxLength={20}
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-1">Аватар (опционально)</label>
            <input
              className="w-full px-3 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
              type="file"
              accept="image/*"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = ev => setAvatar(ev.target?.result as string);
                  reader.readAsDataURL(file);
                }
              }}
            />
            {avatar ? (
              <span className="relative block mt-2 w-20 h-20 mx-auto">
                <span className={`absolute inset-0 w-20 h-20 rounded-full ${theme === 'dark' ? 'bg-black border-black' : 'bg-white border-white'} border-2`}></span>
                <img src={avatar} alt="avatar" className={`w-20 h-20 rounded-full object-cover border-4 ${profileBorder} ${profileBg} relative z-10`} />
              </span>
            ) : (
              nickname && <span className={`relative block mt-2 w-20 h-20 mx-auto`}>
                <span className={`absolute inset-0 w-20 h-20 rounded-full ${theme === 'dark' ? 'bg-black border-black' : 'bg-white border-white'} border-2`}></span>
                <span className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-5xl mx-auto border-4 ${profileBg} ${profileBorder} relative z-10`}>{profileEmoji || getEmojiAvatar(nickname)}</span>
              </span>
            )}
          </div>
          <div className="flex flex-col gap-2 mt-2 items-center">
            <div className="flex gap-2 w-full">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Рамка</label>
                <select className="w-full rounded px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" value={profileBorder} onChange={e => setProfileBorder(e.target.value)}>
                  {BORDER_COLORS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Фон</label>
                <select className="w-full rounded px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" value={profileBg} onChange={e => setProfileBg(e.target.value)}>
                  {BG_COLORS.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 w-full">
              <div className="flex-1 relative">
                <label className="block text-xs text-gray-500 mb-1">Эмодзи</label>
                <button
                  type="button"
                  className="w-full rounded px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 flex items-center justify-between"
                  onClick={() => setEmojiDropdownOpen(v => !v)}
                >
                  <span className="text-2xl">{profileEmoji || 'auto'}</span>
                  <span className="ml-2 text-gray-400">▼</span>
                </button>
                {emojiDropdownOpen && (
                  <div ref={emojiDropdownRef} className="absolute z-20 mt-1 w-64 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded shadow-lg p-2 grid grid-cols-6 gap-1 max-h-56 overflow-y-auto">
                    <button
                      className={`rounded w-7 h-7 flex items-center justify-center text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 ${!profileEmoji ? 'ring-2 ring-blue-400 dark:ring-blue-300 border-2 border-blue-400 dark:border-blue-300' : ''}`}
                      onClick={() => { setProfileEmoji(''); setEmojiDropdownOpen(false); }}
                    >auto</button>
                    {EMOJI_CHOICES.map(e => (
                      <button
                        key={e}
                        className={`rounded w-7 h-7 flex items-center justify-center text-xl bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-blue-100 dark:hover:bg-blue-900 transition ${profileEmoji === e ? 'ring-2 ring-blue-400 dark:ring-blue-300 border-2 border-blue-400 dark:border-blue-300' : ''}`}
                        onClick={() => { setProfileEmoji(e); setEmojiDropdownOpen(false); }}
                      >{e}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Статус</label>
                <select className="w-full rounded px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" value={profileStatus} onChange={e => setProfileStatus(e.target.value)}>
                  {STATUS_CHOICES.map(s => <option key={s} value={s}>{s || '—'}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              className={`flex-1 px-4 py-2 rounded ${mode === "join" ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"}`}
              onClick={() => setMode("join")}
            >
              Присоединиться
            </button>
            <button
              type="button"
              className={`flex-1 px-4 py-2 rounded ${mode === "create" ? "bg-blue-500 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"}`}
              onClick={() => setMode("create")}
            >
              Создать лобби
            </button>
          </div>
          {mode === "join" && (
            <div>
              <label className="block text-gray-700 dark:text-gray-200 mb-1 mt-2">Код лобби</label>
              <input
                className="w-full px-3 py-2 rounded bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="text"
                value={lobbyCode}
                onChange={e => setLobbyCode(e.target.value.toUpperCase())}
                maxLength={8}
                placeholder="Например: ABC123"
                required={mode === "join"}
              />
            </div>
          )}
          {error && <div className="text-red-500 text-sm mt-2 mb-2 text-center">{error}</div>}
          <button
            type="submit"
            className="w-full mt-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition"
            disabled={!nickname || (mode === "join" && !lobbyCode)}
            style={{ position: 'sticky', bottom: 0, zIndex: 10 }}
          >
            {mode === "join" ? "Войти в лобби" : "Создать лобби"}
          </button>
        </form>
      </div>
    </div>
  );
}
