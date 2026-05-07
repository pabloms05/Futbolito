// ============================================
// CLIENT.JS - ARCHIVO PRINCIPAL
// Maneja toda la lógica común del juego
// ============================================

// Conexión Socket.IO (global para todas las páginas)
let socket;
try {
    socket = io();
} catch (err) {
    console.error('No se pudo cargar Socket.IO', err);
    if (window.Swal) {
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo establecer la conexión con el servidor. Revisa tu red e inténtalo de nuevo.',
            confirmButtonText: 'Reintentar',
            confirmButtonColor: '#3085d6'
        }).then(() => location.reload());
    } else {
        alert('No se pudo conectar con el servidor. Revisa tu red e inténtalo de nuevo.');
        location.reload();
    }
}

// Variables globales compartidas
let numeroJugador = 0;
let fase = "chutar";
let tiro = null;
let defensa = null;
let idPartida = null;
let nombreJugador = "";
let modoJuego = "";

// ============================================
// FUNCIONES COMUNES - USADAS POR TODAS LAS PÁGINAS
// ============================================

// Crear portería (común para todas las páginas de juego)
function crearPorteria() {
    const $porteria = $('#goal');
    if (!$porteria.length) return;
    
    $porteria.empty();
    
    const alturas = ["alta", "media", "baja"];
    const direcciones = ["izquierda", "centro", "derecha"];

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            const circulo = document.createElement("div");
            circulo.className = "goal-circle";
            
            $(circulo).data('altura', alturas[i]);
            $(circulo).data('direccion', direcciones[j]);
            $(circulo).on('click', function() {
                seleccionarPosicion($(this));
            });
            
            $porteria.append(circulo);
        }
    }
}

// Seleccionar posición en la portería
function seleccionarPosicion($circulo) {
    if (fase === "finalizado") return;

    $('.goal-circle .icon').remove();

    const icono = document.createElement("span");
    icono.className = "icon";

    if (fase === "chutar") {
        icono.textContent = "⚽";
        tiro = { 
            height: $circulo.data('altura'), 
            direction: $circulo.data('direccion') 
        };
        
        $circulo.addClass('shoot-ball selected');
        setTimeout(() => $circulo.removeClass('shoot-ball'), 800);
        
        fase = "defender";
        $('#status').text('Ahora elige dónde parar');
        console.log('Tiro seleccionado:', tiro);
        
    } else if (fase === "defender") {
        icono.textContent = "🧤";
        defensa = { 
            height: $circulo.data('altura'), 
            direction: $circulo.data('direccion') 
        };
        
        $circulo.addClass('save-glove selected');
        setTimeout(() => $circulo.removeClass('save-glove'), 600);
        
        fase = "finalizado";
        $('#status').text("Esperando al otro jugador...");
        console.log('Defensa seleccionada:', defensa);
        
        socket.emit("makeChoice", { 
            gameId: idPartida, 
            shoot: tiro, 
            defend: defensa 
        });
    }

    $circulo.append(icono);
}

// Manejar nombre del jugador
function manejarNombreJugador(callback) {
    const desdeJuegoNuevo = sessionStorage.getItem('juegoNuevo');
    const nombreGuardado = sessionStorage.getItem('nombreJugador');
    
    if (desdeJuegoNuevo && nombreGuardado) {
        nombreJugador = nombreGuardado;
        $('#nameModal').addClass('hidden');
        sessionStorage.removeItem('juegoNuevo');
        if (callback) callback(nombreJugador);
    } else {
        sessionStorage.removeItem('nombreJugador');
        sessionStorage.removeItem('juegoNuevo');
        $('#nameModal').removeClass('hidden');
    }
}

// Eventos comunes de nombre
function setupNombreEventos(onNombreSubmit) {
    $('#submitName').on('click', function() {
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
            $('#nameModal').addClass('hidden');
            if (onNombreSubmit) onNombreSubmit(nombre);
        } else {
            Swal.fire({
                icon: 'warning',
                title: 'Nombre requerido',
                text: 'Por favor, ingresa tu nombre para continuar',
                confirmButtonText: 'Entendido',
                confirmButtonColor: '#3085d6'
            });
        }
    });
    
    $('#playerNameInput').on('keypress', function(e) {
        if (e.which === 13) $('#submitName').click();
    });
}

