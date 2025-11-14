const socket = io();
const goal = document.getElementById("goal");
const status = document.getElementById("status");
const result = document.getElementById("result");
const resetBtn = document.getElementById("reset");
const playerInfo = document.getElementById("playerInfo");

let playerNumber = 0;
let fase = "shoot"; 
let shoot = null;
let defend = null;
const gameId = "demo";

// Unirse a la partida
socket.on("connect", () => socket.emit("joinGame", gameId));

// Recibir número de jugador
socket.on("playerNumber", (num) => {
  playerNumber = num;
  playerInfo.textContent = `Eres el Jugador ${playerNumber}`;
});

// Iniciar juego
socket.on("gameStart", () => {
  fase = "shoot";
  status.textContent = `Jugador ${playerNumber}: elige dónde tirar`;
  crearPorteria();
});

// Mostrar resultados
socket.on("gameResult", (data) => {
  const { player1, player2, winner } = data;
  result.innerHTML = `
    Jugador 1: ${player1.score} pts<br>
    Jugador 2: ${player2.score} pts<br><br>
    🏆 Ganador: ${winner}
  `;
  resetBtn.classList.remove("hidden");
});

// Reiniciar
resetBtn.addEventListener("click", () => location.reload());

// Crear 9 círculos sobre la portería
function crearPorteria() {
  goal.innerHTML = "";
  const heights = ["alta","mitjana","baixa"];
  const directions = ["esquerra","centre","dreta"];

  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      const circle = document.createElement("div");
      circle.className = "goal-circle w-full h-full bg-white bg-opacity-30 rounded-full border-2 border-blue-500 flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-125 relative";
      circle.dataset.height = heights[i];
      circle.dataset.direction = directions[j];

      circle.addEventListener("click", () => seleccionar(circle));
      goal.appendChild(circle);
    }
  }
}

// Manejo de selección
function seleccionar(circle) {
  if (fase === "done") return;

  document.querySelectorAll(".goal-circle .icon").forEach(el => el.remove());

  const icon = document.createElement("span");
  icon.className = "icon text-4xl pointer-events-none absolute animate-fly";

  if (fase === "shoot") {
    icon.textContent = "⚽";
    shoot = { height: circle.dataset.height, direction: circle.dataset.direction };
    fase = "defend";
    status.textContent = "Ahora elige dónde parar";
  } else {
    icon.textContent = "🧤";
    defend = { height: circle.dataset.height, direction: circle.dataset.direction };
    fase = "done";
    status.textContent = "Esperando al otro jugador...";
    socket.emit("makeChoice", { gameId, shoot, defend });
  }

  circle.appendChild(icon);

  icon.animate([
    { transform: "translateY(-50px) scale(0.8)", opacity: 0.7 },
    { transform: "translateY(0px) scale(1.2)", opacity: 1 }
  ], { duration: 600, easing: "ease-out" });
}
