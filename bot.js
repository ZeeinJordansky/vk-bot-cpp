const { VK } = require('vk-io');
const dotenv = require('dotenv');
const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

dotenv.config();

const vk = new VK({ token: process.env.VK_TOKEN });
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let isBotRunning = true;
let stats = { messages: 0, gamesPlayed: 0 };

// WebSocket для реального времени
wss.on('connection', (ws) => {
  console.log('Client connected to panel');
  ws.send(JSON.stringify({ type: 'stats', data: stats }));
});

// Простая игра
const games = new Map();

vk.updates.on('message', async (context) => {
  if (!isBotRunning) return;

  stats.messages++;
  const text = context.text.toLowerCase().trim();
  const peerId = context.peerId;

  // Рассылка обновлений в панель
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'log', data: `Сообщение от ${peerId}: ${text}` }));
    }
  });

  if (text === 'игра') {
    const number = Math.floor(Math.random() * 100) + 1;
    games.set(peerId, { number, attempts: 0 });
    return context.send('Я загадал число от 1 до 100. Угадай!');
  }

  if (games.has(peerId)) {
    const game = games.get(peerId);
    const guess = parseInt(text);

    if (isNaN(guess)) return context.send('Введи число!');

    game.attempts++;

    if (guess === game.number) {
      stats.gamesPlayed++;
      games.delete(peerId);
      return context.send(`Поздравляю! Угадал за ${game.attempts} попыток! 🎉`);
    } else if (guess < game.number) {
      return context.send(`Мало! Попыток: ${game.attempts}`);
    } else {
      return context.send(`Много! Попыток: ${game.attempts}`);
    }
  }

  if (text === 'стоп' && games.has(peerId)) {
    games.delete(peerId);
    return context.send('Игра остановлена.');
  }

  // Echo
  context.send(`Эхо: ${context.text}`);
});

// Веб-панель
app.use(express.static(path.join(__dirname, 'panel')));

app.get('/api/stats', (req, res) => {
  res.json(stats);
});

app.post('/api/toggle', (req, res) => {
  isBotRunning = !isBotRunning;
  res.json({ running: isBotRunning });
});

app.post('/api/send', async (req, res) => {
  // TODO: отправка сообщения
  res.json({ success: true });
});

server.listen(3000, () => {
  console.log('Бот + панель запущены на http://localhost:3000');
  vk.updates.start().catch(console.error);
});
