// SPARK - Client Game Logic

const SERVER_URL = 'https://spark-game.onrender.com';

let socket;
let myRole = '';
let myName = '';
let roomCode = '';
let myTurn = false;
let autoRollTimer = null;
let isRolling = false;

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
    // Only start game if BOTH players are present
    if (room.host && room.guest) {
      startGame();
    } else {
      showLobby(roomCode);
    }
  });

  socket.on('player_joined', ({ name }) => {
    document.getElementById('guest-name').textContent = name;
    showToast(`${name} joined!`);
    // Guest joined — both now in room, start game!
    startGame();
  });

  socket.on('question_rolled', (data) => {
    // Stop auto roll timer
    if (autoRollTimer) clearTimeout(autoRollTimer);
    isRolling = true;

    // Slot machine animation
    animateRoll(data);
  });

  socket.on('turn_changed', ({ turn }) => {
    myTurn = (turn === myRole);
    updatePlayers();
  });

  socket.on('game_over', () => {
    if (autoRollTimer) clearTimeout(autoRollTimer);
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

// ── Slot Machine Animation ─────────────────────
function animateRoll(data) {
  const questionText = document.getElementById('question-text');
  const rollBtn = document.getElementById('roll-btn');
  const roundIndicator = document.getElementById('round-indicator');
  
  // Hide roll button during animation
  rollBtn.classList.add('hidden');
  
  // Slot machine spinning words
  const slotWords = [
    "🎲", "⚡", "🔥", "💫", "✨", "💥", "🎯",
    "Whoops...", "Oops!", "Ah!", "Hmm...", "Yikes!",
    "Wait for it...", "Almost...", "Here we go...",
    data.question // final answer
  ];
  
  let spinCount = 0;
  const maxSpins = 20;
  
  const spinInterval = setInterval(() => {
    const randomWord = slotWords[Math.floor(Math.random() * (slotWords.length - 1))];
    questionText.textContent = randomWord;
    spinCount++;
    
    // Slow down near the end
    if (spinCount > maxSpins - 5) {
      clearInterval(spinInterval);
      // Show actual question
      questionText.textContent = data.question;
      roundIndicator.innerHTML = `<span class="round-name">${data.round}</span>`;
      isRolling = false;
      
      // Schedule auto "Roll Next Question" after 10 seconds
      autoRollTimer = setTimeout(() => {
        rollBtn.textContent = 'Roll Next Question →';
        rollBtn.classList.remove('hidden');
      }, 10000);
    }
  }, 80);
}

// ── Game Actions ────────────────────────────────
function rollQuestion() {
  if (isRolling) return;
  socket.emit('roll');
}

function restartGame() {
  if (autoRollTimer) clearTimeout(autoRollTimer);
  location.reload();
}

function goBack() {
  if (socket) socket.disconnect();
  if (autoRollTimer) clearTimeout(autoRollTimer);
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
  
  if (!myTurn) {
    rollBtn.textContent = 'Roll Question';
    rollBtn.disabled = true;
    rollBtn.style.opacity = 0.5;
  } else {
    rollBtn.disabled = false;
    rollBtn.style.opacity = 1;
  }
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