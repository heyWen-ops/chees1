// Importar módulos necesarios
const express = require ('express'); // Importa el framework Express para crear el servidor web
const path = require ('path'); // Módulo Path para manejar rutas de archivos de forma compatible con diferentes SO
const app = express ();// Crear una instancia de la app Express
const http = require('http').createServer(app) // Crear un servidor HTTP 
const io = require('socket.io')(http); // Para la comunicación en tiempo real conectado al servidor HTTP
require('dotenv').config(); //Cargar las variables del entorno desde el archivo .env a process.env

//Middleware
app.use(express.json()); //Procesa solicitudes con datos en formato JSON y los hace disponibles en req.body
app.use(express.static(path.join(__dirname, '../front'))); // Sirve archivos estáticos desde la carpeta 'public'

// Rutas para las vistas (HTML)
app.get('/',(req, res) => {
    // Sirve el archivo index.html cuando se accede a la URL raíz"/"
    res.sendFile(path.join(__dirname,'../front/views/index.html'));
});
app.get('/login',(req, res) => {
    // Sirve el archivo index.html cuando se accede a la URL "/login"
     res.sendFile(path.join(__dirname,'../front/views/index.html'));
});
app.get('/register',(req, res) => {
    // Sirve el archivo index.html cuando se accede a la URL "/register"
     res.sendFile(path.join(__dirname,'../front/views/index.html'));
});

// Configuración básica de Socket.io 
io.on('connection',(socket) => {
    // Registra en consola cuando un cliente se conecta al servidor a través de Socket.io
    console.log('a user connected');
    // Maneja la desconexión de un cliente
    socket.on('disconnect',() => {
        // Registra en una consola cuando un cliente se desconecta
        console.log('user disconnected');
    });
});

//Configuraciones del Puerto y arranque del servidor 
const PORT = process.env.PORT || 3000; // Usa el puerto definido en .env o el 300 por defecto si no esta especificado
http.listen(PORT,() => {
    // Inicia el servidor y muestra un mensaje en consola cuando está funcionando
    console.log(`Server running on port ${PORT}`);
});
