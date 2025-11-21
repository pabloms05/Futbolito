// Conexión Socket.IO
const socket = io();

// Variables globales
let numeroJugador = 0;
let fase = "chutar";
let tiro = null;
let defensa = null;
const idPartida = "demo";
let nombreJugador = "";

// Inicialización con jQuery cuando el documento esté listo
$(document).ready(function() {
    console.log('Cliente de Penaltis iniciado');
    
    // Verificar si viene desde "Jugar de Nuevo" (flag temporal en sessionStorage)
    const desdeJuegoNuevo = sessionStorage.getItem('juegoNuevo');
    const nombreGuardado = sessionStorage.getItem('nombreJugador');
    
    if (desdeJuegoNuevo && nombreGuardado) {
        // Viene del botón "Jugar de Nuevo", usar nombre guardado
        nombreJugador = nombreGuardado;
        $('#nameModal').addClass('hidden');
        // Limpiar flag
        sessionStorage.removeItem('juegoNuevo');
    } else {
        // Es una recarga normal o primera vez, limpiar y pedir nombre
        sessionStorage.removeItem('nombreJugador');
        sessionStorage.removeItem('juegoNuevo');
        $('#nameModal').removeClass('hidden');
    }
    
    inicializarEventos();
});

// Inicializar eventos
function inicializarEventos() {
    // Evento de reinicio usando jQuery
    $('#reset').on('click', function() {
        location.reload();
    });
    
    // Evento para enviar el nombre
    $('#submitName').on('click', function() {
        const nombre = $('#playerNameInput').val().trim();
        if (nombre) {
            nombreJugador = nombre;
            // Guardar en sessionStorage (se borra al cerrar pestaña/navegador)
            sessionStorage.setItem('nombreJugador', nombre);
            $('#nameModal').addClass('hidden');
            
            // Enviar nombre al servidor
            socket.emit("setPlayerName", { gameId: idPartida, nombre: nombreJugador });
        } else {
            alert('Por favor, ingresa un nombre');
        }
    });
    
    // Permitir enviar con Enter
    $('#playerNameInput').on('keypress', function(e) {
        if (e.which === 13) {
            $('#submitName').click();
        }
    });
}

// Unirse a la partida
socket.on("connect", () => {
    console.log('Conectado al servidor');
    socket.emit("joinGame", idPartida);
});

// Recibir número de jugador
socket.on("playerNumber", (num) => {
    numeroJugador = num;
    
    // Actualizar el título del modal
    $('#modalTitle').text(`Hola eres el Jugador ${numeroJugador}!!`);
    
    // Si ya tiene nombre guardado en la sesión, actualizar info y enviar al servidor
    if (nombreJugador) {
        $('#playerInfo').text(`${nombreJugador} (Jugador ${numeroJugador})`);
        socket.emit("setPlayerName", { gameId: idPartida, nombre: nombreJugador });
    }
    
    console.log(`Asignado como Jugador ${numeroJugador}`);
});

// Evento cuando el jugador establece su nombre
socket.on("playerNameSet", (data) => {
    const { hasOtherPlayer } = data;
    
    if (hasOtherPlayer) {
        $('#status').text(`Bien ${nombreJugador}, bienvenido al juego de penaltis, tu Contrincante está esperándote`);
    } else {
        $('#status').text(`Bien ${nombreJugador}, bienvenido al juego de penaltis, estamos esperando al Contrincante`);
    }
    
    $('#playerInfo').text(`${nombreJugador} (Jugador ${numeroJugador})`);
});

// Iniciar juego
socket.on("gameStart", () => {
    fase = "chutar";
    $('#status').text(`Jugador ${numeroJugador}: elige dónde tirar`);
    crearPorteria();
    console.log('Juego iniciado');
});

// Mostrar resultados
socket.on("gameResult", (data) => {
    const { player1, player2, winner } = data;
    
    // Crear parámetros para la URL incluyendo nombres
    const params = new URLSearchParams({
        p1Name: player1.name || 'Jugador 1',
        p1Score: player1.score,
        p1Shoot: JSON.stringify(player1.shoot),
        p1Defend: JSON.stringify(player1.defend),
        p2Name: player2.name || 'Jugador 2',
        p2Score: player2.score,
        p2Shoot: JSON.stringify(player2.shoot),
        p2Defend: JSON.stringify(player2.defend),
        winner: winner
    });
    
    // Redirigir a la página de resultados
    window.location.href = `resultado.html?${params.toString()}`;
    
    console.log('Resultado del juego:', data);
});

// Crear 9 círculos sobre la portería usando jQuery y DOM
function crearPorteria() {
    const $porteria = $('#goal');
    
    // Limpiar portería usando jQuery
    $porteria.empty();
    
    const alturas = ["alta", "media", "baja"];
    const direcciones = ["izquierda", "centro", "derecha"];

    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            // Crear elemento usando DOM
            const circulo = document.createElement("div");
            circulo.className = "goal-circle";
            
            // Asignar datos usando jQuery
            $(circulo).data('altura', alturas[i]);
            $(circulo).data('direccion', direcciones[j]);

            // Event listener usando jQuery
            $(circulo).on('click', function() {
                seleccionarPosicion($(this));
            });
            
            // Añadir a la portería usando DOM
            $porteria.append(circulo);
        }
    }
}

// Manejo de selección usando jQuery y DOM
function seleccionarPosicion($circulo) {
    if (fase === "finalizado") return;

    // Remover iconos anteriores usando jQuery
    $('.goal-circle .icon').remove();

    // Crear icono usando DOM
    const icono = document.createElement("span");
    icono.className = "icon";

    if (fase === "chutar") {
        icono.textContent = "⚽";
        
        // Guardar tiro usando jQuery data()
        tiro = { 
            height: $circulo.data('altura'), 
            direction: $circulo.data('direccion') 
        };
        
        fase = "defender";
        $('#status').text(`Jugador ${numeroJugador}: ahora elige dónde parar`);
        
        console.log('Tiro seleccionado:', tiro);
        
    } else if (fase === "defender") {
        icono.textContent = "🧤";
        
        // Guardar defensa usando jQuery data()
        defensa = { 
            height: $circulo.data('altura'), 
            direction: $circulo.data('direccion') 
        };
        
        fase = "finalizado";
        $('#status').text("Esperando al otro jugador...");
        
        console.log('Defensa seleccionada:', defensa);
        
        // Enviar elección al servidor
        socket.emit("makeChoice", { 
            gameId: idPartida, 
            shoot: tiro, 
            defend: defensa 
        });
    }

    // Añadir icono usando jQuery
    $circulo.append(icono);

    // Animación usando API de animación web (nativa del DOM)
    icono.animate([
        { transform: "translateY(-50px) scale(0.8)", opacity: 0.7 },
        { transform: "translateY(0px) scale(1.2)", opacity: 1 }
    ], { 
        duration: 600, 
        easing: "ease-out" 
    });
}
