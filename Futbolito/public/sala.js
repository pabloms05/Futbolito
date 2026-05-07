// ============================================
// SALA.JS - Lógica específica de Crear Sala
// Depende de client.js (debe cargarse después)
// ============================================

let roomCode = null;

$(document).ready(function() {
    console.log('Crear Sala iniciado');
    
    // Eventos específicos de crear sala
    $('#createRoomBtn').on('click', function() {
        let nombre = $('#playerNameInput').val().trim();
        if (nombre) {
            // Capitalizar primera letra de cada palabra y limitar a 20 caracteres
            nombre = nombre.substring(0, 20)
                .toLowerCase()
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            nombreJugador = nombre;
            sessionStorage.setItem('nombreJugador', nombre);
            socket.emit("createRoom", nombre);
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'Nombre requerido',
                text: 'Por favor, ingresa tu nombre para crear la sala',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#3085d6'
            });
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
        Swal.fire({
            title: '¿Cancelar sala?',
            text: '¿Estás seguro de que quieres cancelar la sala?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, cancelar',
            cancelButtonText: 'No'
        }).then((result) => {
            if (result.isConfirmed) {
                socket.emit("cancelRoom", roomCode);
                window.location.href = 'menu.html';
            }
        });
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
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#3085d6'
    });
});
