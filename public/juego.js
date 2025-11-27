// ============================================
// JUEGO.JS - Lógica específica de página de juego
// Depende de client.js (debe cargarse después)
// ============================================

const urlParams = new URLSearchParams(window.location.search);
const roomCode = urlParams.get('room');

$(document).ready(function() {
    console.log('Juego iniciado');
    
    nombreJugador = sessionStorage.getItem('nombreJugador') || "Jugador";
    
    if (roomCode) {
        modoJuego = "room";
        idPartida = roomCode;
        socket.emit("joinGameRoom", { roomCode: roomCode, playerName: nombreJugador });
    } else {
        window.location.href = 'menu.html';
    }
});