// ============================================
// SOCKET.IO - EVENTOS COMUNES
// ============================================

socket.on("connect", () => {
    console.log('Conectado al servidor');
});

socket.on("playerNumber", (num) => {
    numeroJugador = num;
    $('#modalTitle').text(`Hola eres el Jugador ${numeroJugador}!!`);
    
    if (nombreJugador) {
        $('#playerInfo').text(`${nombreJugador}`);
    }
    
    console.log(`Asignado como Jugador ${numeroJugador}`);
});

socket.on("playerNameSet", (data) => {
    const { hasOtherPlayer } = data;
    
    if (hasOtherPlayer) {
        $('#status').text(`Bien ${nombreJugador}, tu Contrincante está esperándote`);
    } else {
        $('#status').text(`Bien ${nombreJugador}, estamos esperando al Contrincante`);
    }
    
    $('#playerInfo').text(`${nombreJugador}`);
});

socket.on("gameIdAssigned", (gameId) => {
    idPartida = gameId;
    console.log('ID de partida asignado:', idPartida);
});

socket.on("gameStart", () => {
    $('#waitingRoom').addClass('hidden');
    fase = "chutar";
    $('#status').text('Elige dónde tirar');
    crearPorteria();
    console.log('Juego iniciado');
});

socket.on("gameResult", (data) => {
    const { player1, player2, winner } = data;
    
    const params = new URLSearchParams({
        p1Name: player1.name || 'Jugador 1',
        p1Score: player1.score,
        p1Shoot: JSON.stringify(player1.shoot),
        p1Defend: JSON.stringify(player1.defend),
        p2Name: player2.name || 'Jugador 2',
        p2Score: player2.score,
        p2Shoot: JSON.stringify(player2.shoot),
        p2Defend: JSON.stringify(player2.defend),
        winner: winner,
        mode: modoJuego || 'normal',
        room: idPartida || ''
    });
    
    window.location.href = `resultado.html?${params.toString()}`;
    console.log('Resultado del juego:', data);
});

socket.on("waitingForOtherPlayer", () => {
    $('#status').text("Esperando a que el otro jugador se una...");
    console.log('Esperando al otro jugador para reiniciar');
});

socket.on("joinError", (message) => {
    Swal.fire({
        icon: 'error',
        title: 'Error al unirse',
        text: message,
        confirmButtonText: 'Ir al menú',
        confirmButtonColor: '#3085d6'
    }).then(() => {
        window.location.href = 'menu.html';
    });
});

// Aviso proactivo al cerrar/navegar fuera (mejora la rapidez de notificación)
function avisarSalidaPartida() {
    try { socket.emit('playerLeaving'); } catch (e) {}
}

// 'pagehide' funciona mejor en móvil/Safari; 'beforeunload' como respaldo
window.addEventListener('pagehide', avisarSalidaPartida);
window.addEventListener('beforeunload', avisarSalidaPartida);
socket.on("playerDisconnected", (data) => {
    const { playerName } = data;
    
    // Mostrar alerta con SweetAlert
    Swal.fire({
        icon: 'warning',
        title: 'Jugador Desconectado',
        html: `<strong>${playerName}</strong> se ha desconectado de la partida.<br><br>Volviendo al menú...`,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: true,
        confirmButtonText: 'Volver al Menú',
        confirmButtonColor: '#3085d6',
        allowOutsideClick: false,
        didOpen: () => {
            // Auto-redirect después de 3 segundos
            setTimeout(() => {
                window.location.href = 'menu.html';
            }, 3000);
        }
    }).then((result) => {
        // Si hace click en el botón, redirigir inmediatamente
        if (result.isConfirmed || result.dismiss === Swal.DismissReason.timer) {
            window.location.href = 'menu.html';
        }
    });
});

// ============================================
// EVENTOS BOTONES COMUNES
// ============================================

$(document).ready(function() {
    // Botón reset (común en varias páginas)
    $('#reset').on('click', function() {
        location.reload();
    });
    
    // Botón cancelar espera
    $('#cancelWaiting').on('click', function() {
        socket.emit("cancelWaiting");
        window.location.href = 'menu.html';
    });

    // no-op
});

