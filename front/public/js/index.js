// Game state variables
let gameHasStarted = false; // Indica si el juego a comenzado
let gameOver = false; // Si el juego ha terminado
let board = null; // Tablero de ajedrez
let game = new Chess(); // Instancia de Chess.js para gestionar las reglas del juego
//Chess.js maneja la lógica del juego, movimientos, validaciones, etc.

//  Elementos del DOM
const $status = $('#status'); // Estado del juego
const $pgn = $('#pgn'); // Notación del juego

/**
 * Inicializar el juego
 */
function initGame(){
    // Inicializar el tablero con la configuración
    const config = {
        draggable: true, // Permite arrastrar las piezas
        position: 'start', // Posición inicial del tablero
        onDragStart: onDragStart, // Función para manejar el inicio del arrastre de una pieza
        onDrop: onDrop, // Función para manejar cuando se suelta una pieza
        onSnapEnd: onSnapEnd, // Función para manejar el final de la animación de movimiento
        pieceTheme: '/public/img/chesspieces/wikipedia/{piece}.png',
    };
    board = ChessBoard('myboard', config); // Crea el tablero con ChessBoard.js
    // Darle vuelta al tablero para el usuario que lleva las piezas negras
    if (playerColor === 'black') {
        board.flip();
    }
    
    // Unirnos la sala de juego
    socket.emit('joinRoom', {
        code: gameCode,
        color: playerColor,
        timeControl: timeControl,
        username: playerUsername
    });
console.log('Game initialized',{
    color: playerColor,
    code: gameCode,
    timeControl: timeControl,
    username: playerUsername
});
};

// Eventos del socket handlers (Comunicación en tiempo real con los jugadores)
socket.on ('playersConnected', function(data) {
    console.log('Players connected:', data);
    $status.text(`Both players connected (${data.white} vs ${data.black}). Click ready when you want start! `);
    $('#readyButton').prop('disabled', false);
});

socket.on('bothPlayersReady', function () {
    console.log('Both players ready, game starting...');
    gameHasStarted = true; // Marca que el juego ha comenzado
    $status.text(`Game started! ${playerColor === 'white' ? 'You are playing with white pieces.' : 'You are playing with black pieces.'}`);
    $('#readyButton').text('Game in progress...').prop('disabled', true);
    // Actualiza la interfaz del tablero para indicar que el juego ha comenzado y deshabilita el botón de "Listo"
});

socket.on('move', function(moveData){
    console.log('Received move:', moveData);
    if (moveData.color !== playerColor) {
        const move =  {
            from: moveData.from,
            to: moveData.to,
            promotion: moveData.promotion || 'q' // Por defecto será la reina si no se especifica
        };
        game.move(move); // Realiza el movimiento en la instancia de Chess.js
        board.position(game.fen()); // Actualiza el tablero con la nueva posición (fen: es un formato para expresar una posición en el tablero)
        updateStatus(); // Actualiza el estado del juego
    }
});

socket.on('gameOver', function(data){
    gameOver = true; // Marca que el juego ha terminado
    $status.text('Game Over').prop ('disabled', true);
});

/**
 * Verificar si una pieza puede ser movida
 */
function onDragStart (source, piece, position, orientation) {
    // No tomar piezas si el juego ha terminado
    if(game.game_over() || gameOver) return false;
    // Solo el jugador cuyo turno es puede mover
    if(!gameHasStarted)return false;

    // Solo el jugador de las piezas blancas puedee moverlas piezas blancas
    if (playerColor === 'white' && piece.search (/^b/) !== -1) return false;
    // Solo el jugador de las piezas negras puede mover las piezas negras
    if (playerColor === 'black' && piece.search (/^w/) !== -1) return false;

    // Solo el jugador cuyo turno es puede mover
    if((game.turn()=== 'w' && playerColor === 'black') ||
       (game.turn() === 'b' && playerColor === 'white')) {
        return false;
    }
    return true; // Permite el movimiento de la pieza
}

/**
 * Manejar el evento de soltar una pieza en el tablero
 */
