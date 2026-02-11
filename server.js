require('dotenv').config();
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

// Importar routers
const authRoutes = require('./app/routes/auth');
const visitantesRoutes = require('./app/routes/guests');
const qrGenRoutes = require('./app/routes/qrGen');
const accessRouter = require('./app/routes/access');
const usersRoutes = require('./app/routes/admin');
const cpRoutes = require('./app/routes/cp');
const photoRoutes = require('./app/routes/photo');
const vehiclesRoutes = require('./app/routes/vehicles');

const app = express();

// ============================
// CONFIGURAÇÕES DO EXPRESS
// ============================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'app', 'views'));
app.use(express.static(path.join(__dirname, 'app', 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ============================
// SESSÃO
// ============================
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'defaultsecret',
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 24 * 60 * 60 * 1000 // 1 dia
        }
    })
);

// ============================
// MIDDLEWARE PARA POPULAR req.user
// ============================
// Isso permite usar <%= user.username %> nas views
app.use((req, res, next) => {
    if (req.session.user) {
        req.user = req.session.user;
    }
    next();
});

// ============================
// MIDDLEWARE DE AUTENTICAÇÃO
// ============================
//
// Regras:
// - Permitir GET "/" (login page)
// - Permitir POST "/login" (tentar logar)
// - Permitir "/logout"
// - Bloquear qualquer outra rota caso não esteja logado
//
app.use((req, res, next) => {
    const publicPaths = [
        { path: '/', method: 'GET' },
        { path: '/login', method: 'POST' },
        { path: '/logout', method: 'GET' }
    ];

    const isPublic = publicPaths.some(
        p => p.path === req.path && p.method === req.method
    );

    if (!req.session.user && !isPublic) {
        console.log(`Acesso bloqueado a ${req.path} (${req.method})`);
        return res.redirect('/');
    }

    next();
});

// ============================
// ROTAS
// ============================
app.use('/', authRoutes);
app.use('/guests', visitantesRoutes);
app.use('/qrgen', qrGenRoutes); // qrGenRoutes deve ter / e /create
app.use('/access', accessRouter);
app.use('/admin', usersRoutes)
app.use('/cp', cpRoutes);
app.use('/photo', photoRoutes);
app.use('/vehicles', vehiclesRoutes);

// ============================
// ERRO 404
// ============================
app.use((req, res) => {
    res.status(404).send('404 - Página não encontrada');
});

// ============================
// INICIAR SERVIDOR
// ============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
