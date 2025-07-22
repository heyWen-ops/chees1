// Middleware para verificar si el usuario está autenticado
const requireAuth = (req, res, next) => {
    // Verifica si existe un userId en la sesión
    if(!req.session.userId){
        // Si no está autenticado, redirige a /login
        return res.redirect('/login'); 
    }
    // Si está autenticado, pasa al siguiente middleware o ruta
    next();
}
// Middleware para cargar datos del usuario autenticado
const setUserData = async (req, res, next) => {
    if (req.session.userId){
        const db = require('../database/db');

        try {
            // Consulta el id y username del usuario desde la tabla users
            const result = await db.query(
                'SELECT id, username FROM users WHERE id = $1',
                [req.session.userId]
            );
            // Almacena los datos de usuario en res.locals.user para usar en rutas o vistas
            res.local.user = result.rows[0];
        } catch (err){
            // Registra cualquier error al consultar la base de datos
            console.log('Error fetching user data', err);
        }
    }
    // Pada al siguiente middleware o ruta
    next();
};
// Exporta los middlewares para usarlos en otros archivos
module.exports = {requireAuth, setUserData};