require('dotenv').config(); // Cargar variables de entorno desde .env
const path = require('path'); // Módulo para manejar rutas de archivos
require(path.join(__dirname, 'server', 'server.js')); // Importar las rutas de autenticación
