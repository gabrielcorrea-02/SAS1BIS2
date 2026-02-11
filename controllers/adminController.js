const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.listUsers = async (req, res) => {
  if(!req.session.user || req.session.user.role !== 'admin') return res.redirect('/dashboard');
  try {
    const result = await pool.query('SELECT * FROM users ORDER BY role ASC');
    res.render('users', { users: result.rows, user: req.session.user });
  } catch(err){
    console.error(err);
    res.send('Erro ao listar usuários');
  }
};
    
exports.addUser = async (req, res) => {
    if(!req.session.user || req.session.user.role !== 'admin') return res.redirect('/dashboard');
    const { username, password, role } = req.body;
    const hash = await bcrypt.hash(password, 10);
    try {
        await pool.query('INSERT INTO users (username, password, role) VALUES ($1,$2,$3)',
            [username, hash, role]);
        res.redirect('/admin/users');
    } catch(err){
        console.error(err);
        res.send('Erro ao adicionar usuário');
    }
};

exports.deleteUser = async (req, res) => {
  if(!req.session.user || req.session.user.role !== 'admin') return res.redirect('/dashboard');
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [id]);
    res.redirect('/admin/users');
  } catch(err){
    console.error(err);
    res.send('Erro ao excluir usuário');
  }
};
