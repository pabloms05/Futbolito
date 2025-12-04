import express from "express";
import http from "http";
import { Server } from "socket.io";
import { calculateScores } from "./gameLogic.js";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);

app.use(express.static(resolve(__dirname, "../public")));

const io = new Server(server);

let games = {}; 
// Estructura: { gameId: { players: [id1, id2], choices: {}, names: {}, type: 'room'|'random' } }
let waitingPlayers = []; // Cola de jugadores esperando partida random
let rooms = {}; // { roomCode: { creator: socketId, creatorName: string, status: 'waiting'|'playing' } }

// Generar código de sala único
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  do {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (rooms[code]); // Asegurar que sea único
  return code;
}

io.on("connection", (socket) => {
  console.log("Jugador conectado:", socket.id);

  // Sistema de salas privadas
  socket.on("createRoom", (playerName) => {
    const roomCode = generateRoomCode();
    
    rooms[roomCode] = {
      creator: socket.id,
      creatorName: playerName,
      status: 'waiting'
    };

    games[roomCode] = {
      players: [socket.id],
      choices: {},
      names: { [socket.id]: playerName },
      type: 'room'
    };

    socket.join(roomCode);
    socket.emit("roomCreated", { code: roomCode });
    socket.emit("playerNumber", 1);
    
    console.log(`Sala ${roomCode} creada por ${playerName}`);
  });

  socket.on("joinRoom", ({ roomCode, playerName }) => {
    const room = rooms[roomCode];
    const game = games[roomCode];

    if (!room || !game) {
      socket.emit("joinError", "Sala no encontrada");
      return;
    }

    if (game.players.length >= 2) {
      socket.emit("joinError", "La sala está llena");
      return;
    }

    game.players.push(socket.id);
    game.names[socket.id] = playerName;
    socket.join(roomCode);

    // Notificar al creador
    io.to(room.creator).emit("playerJoinedRoom", { playerName });
    
    socket.emit("roomJoined", { code: roomCode });
    socket.emit("playerNumber", 2);

    // Iniciar juego
    rooms[roomCode].status = 'playing';
    setTimeout(() => {
      io.to(roomCode).emit("gameStart");
      io.to(roomCode).emit("gameIdAssigned", roomCode);
    }, 2000);

    console.log(`${playerName} se unió a sala ${roomCode}`);
  });

  socket.on("cancelRoom", (roomCode) => {
    delete rooms[roomCode];
    delete games[roomCode];
    console.log(`Sala ${roomCode} cancelada`);
  });

  // Sistema de partidas random
  socket.on("joinRandom", (playerName) => {
    waitingPlayers.push({ id: socket.id, name: playerName });
    console.log(`${playerName} esperando partida random. En cola: ${waitingPlayers.length}`);

    // Si hay al menos 2 jugadores esperando, emparejarlos
    if (waitingPlayers.length >= 2) {
      const p1 = waitingPlayers.shift();
      const p2 = waitingPlayers.shift();

      const gameId = `random_${Date.now()}`;
      
      games[gameId] = {
        players: [p1.id, p2.id],
        choices: {},
        names: { [p1.id]: p1.name, [p2.id]: p2.name },
        type: 'random'
      };

      io.to(p1.id).emit("gameIdAssigned", gameId);
      io.to(p2.id).emit("gameIdAssigned", gameId);

      io.sockets.sockets.get(p1.id)?.join(gameId);
      io.sockets.sockets.get(p2.id)?.join(gameId);

      io.to(p1.id).emit("playerNumber", 1);
      io.to(p2.id).emit("playerNumber", 2);

      setTimeout(() => {
        io.to(gameId).emit("gameStart");
      }, 1000);

      console.log(`Partida random ${gameId} iniciada: ${p1.name} vs ${p2.name}`);
    }
  });

  socket.on("cancelWaiting", () => {
    waitingPlayers = waitingPlayers.filter(p => p.id !== socket.id);
    console.log(`Jugador ${socket.id} salió de la cola`);
  });

  // Unirse a sala de juego (desde juego.html)
  socket.on("joinGameRoom", ({ roomCode, playerName }) => {
    const game = games[roomCode];
    if (!game) return;

    socket.join(roomCode);
    
    const playerIndex = game.players.indexOf(socket.id);
    if (playerIndex === -1) {
      // Jugador no estaba en la lista, agregarlo
      if (game.players.length < 2) {
        game.players.push(socket.id);
        game.names[socket.id] = playerName;
      }
    }

    const playerNumber = game.players.indexOf(socket.id) + 1;
    socket.emit("playerNumber", playerNumber);
    socket.emit("gameIdAssigned", roomCode);

    if (game.players.length === 2) {
      setTimeout(() => {
        io.to(roomCode).emit("gameStart");
      }, 500);
    }
  });

  // Sistema original (compatibilidad con index.html)

  socket.on("joinGame", (gameId) => {
    if (!games[gameId])
      games[gameId] = { players: [], choices: {}, names: {} };

    const game = games[gameId];

    console.log(`Jugador ${socket.id} quiere unirse a la partida ${gameId}`);

    if (game.players.length < 2) {
      game.players.push(socket.id);
      socket.join(gameId);

      // Enviar número de jugador (1 o 2)
      io.to(socket.id).emit("playerNumber", game.players.length);
      io.to(gameId).emit("playerJoined", game.players.length);

      console.log(`Jugadores actuales en ${gameId}:`, game.players);

      if (game.players.length === 2) {
        console.log(`Partida ${gameId} lista: empezando...`);
        io.to(gameId).emit("gameStart");
      }
    } else {
      socket.emit("error", "El juego está lleno");
    }
  });

  socket.on("setPlayerName", ({ gameId, nombre }) => {
    const game = games[gameId];
    if (!game) return;

    game.names[socket.id] = nombre;
    
    // Verificar si el otro jugador ya tiene nombre
    const hasOtherPlayer = game.players.length === 2;
    
    io.to(socket.id).emit("playerNameSet", { hasOtherPlayer });
    
    console.log(`Jugador ${socket.id} se llama: ${nombre}`);
  });

  socket.on("makeChoice", ({ gameId, shoot, defend }) => {
    const game = games[gameId];
    if (!game) return;

    // Guardamos la elección del jugador
    game.choices[socket.id] = { shoot, defend };

    // Cuando ambos jugadores envían elección
    if (Object.keys(game.choices).length === 2) {
      const [p1, p2] = game.players;

      // Calcular puntuaciones correctamente: el defensor recibe puntos
      const result = calculateScores(
        { shoot: game.choices[p1].shoot, defend: game.choices[p1].defend },
        { shoot: game.choices[p2].shoot, defend: game.choices[p2].defend }
      );

      // Agregar nombres de jugadores al resultado
      result.player1.name = game.names[p1] || 'Jugador 1';
      result.player2.name = game.names[p2] || 'Jugador 2';
      
      // Actualizar el texto del ganador con el nombre real
      if (result.winner === 'Jugador 1') {
        result.winner = result.player1.name;
      } else if (result.winner === 'Jugador 2') {
        result.winner = result.player2.name;
      }

      // Enviar resultado a ambos jugadores
      io.to(gameId).emit("gameResult", result);
      console.log(`Resultado partida ${gameId}:`, result);

      // Reiniciar partida para próximas rondas
      delete games[gameId];
    }
  });

  socket.on("disconnect", () => {
    console.log("Jugador desconectado:", socket.id);

    for (const gameId in games) {
      const game = games[gameId];

      if (game.players.includes(socket.id)) {
        game.players = game.players.filter(id => id !== socket.id);
        delete game.choices[socket.id];
        delete game.names[socket.id];

        io.to(gameId).emit("playerJoined", game.players.length);
        console.log(`Jugador ${socket.id} eliminado de partida ${gameId}`);
      }
    }
  });
});

server.listen(3000, () =>
  console.log("Servidor activo en el puerto 3000 ⚽")
);