// Verificar si el movimiento es legal y comunicarlo al servidor
function onDrop(source, target) {
    // Intentar realizar el movimiento
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Por defecto será la reina si no se especifica
    });
    // Si el movimiento no es legal, se devuelva la pieza
    if(move === null) return 'snapback';// Devuelve la pieza a su posición original
        // Enviamos el movimiento al servidor para que el otro jugador lo vea
        socket.emit('move', {
            from: source,
            to: target,
            promotion: 'q' // Por defecto será la reina si no se especifica
        });
        updateStatus(); // Se actualiza el estado del juego
    }
// Se actualiza las posciones del tablero después de la animación de movimiento
function onSnapEnd() {
    board.position(game.fen()); // Se actualiza el tablero con la nueva posición
}
// Actualiza el estado del juego
function updateStatus(){
    let status = '';
    let moveColor = game.turn() === 'b' ? 'Black' :  'White'; // Determina el color del jugador que tiene el turno

    // Verificar si hay jaquemate
    if(game.in_checkmate()) {
        status = `Game over, ${moveColor} is in checkmate.`;
        // Emitir el evento de jaque mate al servidor
        socket.emit('checkmate',{
            winner: game.turn() === 'b' ? 'white' : 'black' // El ganador es el jugador que no está en jaque mate
        });
        gameOver = true; 
    }

    // Verificamos si hay empate (tablas)
    else if(game.in_draw()) {
        status = 'Game over, drawn position';
        socket.emit('draw') // Emitir el evento de empate al servidor
        gameOver = true;
    }
    // Verficar si el juego todavía está en curso
    else {
        status =  `${moveColor} to move`;
        // Verificar jaque mate
        if (game.in_check()) {
            status += `, ${moveColor} is in check`;
        }
    }
    $status.text(status); // Actualiza el estado del juego en la interfaz
    $pgn.text(game.pgn()); // Actualiza la notación del juego en la inferfaz

    // Inicializar el juego cuando la página cargue
    $(document).ready(function(){
        initGame(); // Llama a la función para inicializar el juego'
    });
    // Funcionalidad del chat
    function sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim(); // Obtener el mensaje del input y eliminar espacios en blanco
        if (message){
            socket.emit('chatMessage', {
                message: message,
                username: playerUsername   
            });
            input.value = ''; // Limpiar el input después de enviar el mensaje
        }

    }
    // Manejo de la tecla Enter para enviar mensajes
    document.getElementById('chatInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage(); // Llama a la función para enviar el mensaje
        }
    });

    // Manejar los mensajes del chat
    socket.on ('chatMessage', function(data){ 
        const chatMessages = document.getElementById('chatMessages'); // Obtener el contenedor de mensajes del chat
        const messageDiv = document.createElement('div'); // Crear un nuevo div para el mensaje
            messageDiv.textContent = `${data.username}: ${data.message}`; // Establecer el contenido del mensaje
            chatMessages.appendChild(messageDiv); // Añadir el mensaje al contenedor de mensajes
            chatMessages.scrollTop = chatMessages.scrollHeight; // Desplazar hacia abajo para mostrar el último mensaje
    });

    // Funcionalidad del temporizador 
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60; 
       return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`; // Formato MM:SS
    }
    //Actualizar el temporizador
    socket.on('updateTimers', function(data){
        document.getElemetById('whiteTimer').textContent = formatTime(data.whiteTime); // Tiempo del jugador blanco 
        document.getElementById('blackTimer').textContent = formatTime(data.blackTime); // Tiempo del jugador negro
    });
    // Manejador del botón "Ready"
    document.getElementById('readyButton').addEventListener('click', function(){
        socket.emit('playerReady');
        this.disabled = true; // Deshabilitar el botón después de hacer clic
        this.textContent = 'Waiting for the other player...'; // Cambiar el texto del botón
    });
    // Unirse a la sala de juego si el código es válido en URL
    var urlParams = new URLSearchParams(window.location.search);
    // Verificar si existe un parámetro 'code' en la URL
    if (urlParams.get('code')) {
        // Enviar el código del juego al servidor
        socket.emit('joinGame', {
            code: urlParams.get('code') // Extraer el valor del parámetro 'code' y enviarlo como objeto
        });
    }
}
