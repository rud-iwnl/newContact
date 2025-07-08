/// <reference types="node" />
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';

const app = express();
app.use(cors());

// Отдача статики фронта
app.use(express.static(path.join(__dirname, '../public')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 4000;

// --- Лобби и игроки ---
type Player = {
  id: string;
  name: string;
  avatar?: string;
  profileBorder?: string;
  profileBg?: string;
  profileStatus?: string;
  profileEmoji?: string;
  score?: number;
};
type GameState = {
  started: boolean;
  word?: string;
  revealed: number;
  usedWords: string[];
  phase: 'waiting' | 'playing';
};
type ChatMessage = {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  reactions?: Record<string, 'like' | 'dislike'>;
};
type ContactState = {
  messageId: string;
  from: string;
  to: string;
  words: Record<string, string>; // userId -> word
  timer: NodeJS.Timeout | null;
  expiresAt: number;
  finished: boolean;
  hostInvolved: boolean;
  hostWord?: string;
};
type Lobby = {
  code: string;
  players: Player[];
  hostId: string;
  game?: GameState;
  chat?: ChatMessage[];
  contact?: ContactState;
  usedContacts?: string[];
  duoMode?: boolean;
};
const lobbies: Record<string, Lobby> = {};

// База слов для режима дуэли
const DUO_WORDS = {
  easy: ['кот', 'дом', 'сад', 'лес', 'море', 'небо', 'солнце', 'звезда', 'цветок', 'дерево', 'книга', 'ручка', 'стол', 'окно', 'дверь', 'машина', 'телефон', 'компьютер', 'музыка', 'спорт'],
  medium: ['программа', 'интернет', 'путешествие', 'образование', 'телевидение', 'ресторан', 'больница', 'университет', 'библиотека', 'театр', 'музей', 'стадион', 'аэропорт', 'вокзал', 'магазин', 'банк', 'почта', 'полиция', 'пожарный', 'врач'],
  hard: ['информатика', 'математика', 'философия', 'психология', 'биология', 'химия', 'физика', 'история', 'география', 'литература', 'экономика', 'политика', 'медицина', 'юриспруденция', 'архитектура', 'инженерия', 'технология', 'исследование', 'эксперимент', 'открытие']
};

// Функция выбора случайного слова по сложности
function getRandomWord(difficulty: 'easy' | 'medium' | 'hard'): string {
  const words = DUO_WORDS[difficulty];
  return words[Math.floor(Math.random() * words.length)];
}

function generateLobbyCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createLobby', ({ name, avatar, profileBorder, profileBg, profileStatus, profileEmoji }, cb) => {
    let code;
    do { code = generateLobbyCode(); } while (lobbies[code]);
    const player: Player = { id: socket.id, name, avatar, profileBorder, profileBg, profileStatus, profileEmoji, score: 0 };
    lobbies[code] = { code, players: [player], hostId: socket.id };
    socket.join(code);
    cb({ code, players: lobbies[code].players, hostId: socket.id });
    io.to(code).emit('updateLobby', lobbies[code]);
  });

  socket.on('joinLobby', ({ code, name, avatar, profileBorder, profileBg, profileStatus, profileEmoji }, cb) => {
    code = code.toUpperCase();
    const lobby = lobbies[code];
    if (!lobby) return cb({ error: 'Лобби не найдено' });
    if (lobby.players.length >= 12) return cb({ error: 'Лобби заполнено' });
    const player: Player = { id: socket.id, name, avatar, profileBorder, profileBg, profileStatus, profileEmoji, score: 0 };
    lobby.players.push(player);
    socket.join(code);
    cb({ code, players: lobby.players, hostId: lobby.hostId });
    io.to(code).emit('updateLobby', lobby);
  });

  socket.on('leaveLobby', ({ code }) => {
    code = code.toUpperCase();
    const lobby = lobbies[code];
    if (!lobby) return;
    // Сброс очков только у покидающего игрока
    const player = lobby.players.find(p => p.id === socket.id);
    if (player) player.score = 0;
    lobby.players = lobby.players.filter(p => p.id !== socket.id);
    if (lobby.hostId === socket.id && lobby.players.length > 0) {
      lobby.hostId = lobby.players[0].id;
    }
    if (lobby.players.length === 0) {
      delete lobbies[code];
    } else {
      io.to(code).emit('updateLobby', lobby);
    }
    socket.leave(code);
  });

  socket.on('disconnect', () => {
    // Удаляем игрока из всех лобби
    for (const code in lobbies) {
      const lobby = lobbies[code];
      const wasInLobby = lobby.players.some(p => p.id === socket.id);
      lobby.players = lobby.players.filter(p => p.id !== socket.id);
      if (lobby.hostId === socket.id && lobby.players.length > 0) {
        lobby.hostId = lobby.players[0].id;
      }
      if (lobby.players.length === 0) {
        delete lobbies[code];
      } else if (wasInLobby) {
        io.to(code).emit('updateLobby', lobby);
      }
    }
    console.log('User disconnected:', socket.id);
  });

  // Тестовое событие
  socket.on('ping', (cb) => cb('pong'));

  socket.on('startGame', ({ code }, cb) => {
    console.log('startGame called', code, socket.id);
    code = code.toUpperCase();
    const lobby = lobbies[code];
    if (!lobby || lobby.hostId !== socket.id) return cb && cb({ error: 'Нет прав' });
    lobby.game = { started: false, revealed: 1, usedWords: [], phase: 'waiting' };
    io.to(code).emit('updateLobby', lobby);
    console.log('updateLobby sent', code, lobby);
    cb && cb({ ok: true });
  });

  socket.on('setWord', ({ code, word }, cb) => {
    code = code.toUpperCase();
    const lobby = lobbies[code];
    if (!lobby || lobby.hostId !== socket.id) return cb && cb({ error: 'Нет прав' });
    if (!lobby.game) return cb && cb({ error: 'Игра не запущена' });
    lobby.game.word = word.trim();
    lobby.game.started = true;
    lobby.game.phase = 'playing';
    lobby.game.revealed = 1;
    lobby.game.usedWords = [];
    io.to(code).emit('updateLobby', lobby);
    cb && cb({ ok: true });
  });

  socket.on('resetGame', ({ code }, cb) => {
    code = code.toUpperCase();
    const lobby = lobbies[code];
    if (!lobby || lobby.hostId !== socket.id) return cb && cb({ error: 'Нет прав' });
    // НЕ сбрасываем очки!
    lobby.game = undefined;
    lobby.chat = [];
    io.to(code).emit('updateLobby', lobby);
    cb && cb({ ok: true });
  });

  socket.on('sendMessage', ({ code, text }, cb) => {
    code = code.toUpperCase();
    const lobby = lobbies[code];
    if (!lobby || !lobby.game || !lobby.game.started) return cb && cb({ error: 'Игра не идёт' });
    const player = lobby.players.find(p => p.id === socket.id);
    if (!player) return cb && cb({ error: 'Нет игрока' });
    if (socket.id === lobby.hostId) return cb && cb({ error: 'Ведущий не может писать' });
    const msg: ChatMessage = {
      id: Math.random().toString(36).slice(2),
      userId: socket.id,
      userName: player.name,
      text: text.trim(),
      timestamp: Date.now(),
    };
    lobby.chat = lobby.chat || [];
    lobby.chat.push(msg);
    io.to(code).emit('chatUpdate', lobby.chat);
    cb && cb({ ok: true });
  });

  socket.on('contactRequest', ({ code, messageId }, cb) => {
    code = code.toUpperCase();
    const lobby = lobbies[code];
    if (!lobby || !lobby.game || !lobby.game.started) return cb && cb({ error: 'Игра не идёт' });
    lobby.usedContacts = lobby.usedContacts || [];
    if (lobby.usedContacts.includes(messageId)) return cb && cb({ error: 'Контакт уже был по этому сообщению' });
    if (lobby.contact && !lobby.contact.finished) return cb && cb({ error: 'Контакт уже активен' });
    const msg = (lobby.chat || []).find(m => m.id === messageId);
    if (!msg) return cb && cb({ error: 'Сообщение не найдено' });
    if (msg.userId === socket.id) return cb && cb({ error: 'Нельзя контактировать с собой' });
    // Запрещаем контакт, если слово уже использовано
    const word = msg.text.trim().toLowerCase();
    if (lobby.game.usedWords.includes(word)) return cb && cb({ error: 'Это слово уже использовано' });
    const contact: ContactState = {
      messageId,
      from: socket.id,
      to: msg.userId,
      words: {},
      timer: null as NodeJS.Timeout | null,
      expiresAt: Date.now() + 20000,
      finished: false,
      hostInvolved: false,
    };
    lobby.contact = contact;
    io.to(code).emit('contactStarted', { from: socket.id, to: msg.userId, messageId, expiresAt: contact.expiresAt });
    // Запускаем таймер
    contact.timer = setTimeout(() => {
      contact.finished = true;
      lobby.usedContacts!.push(messageId);
      const fromPlayer = lobby.players.find(p => p.id === contact.from);
      const toPlayer = lobby.players.find(p => p.id === contact.to);
      io.to(code).emit('contactFinished', {
        words: contact.words,
        from: contact.from,
        to: contact.to,
        fromName: fromPlayer?.name || 'Игрок 1',
        toName: toPlayer?.name || 'Игрок 2',
      });
    }, 20000);
    cb && cb({ ok: true });
  });

  socket.on('contactWord', ({ code, word }, cb) => {
    code = code.toUpperCase();
    const lobby = lobbies[code];
    if (!lobby || !lobby.contact || lobby.contact.finished) return cb && cb({ error: 'Нет активного контакта' });
    // Определяем участников
    const { from, to, hostInvolved } = lobby.contact;
    const hostId = lobby.hostId;
    // Проверка: кто может отправлять слово
    const allowed = [from, to];
    if (hostInvolved) allowed.push(hostId);
    if (!allowed.includes(socket.id)) return cb && cb({ error: 'Вы не участник контакта' });
    lobby.contact.words[socket.id] = word.trim();
    io.to(code).emit('contactUpdate', { words: lobby.contact.words, hostInvolved });
    // --- Логика завершения контакта ---
    if (!hostInvolved) {
      // Обычный контакт (2 участника)
      if (lobby.contact.words[from] && lobby.contact.words[to] && !lobby.contact.finished) {
        if (lobby.contact.timer) clearTimeout(lobby.contact.timer);
        lobby.contact.finished = true;
        lobby.usedContacts = lobby.usedContacts || [];
        lobby.usedContacts.push(lobby.contact.messageId);
        const fromPlayer = lobby.players.find(p => p.id === from);
        const toPlayer = lobby.players.find(p => p.id === to);
        io.to(code).emit('contactFinished', {
          words: lobby.contact.words,
          from,
          to,
          fromName: fromPlayer?.name || 'Игрок 1',
          toName: toPlayer?.name || 'Игрок 2',
          hostInvolved: false,
        });
      }
    } else {
      // Контакт с ведущим (2 или 3 участника)
      const hostWord = lobby.contact.words[hostId];
      const fromWord = lobby.contact.words[from];
      const toWord = lobby.contact.words[to];
      // Если контакт между ведущим и игроком (до контакта)
      if (from === hostId || to === hostId) {
        const otherId = from === hostId ? to : from;
        if (hostWord && lobby.contact.words[otherId] && !lobby.contact.finished) {
          if (lobby.contact.timer) clearTimeout(lobby.contact.timer);
          lobby.contact.finished = true;
          lobby.usedContacts = lobby.usedContacts || [];
          lobby.usedContacts.push(lobby.contact.messageId);
          const hostPlayer = lobby.players.find(p => p.id === hostId);
          const otherPlayer = lobby.players.find(p => p.id === otherId);
          io.to(code).emit('contactFinished', {
            words: lobby.contact.words,
            from: hostId,
            to: otherId,
            fromName: hostPlayer?.name || 'Ведущий',
            toName: otherPlayer?.name || 'Игрок',
            hostInvolved: true,
          });
        }
      } else {
        // Контакт втроём (оба игрока + ведущий)
        if (hostWord && fromWord && toWord && !lobby.contact.finished) {
          if (lobby.contact.timer) clearTimeout(lobby.contact.timer);
          lobby.contact.finished = true;
          lobby.usedContacts = lobby.usedContacts || [];
          lobby.usedContacts.push(lobby.contact.messageId);
          const fromPlayer = lobby.players.find(p => p.id === from);
          const toPlayer = lobby.players.find(p => p.id === to);
          const hostPlayer = lobby.players.find(p => p.id === hostId);
          // Если слово ведущего совпадает с обоими — срыв контакта
          const hostWordNorm = hostWord.trim().toLowerCase();
          const fromWordNorm = fromWord.trim().toLowerCase();
          const toWordNorm = toWord.trim().toLowerCase();
          let contactResult = 'normal';
          if (hostWordNorm === fromWordNorm && hostWordNorm === toWordNorm) {
            // Срыв контакта
            contactResult = 'break';
            if (lobby.game && !lobby.game.usedWords.includes(hostWordNorm)) {
              lobby.game.usedWords.push(hostWordNorm);
            }
          }
          io.to(code).emit('contactFinished', {
            words: lobby.contact.words,
            from,
            to,
            fromName: fromPlayer?.name || 'Игрок 1',
            toName: toPlayer?.name || 'Игрок 2',
            hostInvolved: true,
            hostName: hostPlayer?.name || 'Ведущий',
            contactResult,
          });
        }
      }
    }
    cb && cb({ ok: true });
  });

  socket.on('cancelContact', ({ code }, cb) => {
    code = code.toUpperCase();
    const lobby = lobbies[code];
    if (!lobby || !lobby.contact || lobby.contact.finished) return cb && cb({ error: 'Нет активного контакта' });
    if (socket.id !== lobby.contact.from && socket.id !== lobby.contact.to) return cb && cb({ error: 'Вы не участник контакта' });
    if (lobby.contact.timer) clearTimeout(lobby.contact.timer);
    lobby.contact.finished = true;
    lobby.usedContacts = lobby.usedContacts || [];
    lobby.usedContacts.push(lobby.contact.messageId);
    const fromPlayer = lobby.players.find(p => p.id === lobby.contact!.from);
    const toPlayer = lobby.players.find(p => p.id === lobby.contact!.to);
    io.to(code).emit('contactFinished', {
      words: lobby.contact.words,
      from: lobby.contact.from,
      to: lobby.contact.to,
      fromName: fromPlayer?.name || 'Игрок 1',
      toName: toPlayer?.name || 'Игрок 2',
      cancelled: true,
    });
    cb && cb({ ok: true });
  });

  socket.on('confirmContact', ({ code }, cb) => {
    code = code.toUpperCase();
    const lobby = lobbies[code];
    const contact = lobby?.contact;
    if (!lobby || !lobby.game || !contact || !contact.finished) return cb && cb({ error: 'Нет завершённого контакта' });
    if (socket.id !== lobby.hostId && !lobby.duoMode) return cb && cb({ error: 'Только ведущий может подтверждать' });
    
    // В режиме дуэли автоматическая проверка
    if (lobby.duoMode) {
      const word = lobby.game.word?.trim().toLowerCase();
      const playerWord = (contact.words[contact.from] || '').trim().toLowerCase();
      const otherPlayerWord = (contact.words[contact.to] || '').trim().toLowerCase();
      
      // Если слова совпали
      if (playerWord && otherPlayerWord && playerWord === otherPlayerWord) {
        // Если угадали загаданное слово
        if (playerWord === word) {
          lobby.game.revealed = word.length;
        } else {
          // Обычный контакт
          if (lobby.game.revealed < (lobby.game.word?.length || 0)) {
            lobby.game.revealed++;
          }
        }
        // Добавить в использованные
        if (!lobby.game.usedWords.includes(playerWord)) {
          lobby.game.usedWords.push(playerWord);
        }
        lobby.contact = undefined;
        io.to(code).emit('updateLobby', lobby);
        return cb && cb({ ok: true });
      }
    }
    
    // Обычная логика для не-дуэли
    const word = lobby.game.word?.trim().toLowerCase();
    const ids = contact.hostInvolved ? [contact.from, contact.to, lobby.hostId] : [contact.from, contact.to];
    const allGuessed = ids.every(id => (contact.words[id] || '').trim().toLowerCase() === word);
    // --- логика для контакта с ведущим ---
    if (contact.hostInvolved) {
      const playerWord = (contact.words[contact.from] || '').trim().toLowerCase();
      const hostWord = (contact.words[lobby.hostId] || '').trim().toLowerCase();
      // Если слова игрока и ведущего совпали, но не совпали с загаданным словом
      if (playerWord && hostWord && playerWord === hostWord && playerWord !== word) {
        // Добавить в usedWords
        if (!lobby.game.usedWords.includes(playerWord)) {
          lobby.game.usedWords.push(playerWord);
        }
        // Ведущий получает 2 очка
        const hostPlayer = lobby.players.find(p => p.id === lobby.hostId);
        if (hostPlayer) hostPlayer.score = (hostPlayer.score || 0) + 2;
        lobby.contact = undefined;
        io.to(code).emit('updateLobby', lobby);
        return cb && cb({ ok: true });
      }
    }
    // --- начисление очков при каждом успешном контакте ---
    const bothGuessed = contact.words[contact.from] && contact.words[contact.to] && (contact.words[contact.from].trim().toLowerCase() === contact.words[contact.to].trim().toLowerCase());
    if (bothGuessed) {
      [contact.from, contact.to].forEach(id => {
        const player = lobby.players.find(p => p.id === id);
        if (player) player.score = (player.score || 0) + 1;
      });
      // Если втроём и ведущий тоже угадал — ему тоже очко
      if (contact.hostInvolved && contact.words[lobby.hostId] && contact.words[lobby.hostId].trim().toLowerCase() === contact.words[contact.from].trim().toLowerCase()) {
        const hostPlayer = lobby.players.find(p => p.id === lobby.hostId);
        if (hostPlayer) hostPlayer.score = (hostPlayer.score || 0) + 1;
      }
    }
    // Если все угадали загаданное слово — открыть всё слово
    if (allGuessed && word) {
      lobby.game.revealed = word.length;
    } else if (lobby.game.revealed < (lobby.game.word?.length || 0)) {
      lobby.game.revealed++;
    }
    // Добавляем только одно использованное слово (в нижнем регистре, без пробелов)
    const usedWord = contact.words[contact.from]?.trim().toLowerCase();
    if (usedWord && !lobby.game.usedWords.includes(usedWord)) {
      lobby.game.usedWords.push(usedWord);
    }
    lobby.contact = undefined;
    io.to(code).emit('updateLobby', lobby);
    cb && cb({ ok: true });
  });

  socket.on('rejectContact', ({ code }, cb) => {
    code = code.toUpperCase();
    const lobby = lobbies[code];
    if (!lobby || !lobby.game || !lobby.contact || !lobby.contact.finished) return cb && cb({ error: 'Нет завершённого контакта' });
    if (socket.id !== lobby.hostId) return cb && cb({ error: 'Только ведущий может отклонять' });
    // Просто сбрасываем контакт
    lobby.contact = undefined;
    io.to(code).emit('updateLobby', lobby);
    cb && cb({ ok: true });
  });

  socket.on('addReaction', ({ code, messageId, reaction }, cb) => {
    code = code.toUpperCase();
    const lobby = lobbies[code];
    if (!lobby || !lobby.game || !lobby.game.started) return cb && cb({ error: 'Игра не идёт' });
    const msg = (lobby.chat || []).find(m => m.id === messageId);
    if (!msg) return cb && cb({ error: 'Сообщение не найдено' });
    msg.reactions = msg.reactions || {};
    if (reaction === null) {
      delete msg.reactions[socket.id];
    } else {
      msg.reactions[socket.id] = reaction;
    }
    io.to(code).emit('chatUpdate', lobby.chat);
    cb && cb({ ok: true });
  });

  socket.on('changeHost', ({ code, newHostId }, cb) => {
    code = code.toUpperCase();
    const lobby = lobbies[code];
    if (!lobby || lobby.hostId !== socket.id) return cb && cb({ error: 'Нет прав' });
    if (!lobby.players.some(p => p.id === newHostId)) return cb && cb({ error: 'Игрок не найден' });
    lobby.hostId = newHostId;
    io.to(code).emit('updateLobby', lobby);
    cb && cb({ ok: true });
  });

  // --- ДОБАВЛЯЕМ: обработка события 'hostKnows' ---
  socket.on('hostKnows', ({ code, messageId }, cb) => {
    code = code.toUpperCase();
    const lobby = lobbies[code];
    if (!lobby || !lobby.game || !lobby.game.started) return cb && cb({ error: 'Игра не идёт' });
    if (lobby.hostId !== socket.id) return cb && cb({ error: 'Только ведущий может использовать эту функцию' });
    lobby.usedContacts = lobby.usedContacts || [];
    if (lobby.usedContacts.includes(messageId)) return cb && cb({ error: 'Контакт уже был по этому сообщению' });
    const msg = (lobby.chat || []).find(m => m.id === messageId);
    if (!msg) return cb && cb({ error: 'Сообщение не найдено' });
    const word = msg.text.trim().toLowerCase();
    if (lobby.game.usedWords.includes(word)) return cb && cb({ error: 'Это слово уже использовано' });
    // Если нет активного контакта — создаём контакт между ведущим и игроком
    if (!lobby.contact || lobby.contact.finished) {
      const contact = {
        messageId,
        from: lobby.hostId,
        to: msg.userId,
        words: {},
        timer: null as NodeJS.Timeout | null,
        expiresAt: Date.now() + 20000,
        finished: false,
        hostInvolved: true,
      };
      lobby.contact = contact;
      io.to(code).emit('contactStarted', { from: lobby.hostId, to: msg.userId, messageId, expiresAt: contact.expiresAt, hostInvolved: true });
      // Таймер
      contact.timer = setTimeout(() => {
        contact.finished = true;
        lobby.usedContacts!.push(messageId);
        const fromPlayer = lobby.players.find(p => p.id === contact.from);
        const toPlayer = lobby.players.find(p => p.id === contact.to);
        io.to(code).emit('contactFinished', {
          words: contact.words,
          from: contact.from,
          to: contact.to,
          fromName: fromPlayer?.name || 'Ведущий',
          toName: toPlayer?.name || 'Игрок',
          hostInvolved: true,
        });
      }, 20000);
      cb && cb({ ok: true });
      return;
    }
    // Если уже идёт контакт между двумя игроками — втроём
    if (lobby.contact && !lobby.contact.finished && !lobby.contact.hostInvolved) {
      lobby.contact.hostInvolved = true;
      lobby.contact.hostWord = undefined;
      io.to(code).emit('contactUpdate', { words: lobby.contact.words, hostInvolved: true });
      // Таймер остаётся прежним
      cb && cb({ ok: true });
      return;
    }
    cb && cb({ error: 'Контакт уже с ведущим или завершён' });
  });

  // Открыть всё слово (завершить игру)
  socket.on('revealAll', ({ code }, cb) => {
    code = code.toUpperCase();
    const lobby = lobbies[code];
    if (!lobby || !lobby.game || !lobby.game.word) return cb && cb({ error: 'Нет игры' });
    if (socket.id !== lobby.hostId) return cb && cb({ error: 'Только ведущий может завершить' });
    lobby.game.revealed = lobby.game.word.length;
    lobby.contact = undefined;
    io.to(code).emit('updateLobby', lobby);
    cb && cb({ ok: true });
  });

  // Начать игру вдвоём
  socket.on('startDuoGame', ({ code, difficulty }, cb) => {
    code = code.toUpperCase();
    const lobby = lobbies[code];
    if (!lobby || lobby.hostId !== socket.id) return cb && cb({ error: 'Нет прав' });
    if (lobby.players.length !== 2) return cb && cb({ error: 'Режим дуэли только для 2 игроков' });
    
    const word = getRandomWord(difficulty);
    lobby.duoMode = true;
    lobby.game = {
      started: true,
      word: word,
      revealed: 1,
      usedWords: [],
      phase: 'playing'
    };
    io.to(code).emit('updateLobby', lobby);
    cb && cb({ ok: true, word });
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// SPA fallback (последний маршрут!)
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../public/index.html'));
});
