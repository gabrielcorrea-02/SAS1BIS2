const pool = require('../config/db');
const formatTimestamp = require('../utils/formatTS');
const amazonasOMList = require('../utils/amazonasOMList');


// ===============================================
// LISTAR VISITANTES + ÚLTIMO ACESSO
// ===============================================
exports.list = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        v.*,
        ve.placa, ve.marca, ve.modelo, ve.cor, ve.tipo,
        ep.nome AS empresa_permanente_nome,
        ee.nome AS empresa_esporadica_nome,
        om.nome AS om_nome,
        tv.nome AS tipo_visitante_nome,
        a.entry_time,
        a.exit_time
      FROM visitantes v
      LEFT JOIN veiculo_esporadico ve ON ve.visitanteFK = v.id
      LEFT JOIN empresa_permanente ep ON ep.id = v.empresa_permanenteFK
      LEFT JOIN empresa_esporadica ee ON ee.id = v.empresa_esporadicaFK
      LEFT JOIN organizacao_militar om ON om.id = v.organizacao_militarFK
      LEFT JOIN tipo_visitante tv ON tv.id = v.tipo_visitanteFK
      LEFT JOIN LATERAL (
          SELECT entry_time, exit_time
          FROM acesso 
          WHERE visitanteFK = v.id
          ORDER BY entry_time DESC
          LIMIT 1
      ) a ON true
      ORDER BY a.entry_time DESC NULLS LAST;
    `);

    res.render('guests', {
      guests: result.rows,
      user: req.session.user,
      formatTimestamp,
      amazonasOMList,
      errors: [],
      success: "",
      values: {}
    });
  } catch (err) {
    console.error(err);
    res.send('Erro ao listar visitantes');
  }
};

// ===============================================
// INFORMAÇÕES DE UM VISITANTE A PARTIR DO CRACHÁ FIXO
// ===============================================
exports.infoCracha = async (req, res) => {
  const num = parseInt(req.params.num);
  if (!num) return res.status(400).send("ID do visitante não fornecido");
  console.log("Número do crachá:", num);

  try {
    const crachaResult = await pool.query(`
      SELECT 
        v.id
      FROM visitantes v
      JOIN qrcode_fixo_visitante qr ON qr.id = v.qrcode_fixoFK
      WHERE qr.number = $1
      LIMIT 1
    `, [num]);

    console.log("Resultado crachá:", crachaResult.rows);

    if (!crachaResult.rows.length) return res.status(404).send("Visitante não encontrado");

    const guestID = crachaResult.rows[0].id;

    const guestResult = await pool.query(`
      SELECT 
        v.*,
        ve.placa, ve.marca, ve.modelo, ve.cor, ve.tipo,
        ep.nome AS empresa_permanente_nome,
        ee.nome AS empresa_esporadica_nome,
        ee.setor AS empresa_esporadica_setor,
        om.nome AS om_nome,
        om.guarnicao AS om_guarnicao,
        tv.nome AS tipo_visitante_nome
      FROM visitantes v
      LEFT JOIN veiculo_esporadico ve ON ve.visitanteFK = v.id
      LEFT JOIN empresa_permanente ep ON ep.id = v.empresa_permanenteFK
      LEFT JOIN empresa_esporadica ee ON ee.id = v.empresa_esporadicaFK
      LEFT JOIN organizacao_militar om ON om.id = v.organizacao_militarFK
      LEFT JOIN tipo_visitante tv ON tv.id = v.tipo_visitanteFK
      WHERE v.id = $1
      LIMIT 1
      `, [guestID]);
      
      if (!guestResult.rows.length) return res.status(404).send("Visitante não encontrado");
      const guest = guestResult.rows[0];

    const historyResult = await pool.query(`
      SELECT entry_time, exit_time
      FROM acesso
      WHERE visitanteFK = $1
      ORDER BY entry_time DESC
    `, [guestID]);

    // Buscar veículos do membro
    const vehiclesResult = await pool.query(`
      SELECT id, placa, marca, modelo, cor, tipo
      FROM veiculo_esporadico
      WHERE visitanteFK = $1
    `, [guestID]);

    guest.vehicles = vehiclesResult.rows;

    guest.history = historyResult.rows;
    res.render('guest-info', { 
      guest, 
      formatTimestamp, 
      user: req.session.user 
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao buscar informações do visitante");
  }
};

// ===============================================
// INFORMAÇÕES DE UM VISITANTE
// ===============================================
exports.info = async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).send("ID do visitante não fornecido");

  try {
    const guestResult = await pool.query(`
      SELECT 
        v.*,
        ve.placa, ve.marca, ve.modelo, ve.cor, ve.tipo,
        ep.nome AS empresa_permanente_nome,
        ee.nome AS empresa_esporadica_nome,
        ee.setor AS empresa_esporadica_setor,
        om.nome AS om_nome,
        om.guarnicao AS om_guarnicao,
        tv.nome AS tipo_visitante_nome
      FROM visitantes v
      LEFT JOIN veiculo_esporadico ve ON ve.visitanteFK = v.id
      LEFT JOIN empresa_permanente ep ON ep.id = v.empresa_permanenteFK
      LEFT JOIN empresa_esporadica ee ON ee.id = v.empresa_esporadicaFK
      LEFT JOIN organizacao_militar om ON om.id = v.organizacao_militarFK
      LEFT JOIN tipo_visitante tv ON tv.id = v.tipo_visitanteFK
      WHERE v.id = $1
      LIMIT 1
    `, [id]);

    if (!guestResult.rows.length) return res.status(404).send("Visitante não encontrado");

    const guest = guestResult.rows[0];
    const historyResult = await pool.query(`
      SELECT entry_time, exit_time
      FROM acesso
      WHERE visitanteFK = $1
      ORDER BY entry_time DESC
    `, [id]);

    // Buscar veículos do membro
    const vehiclesResult = await pool.query(`
      SELECT id, placa, marca, modelo, cor, tipo
      FROM veiculo_esporadico
      WHERE visitanteFK = $1
    `, [id]);

    guest.vehicles = vehiclesResult.rows;

    guest.history = historyResult.rows;
    res.render('guest-info', { 
      guest, 
      formatTimestamp, 
      user: req.session.user 
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao buscar informações do visitante");
  }
};

// ===============================================
// ADICIONAR VISITANTE + REGISTRAR ACESSO
// ===============================================
exports.add = async (req, res) => {
  const {
    nome_completo,
    nome_de_guerra,
    objetivo,
    tipo_visitanteFK, // string do select
    cracha,
    empresa_permanente_nome,
    empresa_permanente_cnpj,
    empresa_esporadica_nome,
    empresa_esporadica_setor,
    om_nome,
    om_guarnicao,
    placa,
    marca,
    modelo,
    cor,
    tipo
  } = req.body;

  let epFK = null;
  let eeFK = null;
  let omFK = null;
  let veiculoID = null;
  let crachaID = null;
  let tipoVisitanteID = null;

  try {
    // 1) Tipo visitante
    if (tipo_visitanteFK === "empresa_permanente") {
      const ep = await pool.query(
        `INSERT INTO empresa_permanente (nome, cnpj)
         VALUES ($1, $2) RETURNING id`,
        [empresa_permanente_nome || null, empresa_permanente_cnpj || null]
      );
      epFK = ep.rows[0].id;
    } else if (tipo_visitanteFK === "empresa_esporadica") {
      const ee = await pool.query(
        `INSERT INTO empresa_esporadica (nome, setor)
         VALUES ($1, $2) RETURNING id`,
        [empresa_esporadica_nome || null, empresa_esporadica_setor || null]
      );
      eeFK = ee.rows[0].id;
    } else if (tipo_visitanteFK === "organizacao_militar") {
      const omRes = await pool.query(
        `INSERT INTO organizacao_militar (nome, guarnicao)
         VALUES ($1, $2) RETURNING id`,
        [om_nome || null, om_guarnicao || null]
      );
      omFK = omRes.rows[0].id;
    }

    // ========================================================
    // 3) Buscar UUID real do tipo_visitante
    // ========================================================
    if (tipo_visitanteFK) {
      const tipoRes = await pool.query(
        `SELECT id FROM tipo_visitante WHERE nome = $1 LIMIT 1`,
        [tipo_visitanteFK]
      );
      if (tipoRes.rows.length) tipoVisitanteID = tipoRes.rows[0].id;
    }
    
    if (cracha) {
      const cracha_num = parseInt(cracha);
      const crachaTest = await pool.query(
        `SELECT id FROM qrcode_fixo_visitante WHERE number = $1 AND in_use = true LIMIT 1`,
        [cracha_num]
      );
      if (crachaTest.rows.length){
        return res.status(500).json({ error: "Crachá em uso" });
      }
      const crachaRes = await pool.query(
        `SELECT id FROM qrcode_fixo_visitante WHERE number = $1 AND in_use = false LIMIT 1`,
        [cracha_num]
      );
      await pool.query(
        `UPDATE qrcode_fixo_visitante SET in_use = true WHERE number = $1 AND in_use = false`,
        [cracha_num]
      );
      if (crachaRes.rows.length) crachaID = crachaRes.rows[0].id;
    }

    // 2) Criar visitante
    // veiculo_esporadicoFK,
    const visitor = await pool.query(
      `INSERT INTO visitantes (
        nome_completo, nome_de_guerra, objetivo,
        empresa_permanenteFK,
        organizacao_militarFK,
        empresa_esporadicaFK,
        tipo_visitanteFK,
        qrcode_fixoFK
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [
        nome_completo,
        nome_de_guerra||null,
        objetivo||null,
        epFK,
        omFK,
        eeFK,
        tipoVisitanteID, // agora é UUID correto
        crachaID,
      ]
    );
    const visitanteID = visitor.rows[0].id;
    // const visitanteID = newVisitor.rows[0].id;
    
    // 3) Veículo
    if (placa?.trim()) {
      const search = await pool.query("SELECT * FROM veiculo_esporadico WHERE placa = $1", [placa.trim()]);
      if (!search.rows.length) {
        const insert = await pool.query(
          `INSERT INTO veiculo_esporadico (visitanteFK, placa, marca, modelo, cor, tipo) VALUES ($1,$2,$3,$4,$5, $6) RETURNING id`,
          [visitanteID, placa.trim(), marca||null, modelo||null, cor||null, tipo||null]
        );
        veiculoID = insert.rows[0].id;
      }
    }

    // ==========================
    // 5) Registrar entrada
    // ==========================
    await pool.query(
      `INSERT INTO acesso (visitanteFK, entry_time) VALUES ($1, NOW())`,
      [visitanteID]
    );

    res.json({ id: visitanteID });
  
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro ao registrar visitante" });
  }
};


// ===============================================
// REGISTRAR SAÍDA
// ===============================================
// exports.exit = async (req, res) => {
//   try {
//     await pool.query(`UPDATE acesso SET exit_time = NOW() WHERE visitanteFK = $1 AND exit_time IS NULL`, [req.params.id]);
//     res.sendStatus(200);
//   } catch (err) {
//     console.error(err);
//     res.sendStatus(500);
//   }
// };

// ===============================================
// DELETAR VISITANTE
// ===============================================
exports.delete = async (req, res) => {
  try {
    await pool.query(`DELETE FROM visitantes WHERE id = $1`, [req.params.id]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};
