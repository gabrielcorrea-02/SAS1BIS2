const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
    const { username, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE username=$1', [username]);

    if (result.rows.length > 0) {
        const user = result.rows[0];
        const valid = await bcrypt.compare(password, user.password);

        if (valid) {
            // Save session data
            req.session.user = { id: user.id, role: user.role, username: user.username };

            // If the request is from an API client (like Python)
            if (req.headers['content-type'] === 'application/json') {
                return res.json({ success: true, user: req.session.user });
            }

            // If from browser form submission
            return res.redirect('/dashboard');
        }
    }

    // Handle invalid login
    if (req.headers['content-type'] === 'application/json') {
        return res.status(401).json({ success: false, message: "Usuário ou senha inválidos!" });
    }

    res.send('Usuário ou senha inválidos!');
};


exports.logout = (req, res) => {
    req.session.destroy();
    res.redirect('/');
};
