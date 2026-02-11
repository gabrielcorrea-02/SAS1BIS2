// controllers/vehiclesController.js
const pool = require('../config/db');

module.exports = {

  // Listar todos os veículos
  list: async (req, res) => {
    try {
      const result = await pool.query(`
        SELECT v.id, v.placa, v.marca, v.modelo, v.cor, v.tipo,
               cp.nome_completo AS owner_name,
               v.corpo_permanenteFK
        FROM veiculo_corpo_permanente v
        LEFT JOIN corpo_permanente cp ON cp.id = v.corpo_permanenteFK
        ORDER BY cp.nome_completo, v.placa
      `);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: 'Erro ao listar veículos' });
    }
  },

  // Listar veículos de um membro
  listByMember: async (req, res) => {
    const { memberId } = req.params;
    try {
      const result = await pool.query(`
        SELECT id, placa, marca, modelo, cor, tipo
        FROM veiculo_corpo_permanente
        WHERE corpo_permanenteFK = $1
        ORDER BY placa
      `, [memberId]);
      res.json({ success: true, vehicles: result.rows });
    } catch (err) {
      console.error(err);
      res.json({ success: false, message: 'Erro ao listar veículos do membro' });
    }
  },

  // Adicionar veículo (corpo permanente)
  add : async (req, res) => {
  try {
    const { placa, marca, modelo, cor, tipo, corpo_permanenteFK } = req.body;

    if (!placa || !corpo_permanenteFK) {
      return res.json({ success: false, message: 'Placa e membro são obrigatórios' });
    }

    const insert = await pool.query(
      `INSERT INTO veiculo_corpo_permanente (placa, marca, modelo, cor, tipo, corpo_permanenteFK)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [placa.trim(), marca || null, modelo || null, cor || null, tipo || null, corpo_permanenteFK]
    );

    res.json({ success: true, vehicle: insert.rows[0] });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Erro interno ao adicionar veículo' });
  }
},

  // Excluir veículo corpo permanente
  delete: async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query(`DELETE FROM veiculo_corpo_permanente WHERE id = $1`, [id]);
      res.json({ success: true });
    } catch (err) {
      console.error('Erro ao excluir veículo:', err.message);
      res.json({ success: false, message: 'Erro ao excluir veículo' });
    }
  },

  // Adicionar veículo esporadico (visitante)
  add_guest : async (req, res) => {
  try {
    const { placa, marca, modelo, cor, tipo, visitanteFK } = req.body;

    if (!placa || !visitanteFK) {
      return res.json({ success: false, message: 'Placa e visitante são obrigatórios' });
    }

    const insert = await pool.query(
      `INSERT INTO veiculo_esporadico (placa, marca, modelo, cor, tipo, visitanteFK)
       VALUES ($1,$2,$3,$4,$5, $6) RETURNING *`,
      [placa.trim(), marca || null, modelo || null, cor || null, tipo || null, visitanteFK]
    );

    res.json({ success: true, vehicle: insert.rows[0] });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Erro interno ao adicionar veículo' });
  }
},

// Excluir veículo visitante
  delete_guest: async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query(`DELETE FROM veiculo_esporadico WHERE id = $1`, [id]);
      res.json({ success: true });
    } catch (err) {
      console.error('Erro ao excluir veículo:', err.message);
      res.json({ success: false, message: 'Erro ao excluir veículo' });
    }
  },

  
 // Listar veículos de um visitante
  listByGuest: async (req, res) => {
    const { guestId } = req.params;
    try {
      const result = await pool.query(`
        SELECT id, placa, marca, modelo, cor, tipo
        FROM veiculo_esporadico
        WHERE visitanteFK = $1
        ORDER BY placa
      `, [guestId]);
      res.json({ success: true, vehicles: result.rows });
    } catch (err) {
      console.error(err);
      res.json({ success: false, message: 'Erro ao listar veículos do visitante.' });
    }
  }

};
