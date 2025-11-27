// ============================================
// UNIR.JS - Lógica específica de Unirse a Sala
// Depende de client.js (debe cargarse después)
// ============================================

let roomCode = "";

$(document).ready(function() {
    console.log('Unirse a Sala iniciado');
    
    // Convertir código a mayúsculas
    $('#roomCodeInput').on('input', function() {
        this.value = this.value.toUpperCase();
        $('#errorMessage').addClass('hidden');
    });

    $('#joinRoomBtn').on('click', function() {
        const nombre = $('#playerNameInput').val().trim();
        const codigo = $('#roomCodeInput').val().trim();
        
        if (!nombre) {
            alert('Por favor, ingresa tu nombre');
            return;
        }
        
        if (!codigo || codigo.length !== 6) {
            $('#errorMessage').removeClass('hidden');
            return;
        }
        
        nombreJugador = nombre;
        roomCode = codigo;
        sessionStorage.setItem('nombreJugador', nombre);
        
        $('#joinSection').addClass('hidden');
        $('#joiningSection').removeClass('hidden');
        socket.emit("joinRoom", { roomCode: codigo, playerName: nombre });
    });
    
    $('#playerNameInput, #roomCodeInput').on('keypress', function(e) {
        if (e.which === 13) $('#joinRoomBtn').click();
    });
});

// Eventos específicos de unirse
socket.on("roomJoined", (data) => {
    $('#joiningText').text('¡Sala encontrada! Iniciando partida...');
    setTimeout(() => {
        window.location.href = `juego.html?room=${roomCode}`;
    }, 1500);
});

socket.on("joinError", (message) => {
    $('#joiningSection').addClass('hidden');
    $('#joinSection').removeClass('hidden');
    $('#errorMessage').text('❌ ' + message).removeClass('hidden');
});

socket.on("error", (message) => {
    $('#joiningSection').addClass('hidden');
    $('#joinSection').removeClass('hidden');
    $('#errorMessage').text('❌ ' + message).removeClass('hidden');
});
