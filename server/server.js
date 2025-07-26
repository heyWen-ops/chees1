// Importar módulos necesarios
const path = require ('path'); // Módulo Path para manejar rutas de archivos de forma compatible con diferentes SO
require('dotenv').config({path: path.join(__dirname, '../.env')}); //Cargar las variables del entorno desde el archivo .env a process.env


const http = require('http'), // Crear un servidor HTTP 
        express = require ('express'); // Importa el framework Express para crear el servidor web
        session = require('express-session'); // Importa el middleware de sesiones de Express
        pgSession = require('connect-pg-simple')(session); // Middleware para manejar sesiones con PostgreSQL
        socket = require('socket.io'); // Importa Socket.io para manejar conexiones en tiempo real

const config = require('../config'); // Importa la configuración del servidor
const{pool} = require ('./database/db');
const { requireAuth, setUserData } = require('./middleware/auth'); // Importa middleware de autenticación
const authRoutes = require('./routes/auth'); // Importa las rutas de autenticación

const myIo = require('./sockets/io'), // Importa la configuración de Socket.io
        routes =  require('./routes'); // Importa las rutas del servidor
const { json } = require('stream/consumers');

const app = express() // Crea una instancia de Express
       server = http.Server(app), // Crea un servidor HTTP con Express
       io = socket(server); // Crea una instancia de Socket.io con el servidor HTTP

//Middleware

app.use(express.json()); //Procesa solicitudes con datos en formato JSON y los hace disponibles en req.body
app.use(express.urlencoded({extended: true})); // Sirve archivos estáticos desde la carpeta 'public'

// Configuración de sesión
app.use(session({
    store: new pgSession({
        pool, // Conexión a la base de datos PostgreSQL
        tableName: 'sessions', // Nombre de la tabla donde se almacenarán las sesiones
        // Limpiar las sesiones expiradas automáticamente
        pruneSessionInterval: 60 // Intervalo para limpiar sesiones expiradas (1 minuto)
    }),
    secret: process.env.SESSION_SECRET || 'your_session_secret', // Clave secreta para firmar la sesión
    resave: false, // No volver a guardar la sesión si no ha cambiado
    saveUninitialized: false, // No guardar sesiones no inicializadas
    cookie: {
        expire: false, 
        rolling: true, // Actualiza la cookie en cada solicitud
        maxAge: 3 * 60 * 1000 //
    }
}));
// Servidor de archivos estáticos
app.use('/public', express.static(path.join(__dirname, '../front/public'))); // Sirve archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, '..','front'))); // Sirve archivos estáticos desde la carpeta 'public'
app.use(setUserData); // Middleware para establecer datos del usuario en la sesión

// Configuraciín de las vistas
app.set('views', path.join(__dirname, '../front/views')); // Establece la carpeta de vistas
app.set('view engine', 'html'); // Establece el motor de plantillas
app.engine('html', require('express-handlebars')({
    extname: 'html', // Extensión de los archivos de plantilla
    defaultLayout: 'false', // Nombre del diseño principal
    helpers: {
        json: function (context){
            return JSON.stringify(context); // Convierte el contexto a una cadena JSON
        }
    }
}));

// Rutas publicas
app.get('/login', (req, res) => {
    if (req.sessiom.userId){
        res.render('login');
    }
});

app.get('/register', (req, res) => {
    if (req.sessiom.userId){
        res.render('register');
    }
});

// Rutas protegidas
app.get('/', requireAuth, (req, res) => {
    res.render('index'); // Renderiza la vista 'index' si el usuario está autenticado
});
// Rutas del juego
app.use('/game', requireAuth, routes); // Usa las rutas del juego, asegurando que el usuario esté autenticado

// Configuración básica de Socket.io
myIo(io);

// Middleware para manejar errores
app.use((err, req, res, next) => {
    console.error('Server error:', err); // Registra el error en la consola
    res.status(500).json({
        success: false,
        message: 'Internal Server Error' // Responde con un mensaje de error genérico
    }); // Responde con un mensaje de error
});

//Configuraciones del Puerto y arranque del servidor
const PORT = process.env.PORT || 3000; // Usa el puerto definido en .env o el 300 por defecto si no esta especificado
http.listen(PORT,() => {
    // Inicia el servidor y muestra un mensaje en consola cuando está funcionando
    console.log(`Server running on port ${PORT}`);
});
