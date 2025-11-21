import express from "express";
import http from "http";
import { Server } from "socket.io";
import { calculateScores } from "../gameLogic.js";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Servir archivos estáticos (sube 1 nivel desde server/ a Futbolito/, luego entra en public/)
app.use(express.static(resolve(__dirname, "../public")));

// Sistema de gestión de partidas y cola
const games = {};
const waitingQueue = []; // Cola de jugadores esperando

function makeGameId() {
  return `game_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function createNewGame(player1SocketId, player2SocketId) {
  const gameId = makeGameId();
  games[gameId] = {
    team1: [player1SocketId],
    team2: [player2SocketId],
    choices: { team1: null, team2: null },
    scores: { team1: 0, team2: 0 },
    round: 1,
    started: true
  };
  return gameId;
}

io.on("connection", (socket) => {
  console.log("Jugador conectado:", socket.id);

  socket.on("searchGame", () => {
    console.log(`${socket.id} busca partida`);

    if (waitingQueue.length > 0) {
      // Hay alguien esperando -> crear partida
      const player1SocketId = waitingQueue.shift();
      const player2SocketId = socket.id;

      const gameId = createNewGame(player1SocketId, player2SocketId);

      // Notificar a ambos
      io.to(player1SocketId).emit("playerNumber", 1);
      io.to(player1SocketId).emit("joined", { gameId, team: 1, round: 1, scores: { team1: 0, team2: 0 } });
      io.to(player1SocketId).emit("gameStart", { round: 1 });

      io.to(player2SocketId).emit("playerNumber", 2);
      io.to(player2SocketId).emit("joined", { gameId, team: 2, round: 1, scores: { team1: 0, team2: 0 } });
      io.to(player2SocketId).emit("gameStart", { round: 1 });

      // Hacer que se unan a la sala de Socket.IO
      io.sockets.sockets.get(player1SocketId).join(gameId);
      io.sockets.sockets.get(player2SocketId).join(gameId);

      console.log(`Partida ${gameId} creada: ${player1SocketId} vs ${player2SocketId}`);
    } else {
      // Nadie esperando -> añadir a cola
      waitingQueue.push(socket.id);
      socket.emit("inQueue", { position: waitingQueue.length, message: `Estás en la cola. Posición: ${waitingQueue.length}` });
      console.log(`${socket.id} añadido a la cola. Cola: ${waitingQueue.length}`);

      // Notificar actualizaciones de cola cada segundo
      const queueCheckInterval = setInterval(() => {
        const position = waitingQueue.indexOf(socket.id);
        if (position !== -1) {
          socket.emit("queueUpdate", { position: position + 1, queueLength: waitingQueue.length });
        } else {
          clearInterval(queueCheckInterval);
        }
      }, 1000);
    }
  });

  socket.on("submitChoice", ({ gameId, team, choice }) => {
    const game = games[gameId];
    if (!game) return socket.emit("error", "Partida no encontrada");

    game.choices[`team${team}`] = choice;

    // Si ambos han enviado, resolver ronda
    if (game.choices.team1 && game.choices.team2) {
      const scores = calculateScores(
        { shoot: game.choices.team1, defend: null },
        { shoot: game.choices.team2, defend: null }
      );

      game.scores.team1 += scores.player1.goal ? 1 : 0;
      game.scores.team2 += scores.player2.goal ? 1 : 0;

      io.to(gameId).emit("gameResult", {
        round: game.round,
        player1: scores.player1,
        player2: scores.player2,
        scores: { team1: game.scores.team1, team2: game.scores.team2 },
        winner: scores.winner
      });

      game.choices = { team1: null, team2: null };
      game.round++;

      if (game.round > 5) {
        let finalWinner = "Empate";
        if (game.scores.team1 > game.scores.team2) finalWinner = "Equipo 1";
        else if (game.scores.team2 > game.scores.team1) finalWinner = "Equipo 2";

        io.to(gameId).emit("gameEnd", { scores: game.scores, winner: finalWinner });
        delete games[gameId];
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("Jugador desconectado:", socket.id);

    // Remover de cola si estaba
    const queueIndex = waitingQueue.indexOf(socket.id);
    if (queueIndex !== -1) {
      waitingQueue.splice(queueIndex, 1);
      console.log(`${socket.id} removido de la cola`);
    }

    // Remover de partidas
    for (const gameId of Object.keys(games)) {
      const g = games[gameId];
      g.team1 = g.team1.filter(id => id !== socket.id);
      g.team2 = g.team2.filter(id => id !== socket.id);
      if (g.team1.length === 0 && g.team2.length === 0) delete games[gameId];
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Servidor activo en el puerto ${PORT} ⚽`));
