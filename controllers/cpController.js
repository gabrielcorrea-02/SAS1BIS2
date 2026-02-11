const pool = require('../config/db');
const formatTimestamp = require('../utils/formatTS');


// ===============================================
// LISTAR CORPO PERMANENTE + ÚLTIMO ACESSO
// ===============================================
exports.list = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        cp.*,
        ve.placa, ve.marca, ve.modelo, ve.cor, ve.tipo,
        a.entry_time,
        a.exit_time
      FROM corpo_permanente cp
      LEFT JOIN veiculo_corpo_permanente ve ON ve.corpo_permanenteFK = cp.id
      LEFT JOIN LATERAL (
          SELECT entry_time, exit_time
          FROM acesso 
          WHERE corpo_permanenteFK = cp.id
          ORDER BY entry_time DESC
          LIMIT 1
      ) a ON true
      ORDER BY a.entry_time DESC NULLS LAST;
    `);

    res.render('cp', {
      cps: result.rows,
      user: req.session.user,
      formatTimestamp,
      errors: [],
      success: "",
      values: {}
    });
  } catch (err) {
    console.error(err);
    res.send('Erro ao listar o corpo permanente');
  }
};

// ===============================================
// DETALHES INDIVIDUAL
// ===============================================
exports.info = async (req, res) => {
  const id = req.query.id;
  if (!id) return res.status(400).send("ID não fornecido");

  try {
    const cpResult = await pool.query(`
      SELECT * FROM corpo_permanente WHERE id = $1
    `, [id]);

    if (cpResult.rows.length === 0) return res.status(404).send("Corpo permanente não encontrado");

    const member = cpResult.rows[0];

    // Buscar veículos do membro
    const vehiclesResult = await pool.query(`
      SELECT id, placa, marca, modelo, cor, tipo
      FROM veiculo_corpo_permanente
      WHERE corpo_permanenteFK = $1
    `, [id]);
    member.vehicles = vehiclesResult.rows;

    // Histórico de acessos
    const historyResult = await pool.query(`
      SELECT entry_time, exit_time
      FROM acesso
      WHERE corpo_permanenteFK = $1
      ORDER BY entry_time DESC
    `, [id]);
    member.history = historyResult.rows;

    res.render('cp-info', {
      member,
      formatTimestamp,
      user: req.session.user,
      errors: [],
      success: "",
      values: {}
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao buscar informações");
  }
};


// ===============================================
// ADICIONAR MEMBRO DO CORPO PERMANENTE
// ===============================================
exports.add = async (req, res) => {
  const { nome_completo, nome_de_guerra, id_mil, placa, marca, modelo, cor, tipo } = req.body;

  let veiculoID = null;

  // Foto (pode ser null)
  const fotoBuffer = req.file ? req.file.buffer : null;
  const fotoMimetype = req.file ? req.file.mimetype : null;

  try {
    // 1) Veículo opcional
    if (placa?.trim()) {
      const search = await pool.query(
        "SELECT * FROM veiculo_corpo_permanente WHERE placa = $1",
        [placa.trim()]
      );

      if (search.rows.length > 0) {
        veiculoID = search.rows[0].id;
      } else {
        const insert = await pool.query(
          `INSERT INTO veiculo_corpo_permanente (placa, marca, modelo, cor, tipo)
           VALUES ($1,$2,$3,$4, $5) RETURNING id`,
          [placa.trim(), marca || null, modelo || null, cor || null, tipo || null]
        );
        veiculoID = insert.rows[0].id;
      }
    }

    // 2) Inserir membro do CP com foto
    const newCP = await pool.query(
      `INSERT INTO corpo_permanente (nome_completo, nome_de_guerra, id_mil, foto, foto_mimetype)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING id`,
      [nome_completo, nome_de_guerra || null, id_mil, fotoBuffer, fotoMimetype]
    );

    const cpID = newCP.rows[0].id;

    // 3) Atualizar veículo com FK
    if (veiculoID) {
      await pool.query(
        `UPDATE veiculo_corpo_permanente SET corpo_permanenteFK = $1 WHERE id = $2`,
        [cpID, veiculoID]
      );
    }

    // Redirecionar para página individual
    res.redirect(`/cp/lookup?id=${cpID}`);

  } catch (err) {
    console.error(err);
    res.send("Erro ao adicionar membro do corpo permanente");
  }
};

// ===============================================
// EDITAR MEMBRO DO CORPO PERMANENTE
// ===============================================
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome_completo, nome_de_guerra, id_mil } = req.body;

        let foto = null;
        let foto_mimetype = null;

        if (req.file) {
            foto = req.file.buffer;
            foto_mimetype = req.file.mimetype;
        }

        await pool.query(
            `
            UPDATE corpo_permanente
            SET
                nome_completo = $1,
                nome_de_guerra = $2,
                id_mil = $3,
                foto = COALESCE($4, foto),
                foto_mimetype = COALESCE($5, foto_mimetype)
            WHERE id = $6
            `,
            [nome_completo, nome_de_guerra, id_mil, foto, foto_mimetype, id]
        );

        res.redirect(`/cp/lookup?id=${id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Erro ao atualizar membro do Corpo Permanente");
    }
};


// ===============================================
// REGISTRAR ENTRADA
// ===============================================
exports.entry = async (req, res) => {
  try {
    const cpID = req.body.corpo_permanente_id;
    if (!cpID) return res.status(400).send("ID não fornecido");

    await pool.query(
      `INSERT INTO acesso (corpo_permanenteFK, entry_time) VALUES ($1, NOW())`,
      [cpID]
    );

    res.json({ id: cpID });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao registrar entrada");
  }
};

// ===============================================
// REGISTRAR SAÍDA
// ===============================================
exports.exit = async (req, res) => {
  try {
    const cpID = req.params.id;
    if (!cpID) return res.status(400).send("ID não fornecido");

    await pool.query(
      `UPDATE acesso
       SET exit_time = NOW()
       WHERE id = (
         SELECT id FROM acesso
         WHERE corpo_permanenteFK = $1 AND exit_time IS NULL
         ORDER BY entry_time DESC
         LIMIT 1
       )`,
      [cpID]
    );

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao registrar saída");
  }
};


// ===============================================
// EXCLUIR MEMBRO
// ===============================================
exports.delete = async (req, res) => {
  try {
    await pool.query("DELETE FROM acesso WHERE corpo_permanenteFK = $1", [req.params.id]);
    await pool.query("DELETE FROM corpo_permanente WHERE id = $1", [req.params.id]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

// ===============================================
// UPLOAD DE FOTO (BYTEA)
// ===============================================
exports.uploadPhoto = async (req, res) => {
  const id = req.params.id;

  if (!req.file) {
    return res.status(400).send("Nenhuma foto enviada.");
  }

  try {
    const buffer = req.file.buffer;

    await pool.query(
      `UPDATE corpo_permanente SET foto = $1 WHERE id = $2`,
      [buffer, id]
    );

    res.json({ success: true, msg: "Foto salva com sucesso!" });

  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao salvar foto.");
  }
};


// ===============================================
// RETORNAR FOTO
// ===============================================
exports.getPhoto = async (req, res) => {
  const id = req.params.id;

  try {
    const result = await pool.query(
      `SELECT foto FROM corpo_permanente WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0 || !result.rows[0].foto) {
      return res.status(404).send("Foto não encontrada.");
    }

    res.set("Content-Type", "image/jpeg");
    res.send(result.rows[0].foto);

  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao recuperar foto.");
  }
};

