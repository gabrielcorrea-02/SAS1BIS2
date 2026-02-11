// ./controllers/qrGenController.js
const pool = require('../config/db');

const QRCode = require('qrcode');
const sharp = require('sharp');
const path = require('path');

exports.renderQRPage = (req, res) => {
  res.render('qrGen', { user: req.user });
};

exports.generateQR = async (req, res) => {
  const text = req.query.text;
  const type = req.query.type; // 'cp' ou 'guest'
  if (!text) return res.status(400).send('Texto é obrigatório');

  try {
    // 1. Gerar QR code (PNG buffer)
    const qrBuffer = await QRCode.toBuffer(text, {
      type: 'png',
      width: 300,
      errorCorrectionLevel: 'H',
      margin: 1
    });

    // 2. Escolher template
    let templateFile;
    if (type === 'cp') templateFile = 'cpBadge.png';
    else templateFile = 'guestBadge.png';

    const templatePath = path.join(__dirname, '..', '..', 'assets', templateFile);
    const template = sharp(templatePath);

    // 3. Ler metadata real da imagem
    const meta = await template.metadata();

    // --- DEFINIR O QUADRADO DO QR ---
    const square = {
      left: 60,
      top: 470,  // ajuste se necessário
      size: 480
    };

    // 4. Redimensionar QR para caber no quadrado
    const qrResized = await sharp(qrBuffer)
      .resize(square.size - 20, square.size - 20) // margem interna
      .toBuffer();

    // 5. Calcular posição centralizada
    const x = square.left + (square.size - (square.size - 20)) / 2;
    const y = square.top + (square.size - (square.size - 20)) / 2;

    // 6. Compor imagem final
    const finalImage = await sharp(templatePath)
      .composite([{ input: qrResized, top: y, left: x }])
      .png()
      .toBuffer();

    res.setHeader('Content-Type', 'image/png');
    res.send(finalImage);

  } catch (err) {
    console.error('ERRO REAL DO SHARP:', err);
    res.status(500).send('Erro ao gerar QR Code com template');
  }
};

exports.generateCpQR = async (req, res) => {
  const text = req.query.text;     // conteúdo do QR
  const memberId = req.query.id;   // ID do membro do CP

  if (!text) return res.status(400).send("Texto é obrigatório");
  if (!memberId) return res.status(400).send("ID do membro é obrigatório");

  try {
    // ===============================================================
    // 1. GERAR QR CODE BASE
    // ===============================================================
    const qrBuffer = await QRCode.toBuffer(text, {
      type: 'png',
      width: 600,           // maior resolução = melhor qualidade ao reduzir
      errorCorrectionLevel: 'H',
      margin: 1
    });

    // ===============================================================
    // 2. CARREGAR TEMPLATE REAL DO CRACHÁ
    // ===============================================================
    const templatePath = path.join(__dirname, '..', '..', 'assets', 'cpBadge2.png');
    const template = sharp(templatePath);
    const meta = await template.metadata(); // 193x672 px

    // ===============================================================
    // 3. BUSCAR FOTO NO BANCO
    // ===============================================================
    const { rows } = await pool.query(
      `SELECT foto FROM corpo_permanente WHERE id = $1`,
      [memberId]
    );

    let fotoBuffer = rows.length && rows[0].foto ? rows[0].foto : null;

    // Se não houver foto, gera imagem branca
    if (!fotoBuffer) {
      const svgText = `
        <svg width="360" height="450">
          <rect width="100%" height="100%" fill="#e6e6e6"/>
          <text x="50%" y="50%" font-size="32" font-family="Arial"
                fill="#555" text-anchor="middle" dominant-baseline="middle">
            Usuário sem foto
          </text>
        </svg>
      `;

      fotoBuffer = Buffer.from(svgText);
    }

    // ===============================================================
    // 4. DEFINIR ÁREAS BASEADAS NO TEMPLATE REAL
    // ===============================================================

    // Caixa da foto (retângulo superior do template)
    const fotoBox = {
      left: 120,   // centralizado após o resize
      top: 485,
      width: 360,
      height: 450
    };


    // Caixa do QR (retângulo inferior do template)
    const qrBox = {
      left: 95,
      top: 1024 + 150 + 10,   // 1174 px
      width: 400,
      height: 400
    };


    // ===============================================================
    // 5. PROCESSAR FOTO
    // ===============================================================
    const fotoFinal = await sharp(fotoBuffer)
      .resize(fotoBox.width, fotoBox.height, { fit: 'cover' })
      .toBuffer();

    // ===============================================================
    // 6. PROCESSAR QR (rotacionado 180°)
    // ===============================================================
    const qrFinal = await sharp(qrBuffer)
      .resize(qrBox.width, qrBox.height, { fit: 'contain' })
      .rotate(180)
      .toBuffer();

    // ===============================================================
    // 7. COMPOSIÇÃO FINAL
    // ===============================================================
    const finalImage = await sharp(templatePath)
      .composite([
        { input: fotoFinal, left: fotoBox.left, top: fotoBox.top },
        { input: qrFinal, left: qrBox.left, top: qrBox.top }
      ])
      .png()
      .toBuffer();

    // ===============================================================
    // 8. RETORNO
    // ===============================================================
    res.setHeader("Content-Type", "image/png");
    res.send(finalImage);

  } catch (err) {
    console.error("Erro ao gerar crachá CP:", err);
    res.status(500).send("Erro ao gerar crachá do CP");
  }
};
