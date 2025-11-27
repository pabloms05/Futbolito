// ============================================
// RANDOM.JS - Lógica específica de Partida Random
// Depende de client.js (debe cargarse después)
// ============================================

$(document).ready(function() {
    console.log('Partida Random iniciada');
    modoJuego = 'random';
    
    // Manejar nombre con callback para unirse a partida random
    manejarNombreJugador((nombre) => {
        socket.emit("joinRandom", nombre);
        $('#waitingRoom').removeClass('hidden');
    });
    
    // Setup eventos de nombre con lógica específica
    setupNombreEventos((nombre) => {
        socket.emit("joinRandom", nombre);
        $('#waitingRoom').removeClass('hidden');
    });
});
