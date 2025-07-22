const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); // Sirve para encriptar la contraseña
const db = require('../database/db'); //Módulo de conexión a la base de datos

// Registrar un nuevo usuario
router.post('/register',async(req, res) => {
    console.log('Registration received', req.body); // Log para depuración
    try{
        const {username, email, password} = req.body; // Extraer los datos del cuerpo de la solicitud
        // Variables básicas
        if (!username || !email || !password){
            console.log('Error:Missing required fields');
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }
        //Verifcar que el usuario exista
        console.log('Checking if user already exists');
        const userExists = await db.query(
            'SELECT id FROM users WHERE username = $1 OR email = $2', // Consulta parametrizada para evitar inyección SQL
            [username, email]
        );
        if (userExists.rows.length > 0) {
            console.log('User already exists');
            return res.status(400).json({
                success: false,
                message: 'Username or email is already registered' // Respuesta si el usuario o correo ya están registrados
            });
        }
        // Encriptar la contraseña
        console.log('Generating password hash...');
        const salt = await bcrypt.genSalt(10); // Hacer única la contraseña
        const passwordHash = await bcrypt.hash(password, salt); // Generar el hash de la contraseña

        // Insertar un nuevo usuario
        console.log('Inserting new user into database...');
        const result = await db.query( // Inyecciones de sql malisioso 
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id', // Inserta usuario y devuelve su ID
            [username, email, passwordHash]
        );
        // Respuesta exitosa
        console.log('User registered successfylly', result.rows[0]);
        res.json({
            success: true,
            message: 'User registered successfully' // Confirma el registro exitoso
        });
    } catch (err) {
        // Manejo de errores
        console.error('Detailed registration error'),{
        error:err.message,
        code:err.code,
        detail: err.detail,
        table: err.table,
        constraint: err.constraint
};

// Errores específicos 
if(err.code === '23505') { // Código de error de PostgreSQL para violación de restricción de unicidad
    console.log('Error: User already exists');
    return res.status(400).json ({
        success: false,
        message: 'Username or email is already registered' // Respuesta para duplicados
    });
} else {
    return res.status(500).json ({
        success: false,
        message: 'An error occurred during registration', // Respuesta genérica para otros errores
        error: err.message
    });
}
    }
});

// Iniciar sesión
router.post('/login', async (req, res) => {
    console.log('Login attempt: ', {username: req.body.username}); // Log para depuración
    try {
        const { username, password } = req.body; // Extraer datos del cuerpo de la solicitud

        // Validar campos
        if (!username || !password) { // Si no se proporcionan los campos requeridos
            console.log('Error: Missing fields in login attempt');
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Buscar el usuario en la base de datos
        console.log('Searching for user in database...');
        const result = await db.query(
            'SELECT * FROM users WHERE username = $1', // Consulta parametrizada para buscar el usuario
            [username]
        );

        const user = result.rows[0];
        if (!user) { // Si el usuario no existe
            console.log('Error: User not found');
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password' // Respuesta si el usuario no se encuentra
            });
        }

        // Verificar la contraseña
        console.log('Verifying password...');
        const isPasswordValid = await bcrypt.compare(password, user.password_hash); // Comparar la contraseña proporcionada con el hash almacenado

        if(!Validpassword) {
            console.log('Error: Invalid password');
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password' // Respuesta si la contraseña es incorrecta
            });
        }

        // Actualizar la última sesión
        console.log('Updating last session timestamp...');
        await db.query(
            'UPDATE users SET last_session = CURRENT_TIMESTAMP WHERE id = $1', // Actualizar la última sesión del usuario
            [user.id]
        );

        // Establecer la sesión del usuario
        req.session.userId = user.id; // Guardar el ID del usuario en la sesión
        console.log('Login successful: ', {username: user.username, id: user.id});
        res.json({
            success: true,
            user:{
                id: user.id,
                username: user.username,
                email: user.email
            },
            message: 'Login successful' // Respuesta exitosa al iniciar sesión
        });
    } catch (err) {
        console.error('Detailedlogin error',{
            error: err.message,
            code: err.code,
            detail: err.detail,
            table: err.table,
            constraint: err.constraint
        });
        // Manejo de errores
        return res.status(500).json({
            success: false,
            message: 'An error occurred during login', // Respuesta genérica para errores de inicio de sesión
        });
    }
});
    // Logout user
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error in logout:', err);
            return res.status(500).json({
                success: false,
                message: 'An error occurred during logout'
            });
        }
        console.log('User logged out successfully');
        res.json({
            success: true,
            message: 'Logout successful'
        });
    });
});
     // Obtener usuario
     router.get('/me', async (req, res) => {
        if(!req.session.userId) {
            console.log('Error: User not authenticated');
            return res.status(401).json({
                success: false,
                message: 'User not authenticated'
            });
        }
        try{
            const result = await db.query(
                'SELECT id, username, email FROM users WHERE id = $1', // Consulta para obtener el usuario por ID
                [req.session.userId]
            );
            if (!result.rows[0]) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            res.json({
                success: true,
                user: result.rows[0] // Retorna los datos del usuario
            });
        } catch (err) {
            console.error('Error fetching user data:', err);
            return res.status(500).json({
                success: false,
                message: 'An error occurred while fetching user data'
            });
        }
    });

    module.exports = router; // Exportar el router para usarlo en otros archivos
