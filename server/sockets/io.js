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
