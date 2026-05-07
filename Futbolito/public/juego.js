// ============================================
// JUEGO.JS - Lógica específica de página de juego
// Depende de client.js (debe cargarse después)
// ============================================

const urlParams = new URLSearchParams(window.location.search);
const roomCode = urlParams.get('room');

$(document).ready(function() {
    console.log('Juego iniciado');
    
    if (!roomCode) {
        window.location.href = 'menu.html';
        return;
    }
    
    modoJuego = "room";
    idPartida = roomCode;
    
    // Obtener nombre del sessionStorage (ya se pidió en crearSala o unirSala)
    nombreJugador = sessionStorage.getItem('nombreJugador') || "Jugador";
    
    // Ocultar modal de nombre y mostrar sala de espera
    $('#nameModal').addClass('hidden');
    $('#waitingRoom').removeClass('hidden');
    
    // Unirse a la sala con el nombre guardado
    socket.emit("joinGameRoom", { roomCode: roomCode, playerName: nombreJugador });
});
