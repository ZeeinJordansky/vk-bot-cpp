const { VK } = require('vk-io');
const dotenv = require('dotenv');
const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

dotenv.config();

const vk = new VK({ token: process.env.VK_TOKEN });
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let isBotRunning = true;
let stats = { messages: 0, gamesPlayed: 0 };

// WebSocket
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'stats', data: stats }));
});

// Игры
const games = new Map();

vk.updates.on('message', async (context) => {
  if (!isBotRunning) return;
  stats.messages++;

  const text = context.text.toLowerCase().trim();
  const peerId = context.peerId;

  wss.clients.forEach(client => client.readyState === WebSocket.OPEN && client.send(JSON.stringify({ type: 'log', data: `📨 ${peerId}: ${text}` })));

  // Команды
  if (text === 'игра') {
    const number = Math.floor(Math.random() * 100) + 1;
    games.set(peerId, { type: 'guess', number, attempts: 0 });
    return context.send('🎲 Я загадал число от 1 до 100!');
  }

  if (text === 'виселица') {
    const word = ['привет', 'бот', 'игра', 'победа'][Math.floor(Math.random()*4)];
    games.set(peerId, { type: 'hangman', word, guessed: new Set(), attempts: 6 });
    return context.send('Виселица! Угадай слово. 6 попыток.');
  }

  if (games.has(peerId)) {
    const game = games.get(peerId);
    if (game.type === 'guess') {
      // ... guess logic (as before)
      const guess = parseInt(text);
      if (!isNaN(guess)) {
        game.attempts++;
        if (guess === game.number) {
          stats.gamesPlayed++;
          games.delete(peerId);
          return context.send(`🎉 Угадал за ${game.attempts}!`);
        }
        return context.send(guess < game.number ? '⬆️ Больше' : '⬇️ Меньше');
      }
    } else if (game.type === 'hangman') {
      // simple hangman logic
      // ...
    }
  }

  // Отправка фото
  if (text.includes('фото') || text.includes('картинка')) {
    return context.sendPhotos('https://picsum.photos/400/300');
  }

  context.send('Эхо: ' + context.text);
});

app.use(express.static('panel'));

app.get('/api/stats', (req, res) => res.json(stats));
app.post('/api/toggle', (req, res) => {
  isBotRunning = !isBotRunning;
  res.json({status: isBotRunning ? '🟢' : '🔴'});
});

server.listen(3000, () => {
  console.log('🚀 Бот + панель на http://localhost:3000');
  vk.updates.start();
});
