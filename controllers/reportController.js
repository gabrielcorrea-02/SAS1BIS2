const pool = require('../config/db');
const PDFDocument = require('pdfkit');


exports.generateReports = (req, res) => {
  if(!req.session.user || req.session.user.role !== 'admin') return res.redirect('/dashboard');
  res.render('reports', { user: req.session.user });
};

exports.exportReport = async (req, res) => {
  if(!req.session.user || req.session.user.role !== 'admin') return res.redirect('/dashboard');

  const { type, startDate, endDate, format } = req.body;
  let data;

  try {
    if(type === 'cp'){
      const result = await pool.query(
        `SELECT 
            a.entry_time  AS horario_de_entrada,
            a.exit_time   AS horario_de_saida,

            cp.nome_completo,
            cp.nome_de_guerra,
            cp.id_mil AS identidade_militar,

            vcp.placa      AS veiculo_placa,
            vcp.marca      AS veiculo_marca,
            vcp.modelo      AS veiculo_modelo,
            vcp.cor        AS veiculo_cor,
            vcp.tipo       AS veiculo_tipo

        FROM acesso a
        JOIN corpo_permanente cp 
            ON cp.id = a.corpo_permanenteFK

        LEFT JOIN veiculo_corpo_permanente vcp 
            ON vcp.corpo_permanenteFK = cp.id

        WHERE a.entry_time BETWEEN $1 AND $2
        ORDER BY a.entry_time ASC`,
        [startDate, endDate]
      );
      data = result.rows;
    } else if(type === 'visitors'){
      const result = await pool.query(
      `
       SELECT 
           a.entry_time AS horario_de_entrada,
           a.exit_time  AS horario_de_saida,
 
           v.nome_completo,
           v.nome_de_guerra,
 
           -- vehicle
           ve.placa  AS veiculo_placa,
           ve.marca  AS veiculo_marca,
           ve.modelo AS veiculo_modelo,
           ve.cor    AS veiculo_cor,
           ve.tipo   AS veiculo_tipo,
 
           -- empresa permanente
           ep.nome  AS empresa_permanente_nome,
           ep.cnpj  AS empresa_permanente_cnpj,
           ep.setor AS empresa_permanente_setor,
 
           -- empresa esporadica
           ee.nome  AS empresa_esporadica_nome,
           ee.setor AS empresa_esporadica_setor,
 
           -- OM
           om.nome       AS organizacao_militar_nome,
           om.guarnicao  AS organizacao_militar_guarnicao
 
       FROM acesso a
       JOIN visitantes v
           ON v.id = a.visitanteFK
 
       LEFT JOIN veiculo_esporadico ve
           ON ve.visitanteFK = v.id
 
       LEFT JOIN empresa_permanente ep
           ON ep.id = v.empresa_permanenteFK
 
       LEFT JOIN empresa_esporadica ee
           ON ee.id = v.empresa_esporadicaFK
 
       LEFT JOIN organizacao_militar om
           ON om.id = v.organizacao_militarFK
 
       WHERE a.entry_time BETWEEN $1 AND $2
       ORDER BY a.entry_time ASC
      `,
        [startDate, endDate]
      );
      data = result.rows;
    }

    else if (type === 'veiculos'){
      const result = await pool.query(
      `
      SELECT 
          a.entry_time AS horario_de_entrada,
          a.exit_time  AS horario_de_saida,

          -- unified vehicle fields
          COALESCE(vp.placa,  ve.placa)  AS placa,
          COALESCE(vp.marca,  ve.marca)  AS marca,
          COALESCE(vp.modelo, ve.modelo) AS modelo,
          COALESCE(vp.cor,    ve.cor)    AS cor,
          COALESCE(vp.tipo,   ve.tipo)   AS tipo,

          -- column indicating the vehicle category
          CASE 
              WHEN ve.id IS NOT NULL THEN 'visitante'
              ELSE 'permanente'
          END AS categoria_veiculo

      FROM acesso a
      LEFT JOIN veiculo_corpo_permanente vp 
            ON vp.id = a.veiculo_corpo_permanenteFK
      LEFT JOIN veiculo_esporadico ve 
            ON ve.id = a.veiculo_esporadicoFK

      WHERE a.entry_time BETWEEN $1 AND $2
      ORDER BY a.entry_time ASC;
      `,
        [startDate, endDate]
      );
      data = result.rows;
    }

    if (format === 'screen') {
      return res.json({ success: true, data });
    }

    if (format === 'csv') {
      if (!data || data.length === 0) {
        // still send a valid (but empty) CSV
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader(
          'Content-Disposition',
          `attachment; filename="${type}_report.csv"`
        );
        return res.status(200).send('');
      }

      const fields = Object.keys(data[0]);

      const csvLines = [
        fields.join(','), // header
        ...data.map(row =>
          fields
            .map(f =>
              // CSV escaping: wrap in quotes, escape internal quotes
              `"${String(row[f] ?? '').replace(/"/g, '""')}"`
            )
            .join(',')
        ),
      ];

      const csv = csvLines.join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${type}_report.csv"`
      );

      return res.status(200).send(csv);
    }


    // ----------- PDF OUTPUT -----------
    if (format === 'pdf') {
      const doc = new PDFDocument();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${type}_report.pdf"`);

      doc.pipe(res);

      doc.fontSize(18).text(`${type.toUpperCase()} Report`, { align: "center" });
      doc.moveDown();

      data.forEach(row => {
        Object.entries(row).forEach(([key, value]) => {
          doc.fontSize(12).text(`${key}: ${value}`);
        });
        doc.moveDown();
      });

      doc.end();
      return doc;
    }


    // res.render('reports', { data, user: req.session.user });

  } catch(err){
    console.error(err);
    res.send('Erro ao gerar relatório');
  }
}