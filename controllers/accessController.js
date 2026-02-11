const pool = require('../config/db');

// Registrar entrada (visitante)
exports.registerEntry = async (req, res) => {
  const { visitante_id, corpo_permanente_id } = req.body;

  try {
    if (!visitante_id && !corpo_permanente_id) {
      return res.status(400).json({ error: 'Nenhum ID fornecido' });
    }

    await pool.query(
      visitante_id
        ? `INSERT INTO acesso (visitanteFK) VALUES ($1)`
        : `INSERT INTO acesso (corpo_permanenteFK) VALUES ($1)`,
      [visitante_id || corpo_permanente_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar entrada' });
  }
};

// Registrar saída (visitante)
exports.registerExit = async (req, res) => {
  const { visitante_id, corpo_permanente_id } = req.body;

  try {
    if (!visitante_id && !corpo_permanente_id) {
      return res.status(400).json({ error: 'Nenhum ID fornecido' });
    }

    await pool.query(
      visitante_id
        ? `
        UPDATE acesso
        SET exit_time = NOW()
        WHERE id = (
          SELECT id
          FROM acesso
          WHERE visitanteFK = $1 AND exit_time IS NULL
          ORDER BY entry_time DESC
          LIMIT 1
        )`
        : `
        UPDATE acesso
        SET exit_time = NOW()
        WHERE id = (
          SELECT id
          FROM acesso
          WHERE corpo_permanenteFK = $1 AND exit_time IS NULL
          ORDER BY entry_time DESC
          LIMIT 1
        )`,
      [visitante_id || corpo_permanente_id]
    );
    if (visitante_id){
      const ret = await pool.query(`SELECT qrcode_fixoFK FROM visitantes WHERE id = $1`, [visitante_id]);
      if (ret.rows.length && ret.rows[0].qrcode_fixofk !== null){
        await pool.query(`UPDATE qrcode_fixo_visitante SET in_use = false WHERE id = $1 AND in_use = true`, [ret.rows[0].qrcode_fixofk])
        await pool.query(`UPDATE visitantes SET qrcode_fixoFK = NULL WHERE id = $1`, [visitante_id])
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao registrar saída' });
  }
};


// Registrar automaticamente entrada ou saída
exports.registerAccess = async (req, res) => {
  const { visitante_id, corpo_permanente_id } = req.body;

  try {
    if (!visitante_id && !corpo_permanente_id) {
      console.log("❌ Nenhum ID fornecido na requisição");
      return res.status(400).json({ error: 'Nenhum ID fornecido' });
    }

    const id = visitante_id || corpo_permanente_id;
    const tipo = visitante_id ? "Visitante" : "Corpo Permanente";
    const coluna = visitante_id ? "visitanteFK" : "corpo_permanenteFK";

    console.log(`📡 Recebido acesso de ${tipo} (${id})`);

    // Verificar se existe entrada sem saída
    const result = await pool.query(
      `
        SELECT id, exit_time
        FROM acesso
        WHERE ${coluna} = $1
        ORDER BY entry_time DESC
        LIMIT 1
      `,
      [id]
    );

    const ultimo = result.rows[0];

    // Se existe e está aberto → registrar saída
    if (ultimo && ultimo.exit_time === null) {
      await pool.query(
        `UPDATE acesso SET exit_time = NOW() WHERE id = $1`,
        [ultimo.id]
      );

      console.log(`🔴 Saída registrada para ${tipo}: ${id}`);

      return res.json({
        success: true,
        action: "exit",
        message: "Saída registrada"
      });
    }

    // Caso contrário → registrar entrada
    await pool.query(
      `INSERT INTO acesso (${coluna}) VALUES ($1)`,
      [id]
    );

    console.log(`🟢 Entrada registrada para ${tipo}: ${id}`);

    return res.json({
      success: true,
      action: "entry",
      message: "Entrada registrada"
    });

  } catch (err) {
    console.error("❌ Erro ao registrar acesso:", err);
    res.status(500).json({ error: 'Erro ao registrar acesso' });
  }
};
