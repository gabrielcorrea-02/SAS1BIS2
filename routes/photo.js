const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/cp/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT foto, foto_mimetype FROM corpo_permanente WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0 || !result.rows[0].foto) {
      return res.status(404).send("Imagem não encontrada");
    }

    res.set("Content-Type", result.rows[0].foto_mimetype);
    res.send(result.rows[0].foto);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

module.exports = router;
