// SPARK - Client Game Logic
// Uses Socket.io client CDN

const SERVER_URL = 'https://cold-animals-pay.loca.lt';

let socket;
let myRole = '';
let myName = '';
let roomCode = '';
let currentQuestion = 0;
let myTurn = false;

// ── Create Room ─────────────────────────────────────
async function createRoom() {
  myName = document.getElementById('name-input').value.trim() || 'Player 1';
  if (!myName) { showToast('Enter your name'); return; }
  myRole = 'host';

  try {
    const res = await fetch(`${SERVER_URL}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostName: myName })
    });

    if (!res.ok) throw new Error('Failed to create room');
    const { code } = await res.json();
    roomCode = code;

    connectSocket();
    socket.emit('join_room', { code, name: myName, role: 'host' });
    showLobby(code);
  } catch (err) {
    showToast(err.message);
  }
}

// ── Join Room ───────────────────────────────────
async function joinRoom() {
  myName = document.getElementById('name-input').value.trim() || 'Player 2';
  myRole = 'guest';
  roomCode = document.getElementById('code-input').value.trim().toUpperCase();

  if (!myName) { showToast('Enter your name'); return; }
  if (!roomCode || roomCode.length !== 4) { showToast('Enter a valid code'); return; }

  try {
    const res = await fetch(`${SERVER_URL}/rooms/${roomCode}`);
    if (!res.ok) throw new Error('Room not found');
    
    connectSocket();
    socket.emit('join_room', { code: roomCode, name: myName, role: 'guest' });
  } catch (err) {
    showToast(err.message);
  }
}

// ── Connect Socket ─────────────────────────────
function connectSocket() {
  socket = io(SERVER_URL, {
    transports: ['websocket', 'polling']
  });

  socket.on('joined', ({ room, role }) => {
    myRole = role;
    document.getElementById('host-name').textContent = room.host;
    if (room.guest) document.getElementById('guest-name').textContent = room.guest;
    startGame();
  });

  socket.on('player_joined', ({ name }) => {
    document.getElementById('guest-name').textContent = name;
    showToast(`${name} joined!`);
  });

  socket.on('question_rolled', (data) => {
    currentQuestion = data.index;
    document.getElementById('question-text').textContent = data.question;
    document.getElementById('round-indicator').innerHTML = `
      <span class="round-name">${data.round}</span>
      <span class="question-num">${data.index + 1}/${data.total}</span>
    `;
    document.getElementById('roll-btn').classList.add('hidden');
    document.getElementById('next-btn').classList.remove('hidden');
  });

  socket.on('turn_changed', ({ turn }) => {
    myTurn = (turn === myRole);
    updatePlayers();
  });

  socket.on('game_over', () => {
    showScreen('end-screen');
  });

  socket.on('partner_disconnected', () => {
    showToast('Partner disconnected');
    setTimeout(() => location.reload(), 2000);
  });

  socket.on('error', ({ message }) => {
    showToast(message);
  });
}

// ── Game Actions ────────────────────────────────
function rollQuestion() {
  socket.emit('roll');
}

function nextTurn() {
  socket.emit('next_turn');
}

function restartGame() {
  location.reload();
}

// ── UI Functions ────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showLobby(code) {
  showScreen('lobby-screen');
  document.getElementById('display-code').textContent = code;
  document.getElementById('share-code').textContent = code;
}

function startGame() {
  showScreen('game-screen');
  myTurn = (myRole === 'host');
  updatePlayers();
}

function updatePlayers() {
  const hostEl = document.getElementById('host-player');
  const guestEl = document.getElementById('guest-player');
  
  hostEl.classList.toggle('active', myRole === 'host' && myTurn);
  guestEl.classList.toggle('active', myRole === 'guest' && myTurn);
  
  const rollBtn = document.getElementById('roll-btn');
  rollBtn.disabled = !myTurn;
  rollBtn.style.opacity = myTurn ? 1 : 0.5;
}

function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.style.display = 'block';
  setTimeout(() => toast.style.display = 'none', 3000);
}

// ── Initialize ───────────────────────────────────
document.getElementById('code-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') joinRoom();
});