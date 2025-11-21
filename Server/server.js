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
// Estructura: { gameId: { players: [id1, id2], choices: {}, names: {} } }

io.on("connection", (socket) => {
  console.log("Jugador conectado:", socket.id);

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

        io.to(gameId).emit("playerJoined", game.players.length);
        console.log(`Jugador ${socket.id} eliminado de partida ${gameId}`);
      }
    }
  });
});

server.listen(3000, () =>
  console.log("Servidor activo en el puerto 3000 ⚽")
);
