// Estado local de la selección usando DOM y jQuery
let currentSelection = {
    altura: null,
    direccion: null
};

// Inicialización cuando el documento esté listo
$(document).ready(function() {
    console.log('Juego de Penaltis - Interfaz del Cliente');
    initGame();
});

// Inicializar el juego
function initGame() {
    // Event listener para las celdas de la cuadrícula usando jQuery
    $('.grid-cell').on('click', function() {
        handleCellClick($(this));
    });
}

// Manejar clic en celda de la cuadrícula
function handleCellClick($cell) {
    const altura = $cell.data('altura');
    const direccion = $cell.data('direccion');
    
    // Remover selección anterior usando jQuery
    $('.grid-cell').removeClass('selected');
    
    // Marcar la celda seleccionada
    $cell.addClass('selected');
    
    // Guardar la selección
    currentSelection = {
        altura: altura,
        direccion: direccion
    };
    
    // Actualizar UI usando DOM
    updateSelectionDisplay();
    
    console.log('Selección actual:', currentSelection);
    
    // Aquí el servidor se encargará de enviar esta selección
    // mediante Socket.IO (implementación futura)
}

// Actualizar el display de la selección actual
function updateSelectionDisplay() {
    const selectionText = `${currentSelection.direccion} - ${currentSelection.altura}`;
    $('#current-selection').text(selectionText);
}

// Función para limpiar la selección
function clearSelection() {
    $('.grid-cell').removeClass('selected');
    currentSelection = {
        altura: null,
        direccion: null
    };
    $('#current-selection').text('Ninguna');
}

// Función para obtener la selección actual (para enviar al servidor)
function getSelection() {
    return currentSelection;
}

// Exportar funciones para uso externo
window.currentSelection = currentSelection;
window.getSelection = getSelection;
window.clearSelection = clearSelection;