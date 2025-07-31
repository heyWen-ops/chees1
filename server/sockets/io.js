// Socket.io: Se usa para gestionar conexiones de jugadores en partidas
// Importa una función move desde un módulo auth
const { move } = require("../routes/auth");
// Objeto global para almacenar info de partidas con el código
const games = {};
// Objeto global para almacenar información de los jugadores con el ID
const players = {};

module.exports = function(io) {
// Función recibe un objeto io de Socket.io y escucha el evento 'connection', que se dispara cuando un cliente se conecta al servidor
    io.on('connection', (socket) => {
    // Cuando un usuario se conecta, se imprime un mensaje en la consola
        console.log('a user connected');
        // Cuando un jugador intenta unirse a un juego
        socket.on('joinGame', (data) => {
            const { code, color, timeControl, username } = data;
            console.log(`Player ${username} join game with code: ${code} as ${color}`);
        //Si el juego no existe, se crea uno nuevo
        if (!games[code]) {
                games[code] = {
                  white: null,
                  black: null,
                  timeControl: timeControl,
                  whiteReady: false,
                  blackReady: false,
                  gameStarted: false,
                  WhiteTime: timeControl * 60,
                  BlackTime: timeControl * 60,
                  turn: 'white',
                  moves: []
                };
            }
        //Guardar la información del jugador en el objeto players
        players[socket.id] = {
            username: username,
            color: color,
            gameCode: code
        };
        // El jugador se une a un juego de Socket.io con el código de la partida
        socket.join(code);

        // Asignamos el color al jugador
        if (color === 'white') { // Si el jugador es blanco, se asigna el socket.id al juego
            games[code].white = socket.id;
        } else {
            games[code].black = socket.id; // Si el jugador es negro, se asigna el socket.id al juego
        }
        // Notificamos a los jugadores que se han unido
        if (games[code].white && games[code].black) {
            console.log('Both players are connected in game ${code}');
        io.to(code).emit('playerConnected', {
            white: players[games[code].white].username,
            black: players[games[code].black].username
        });
    }
        });
    // Evento cuando el jugador indica que esta listo para comenzar
    socket.on('playerReady', () => {
        const player = players[socket.id];
        if(!player) return; // Si no existe el jugador se termina la ejecución
        // Obtiene la partida desde el objeto games usando el gameCode del jugador
        const game = games [player.gameCode]; 
        // Si no existe la partida termina la ejecución
        if(!game) return;

        console.log(`Player ${player.username} is ready`);

        if(player.color === 'white') {
            game.whiteReady = true;
        } else if (player.color === 'black') {
            game.blackReady = true;
        }

        // Si ambos jugadores están listos y el juego no ha comenzado, se inicia el juego
        if (game.whiteReady && game.blackReady && !game.gameStarted) {
            console.log(`Game ${player.gameCode} is starting`);
            game.gameStarted = true;
            io.to(game.code).emit('bothPlayersReady');
        }
        // Iniciar el temporizador para ambos jugadores
        game.timer = setInterval(() => {
           if (game.turn === 'white') {
                game.WhiteTime--;
            } else {
                game.BlackTime--;
            }
            // Notificar a los jugadores sobre el tiempo restante
            io.to(player.gameCode).emit('timeUpdate',{
                whiteTime: game.WhiteTime,
                blackTime: game.BlackTime
            });
            // Verificar si el jugador no tiene tiempo
            if (game.WhiteTime <= 0) {
                clearInterval(game.timer); // Detiene el temporizador
                io.to(game.code).emit('gameOverTime', { winnerUsername: players[game.black].username
                });
            } else if (game.BlackTime <= 0) {
                clearInterval(game.timer);
                io.to(game.code).emit('gameOverTime', { winnerUsername: players[game.white].username
                });
            }
        }, 1000); // Actualizar cada segundo
    });
    // Evento cuando un jugador realiza un movimiento
    socket.on('move', (data) => {
        const player = players[socket.id];
        if (!player) {
            console.log('Player not found');
            return;
        }

        const game = games[player.gameCode];
        if (!game || !game.gameStarted) {
            console.log('Game not found or not started');
            return;
        }

        // Llamar a la función move para procesar el movimiento
        const moveResult = move(game, player.color, from, to);
        if (moveResult) {
            game.moves.push(moveResult);
            game.turn = player.color === 'white' ? 'black' : 'white'; // Cambiar turno
            io.to(player.gameCode).emit('moveMade', moveResult);
        }

        // Verificamos si el turno es del jugador
        if(game.turn !== player.color) {
            console.log(`Move rejected: Not player\'s turn`);
            return;
        }
        console.log(`Move from ${player.color} player: ${data.from} to ${data.to}`);

        // Cambiar el turno al otro jugador
        game.turn = game.turn === 'white' ? 'black' : 'white';

        // Notificamos el movimiento de los otros jugadores
        io.to(player.gameCode).emit('moveMade', {
            from: data.from,
            to: data.to,
            promotion: data.promotion,
            color: player.color
        });
        // Evento para manejar los mensajes del chat
        socket.on('chat', (message) => {
            const player = players[socket.id];
            if(!player) return;
            console.log(`Chat message from ${player.username}: ${message}`);

            //Enviamos el mensaje a todos los jugadores en la sala del juego
            io.to(player.gameCode).emit('chatMessage', {
                username: player.username,
                message: message
            });
    });
         // Evento para manejar la desconexión del jugador
         socket.on('disconnect', () => {
            const player = players[socket.id];
            if (player) return;
            console.log('Player ${player.username} disconnected from game ${player.gameCode}');

            const game = games[player.gameCode];
            if (game){
                if(game.timer){
                    clearInterval(game.timer); // Detener el temporizador si existe
                }
                // Noticamos que un jugador se ha desconectado
                io.to(player.gameCode).emit('gameOverDisconnect', {
                    username: player.username
         });
    }
    // Eliminamos al jugador del objeto players
    delete players[socket.id];
});
// Evento cuando un jugador hace jaque mate
socket.on('checkmate', (data) => {
    const player = players[socket.id];
    if (!player) return;

    const game =games [player.gameCode];
    if(!game) return;

    if(game.timer){
        clearInterval(game.timer); // Detener el temporizador si existe
    }

    // Notificamos a todos los jugadores que el juego ha terminado por jaque mate
    io.to(player.gameCode).emit('gameOver',{
        reason:'checkmate',
        winner: data.winner,
        winnerUsername: players[data.winner ==='white' ? game.white : game.black].username
    });
});
    });

});
}
