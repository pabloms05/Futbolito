// ============================================
// SALA.JS - Lógica específica de Crear Sala
// Depende de client.js (debe cargarse después)
// ============================================

let roomCode = null;

$(document).ready(function() {
    console.log('Crear Sala iniciado');
    
    // Eventos específicos de crear sala
    $('#createRoomBtn').on('click', function() {
        const nombre = $('#playerNameInput').val().trim();
        if (nombre) {
            nombreJugador = nombre;
            sessionStorage.setItem('nombreJugador', nombre);
            socket.emit("createRoom", nombre);
        } else {
            alert('Por favor, ingresa tu nombre');
        }
    });
    
    $('#playerNameInput').on('keypress', function(e) {
        if (e.which === 13) $('#createRoomBtn').click();
    });

    $('#copyBtn').on('click', function() {
        navigator.clipboard.writeText(roomCode).then(() => {
            const btn = $('#copyBtn');
            const originalText = btn.text();
            btn.text('✓');
            btn.css('background', 'rgba(67, 233, 123, 0.8)');
            setTimeout(() => {
                btn.text(originalText);
                btn.css('background', 'rgba(255, 255, 255, 0.3)');
            }, 2000);
        });
    });

    $('#cancelRoom').on('click', function() {
        if (confirm('¿Seguro que quieres cancelar la sala?')) {
            socket.emit("cancelRoom", roomCode);
            window.location.href = 'menu.html';
        }
    });
});

// Eventos específicos de sala
socket.on("roomCreated", (data) => {
    roomCode = data.code;
    $('#nameSection').addClass('hidden');
    $('#roomSection').removeClass('hidden');
    $('#roomCode').text(roomCode);
    $('#yourName').text(nombreJugador);
    console.log('Sala creada:', roomCode);
});

socket.on("playerJoinedRoom", (data) => {
    $('#waitingText').text(`¡${data.playerName} se ha unido!`);
    $('#roomStatus').text('Completo - Iniciando...');
    setTimeout(() => {
        window.location.href = `juego.html?room=${roomCode}`;
    }, 2000);
});

socket.on("error", (message) => {
    alert(message);
});
