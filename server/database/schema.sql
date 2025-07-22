-- Creación de la tabla para almacenar usuarios
-- Almacena información sobre los usuarios registrados en la app
CREATE TABLE users (
id SERIAL PRIMARY KEY, --ID único auto-incremental 
username VARCHAR (50) UNIQUE NOT NULL, -- Nombre de usuario (único, máx. 50 caracteres)
email VARCHAR (255) UNIQUE NOT NULL, -- Email (único, máx. 255 caracteres)
password_hash VARCHAR (255) NOT NULL, -- Contraseña hasheada 
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP, -- Fecha de creación
last_login TIMESTAMP WITH TIME ZONE -- Último inicio de sesión
);
-- Creación de la tabla session para almacenar sesiones
-- Almacena sesiones de usuario para manejar la autenticación persistente
CREATE TABLE session (
sid varchar NOT NULL COLLATE "default", -- ID único de la sesión
sess json NOT NULL, -- Datos de la sesión en formato JSON
expire timestamp(6)NOT NULL, -- Fecha de expiración de la sesión
CONSTRAINT session_pkey PRIMARY KEY(sid) -- Clave primaria en sif
);
--Índice en la Tabla session
--Crea un índice en la columna expire de la tabla session para optimizar las consultas
CREATE INDEX IDX_session_expire ON session (expire);