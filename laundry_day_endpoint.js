// Endpoint para definir o dia de lavanderia de um usuário
app.post("/dia-lavanderia", (req, res) => {
  const { name, dia_lavanderia } = req.body;

  if (!name || !dia_lavanderia) {
    return res.status(400).send({
      success: false,
      message: "Nome e dia de lavanderia são obrigatórios",
    });
  }

  const sql = "UPDATE users SET dia_lavanderia = ? WHERE name = ?";
  db.query(sql, [dia_lavanderia, name], (err, result) => {
    if (err) {
      console.error("Erro ao definir dia de lavanderia:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao definir dia de lavanderia",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    res.send({
      success: true,
      message: "Dia de lavanderia definido com sucesso",
    });
  });
});

// Endpoint para buscar o dia de lavanderia de um usuário
app.get("/dia-lavanderia/:name", (req, res) => {
  const { name } = req.params;

  if (!name) {
    return res.status(400).send({
      success: false,
      message: "Nome do usuário é obrigatório",
    });
  }

  const sql = "SELECT dia_lavanderia FROM users WHERE name = ?";
  db.query(sql, [name], (err, result) => {
    if (err) {
      console.error("Erro ao buscar dia de lavanderia:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao buscar dia de lavanderia",
        error: err.message,
      });
    }

    if (result.length === 0) {
      return res.status(404).send({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    res.send({
      success: true,
      dia_lavanderia: result[0].dia_lavanderia,
    });
  });
});
