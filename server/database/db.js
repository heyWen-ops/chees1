// Importar el módulo pg para conectar con PostgreSQL
const {Pool} = require('pg'); // Pool permite manejar múltiples conexiones a la base de datos
// Configuración de la conexión a PostgreSQL usando variables de entorno
const dbConfig = {
    user: process.env.DB_USER, // Nombre de usuario de la base de datos
    host: process.env.DB_HOST, // Dirección del host
    database: process.env.DB_NAME, // Nombre de la base de datos
    password: process.env.DB_PASSWORD, // Contraseña de la base de datos
    port: process.env.DB_PORT || 5432, // Puerto de PostgreSQL (usualmente 5432)
};
// Mostrar configuración en la consola
console.log('Configuración de DB:', {
    user: dbConfig.user,
    host:dbConfig.host,
    database: dbConfig.database,
    port: dbConfig.port,
});
// Crear un grupo de conexiones (Pool) con la configuración
const pool = new Pool(dbConfig);
//Prueba de conexión a la base de datos
pool.connect((err, client, release) => {
   if (err){
    console.log('Error al conectar a PostgreSQL:', err.stack); // Mostrar error detallado
    return;
   } else {
    console.log('Conexión exitosa a PostgreSQL');
    release(); // Liberar el cliente para devolverlo al pool
   }
});

// Exportar funciones para consultas y el pool
module.exports = {
    query: (text,params) => pool.query(text,params), // Función para ejecutar consultas SQL
    pool // Exportar el pool para usarlo en otros módulos
}