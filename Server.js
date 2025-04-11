const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Otakuac.ofc0",
  database: "casaestudante",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Conectado ao MySQL!");
});

/* Cadastro */
app.post("/register", (req, res) => {
  const { name, email, password } = req.body;
  const sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
  db.query(sql, [name, email, password], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ message: "Usuário cadastrado com sucesso!" });
  });
});

/* Login */
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).send({
      success: false,
      message: "Por favor, preencha todos os campos.",
    });
  }

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("Erro ao buscar no banco:", err);
      return res.status(500).send({
        success: false,
        message: "Erro no servidor. Tente novamente mais tarde.",
      });
    }

    if (results.length === 0) {
      return res
        .status(401)
        .send({ success: false, message: "Email ou senha incorretos." });
    }

    const user = results[0];
    console.log("Usuário encontrado no banco:", user);

    if (user.password === password) {
      return res.status(200).send({
        success: true,
        role: user.role,
        message: "Login realizado com sucesso!",
      });
    } else {
      return res
        .status(401)
        .send({ success: false, message: "Email ou senha incorretos." });
    }
  });
});

/* Definir Departamentos */
app.post("/departamentos", (req, res) => {
  const { name, departamento } = req.body;
  const sql = "UPDATE users SET departamento = ? WHERE name = ?";
  db.query(sql, [departamento, name], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ message: "Departamento atribuído com sucesso!" });
  });
});

app.get("/departamentos", (req, res) => {
  const sql = "SELECT departamento FROM users";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

/* Definir Aniversários */
app.post("/aniversarios", (req, res) => {
  const { name, date } = req.body;
  const sql = "UPDATE users SET aniversario = ? WHERE name = ?";
  db.query(sql, [date, name], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ message: "Aniversário registrado com sucesso!" });
  });
});

app.get("/aniversarios", (req, res) => {
  const sql = "SELECT aniversario FROM users";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

/* Definir Datas de Fazer o Caixa */
app.post("/data_caixa", (req, res) => {
  const { date } = req.body;
  const sql = "UPDATE caixa SET data_realizacao = ?";
  db.query(sql, [date], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ message: "Data do caixa definida com sucesso!" });
  });
});

app.get("/data_caixa", (req, res) => {
  const sql = "SELECT data_realizacao FROM caixa";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).send(err);
    res.send(result[0]);
  });
});

/* Pausar ou Retomar Tarefas */
app.post("/tasks/pause", (req, res) => {
  const { status } = req.body; // status = "paused" ou "active"
  const sql = "UPDATE tarefas SET status = ?";
  db.query(sql, [status], (err, result) => {
    if (err) return res.status(500).send(err);
    const message =
      status === "paused"
        ? "Tarefas pausadas com sucesso!"
        : "Tarefas retomadas com sucesso!";
    res.send({ message });
  });
});

app.get("/tasks/status", (req, res) => {
  const sql = "SELECT status FROM tarefas";
  db.query(sql, (err, result) => {
    if (err) return res.status(500).send(err);
    res.send(result[0]);
  });
});

/* Transferir Propriedade de Admin */
app.post("/transfer-admin", (req, res) => {
  const { newAdminId, role } = req.body;
  const sql = "UPDATE users SET role = ? WHERE name = ?";
  db.query(sql, [role, newAdminId], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ message: `Usuário definido como ${role} com sucesso!` });
  });
});

/* Remover Admin */
app.post("/remove-admin", (req, res) => {
  const { currentAdminId } = req.body;
  const sql = "UPDATE users SET role = 'user' WHERE name = ?";
  db.query(sql, [currentAdminId], (err, result) => {
    if (err) return res.status(500).send(err);
    res.send({ message: "Admin removido com sucesso!" });
  });
});

/*Usuários*/
app.get("/users", (req, res) => {
  const sql = "SELECT * FROM users";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

/*Remover Usuário*/
app.post("/remove-user", (req, res) => {
  const { name } = req.body;
  
  console.log("Tentando remover usuário:", name);
  
  if (!name) {
    console.log("Nome do usuário não fornecido");
    return res.status(400).send({ 
      success: false, 
      message: "Nome do usuário não fornecido" 
    });
  }

  // Primeiro verifica se o usuário existe
  const checkSql = "SELECT * FROM users WHERE name = ?";
  db.query(checkSql, [name], (err, results) => {
    if (err) {
      console.error("Erro ao verificar usuário:", err);
      return res.status(500).send({ 
        success: false, 
        message: "Erro ao verificar usuário",
        error: err.message 
      });
    }

    if (results.length === 0) {
      console.log("Usuário não encontrado:", name);
      return res.status(404).send({ 
        success: false, 
        message: "Usuário não encontrado" 
      });
    }

    const userId = results[0].id;
    console.log("ID do usuário encontrado:", userId);

    // Primeiro deleta os registros relacionados na tabela tarefas
    const deleteTarefasSql = "DELETE FROM tarefas WHERE responsavel_id = ?";
    db.query(deleteTarefasSql, [userId], (err, result) => {
      if (err) {
        console.error("Erro ao remover tarefas relacionadas:", err);
        return res.status(500).send({ 
          success: false, 
          message: "Erro ao remover tarefas relacionadas",
          error: err.message 
        });
      }

      console.log("Tarefas relacionadas removidas com sucesso");

      // Depois deleta os registros relacionados na tabela roupas
      const deleteRoupasSql = "DELETE FROM roupas WHERE usuario_id = ?";
      db.query(deleteRoupasSql, [userId], (err, result) => {
        if (err) {
          console.error("Erro ao remover registros de roupas:", err);
          return res.status(500).send({ 
            success: false, 
            message: "Erro ao remover registros de roupas",
            error: err.message 
          });
        }

        console.log("Registros de roupas removidos com sucesso");

        // Por fim, deleta o usuário
        const deleteUserSql = "DELETE FROM users WHERE id = ?";
        db.query(deleteUserSql, [userId], (err, result) => {
          if (err) {
            console.error("Erro ao remover usuário:", err);
            return res.status(500).send({ 
              success: false, 
              message: "Erro ao remover usuário",
              error: err.message 
            });
          }

          /*Redefinir Senha*/ 
          const redefinirSenha = "UPDATE users SET password = '123456' WHERE id = ?";
          db.query(redefinirSenha, [userId], (err, result) => {
            if (err) {
              console.error("Erro ao redefinir senha:", err);
            }
          });

          console.log("Usuário removido com sucesso:", name);
          res.send({ 
            success: true, 
            message: "Usuário removido com sucesso!" 
          });
        });
      });
    });
  });
});

/*Redefinir Senha*/
app.post("/redefinir-senha", (req, res) => {
  const { email, newPassword } = req.body;
  
  if (!email || !newPassword) {
    return res.status(400).send({ 
      success: false, 
      message: "Email e nova senha são obrigatórios" 
    });
  }

  const sql = "UPDATE users SET password = ? WHERE email = ?";
  db.query(sql, [newPassword, email], (err, result) => {
    if (err) {
      console.error("Erro ao redefinir senha:", err);
      return res.status(500).send({ 
        success: false, 
        message: "Erro ao redefinir senha",
        error: err.message 
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({ 
        success: false, 
        message: "Email não encontrado" 
      });
    }

    res.send({ 
      success: true, 
      message: "Senha redefinida com sucesso!" 
    });
  });
});

app.listen(3001, () => {
  console.log("Servidor rodando na porta 3001");
});
