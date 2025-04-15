const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

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
      console.log("Login bem-sucedido para o usuário:", user);
      return res.status(200).send({
        success: true,
        role: user.role,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          departamento: user.departamento || ''
        },
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

/* Buscar dados do usuário logado */
app.get("/user-data", (req, res) => {
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).send({ 
      success: false, 
      message: "Email é obrigatório" 
    });
  }

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("Erro ao buscar dados do usuário:", err);
      return res.status(500).send({ 
        success: false, 
        message: "Erro ao buscar dados do usuário" 
      });
    }

    if (results.length === 0) {
      return res.status(404).send({ 
        success: false, 
        message: "Usuário não encontrado" 
      });
    }

    res.send({ 
      success: true, 
      user: results[0] 
    });
  });
});

/* Rotas de Gerenciamento de Tarefas */

// Criar tarefa
app.post("/tarefas", (req, res) => {
  const { nome, intervalo_dias } = req.body;
  const sql = "INSERT INTO tarefas (nome, intervalo_dias, esta_pausada) VALUES (?, ?, false)";
  
  db.query(sql, [nome, intervalo_dias], (err, result) => {
    if (err) {
      console.error("Erro ao criar tarefa:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao criar tarefa",
        error: err.message
      });
    }
    
    res.status(201).send({
      success: true,
      message: "Tarefa criada com sucesso!",
      taskId: result.insertId
    });
  });
});

// Listar todas as tarefas
app.get("/tarefas", (req, res) => {
  const sql = "SELECT * FROM tarefas ORDER BY nome";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar tarefas:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao buscar tarefas",
        error: err.message
      });
    }
    
    res.send({
      success: true,
      tarefas: results
    });
  });
});

// Atualizar intervalo de dias da tarefa
app.put("/tarefas/:id/intervalo", (req, res) => {
  const { id } = req.params;
  const { intervalo_dias } = req.body;
  
  if (!intervalo_dias || intervalo_dias < 1) {
    return res.status(400).send({
      success: false,
      message: "Intervalo de dias deve ser maior que zero"
    });
  }

  const sql = "UPDATE tarefas SET intervalo_dias = ? WHERE id = ?";
  
  db.query(sql, [intervalo_dias, id], (err, result) => {
    if (err) {
      console.error("Erro ao atualizar intervalo da tarefa:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao atualizar intervalo da tarefa",
        error: err.message
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).send({
        success: false,
        message: "Tarefa não encontrada"
      });
    }
    
    res.send({
      success: true,
      message: "Intervalo da tarefa atualizado com sucesso!"
    });
  });
});

// Pausar/Despausar tarefa específica
app.put("/tarefas/:id/pausar", (req, res) => {
  const { id } = req.params;
  const { esta_pausada } = req.body;
  
  const sql = "UPDATE tarefas SET esta_pausada = ? WHERE id = ?";
  
  db.query(sql, [esta_pausada, id], (err, result) => {
    if (err) {
      console.error("Erro ao atualizar status da tarefa:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao atualizar status da tarefa",
        error: err.message
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).send({
        success: false,
        message: "Tarefa não encontrada"
      });
    }
    
    const status = esta_pausada ? "pausada" : "retomada";
    res.send({
      success: true,
      message: `Tarefa ${status} com sucesso!`
    });
  });
});

// Excluir tarefa
app.delete("/tarefas/:id", (req, res) => {
  const { id } = req.params;
  
  const sql = "DELETE FROM tarefas WHERE id = ?";
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Erro ao excluir tarefa:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao excluir tarefa",
        error: err.message
      });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).send({
        success: false,
        message: "Tarefa não encontrada"
      });
    }
    
    res.send({
      success: true,
      message: "Tarefa excluída com sucesso!"
    });
  });
});

// Inicializar tarefas padrão se não existirem
app.post("/tarefas/inicializar", (req, res) => {
  const tarefasPadrao = [
    { nome: "Casa", intervalo_dias: 2 },
    { nome: "Fogão", intervalo_dias: 2 },
    { nome: "Pia-mesa", intervalo_dias: 1 },
    { nome: "Lixo", intervalo_dias: 1 }
  ];

  // Primeiro, verifica se já existem tarefas
  db.query("SELECT COUNT(*) as count FROM tarefas", (err, results) => {
    if (err) {
      console.error("Erro ao verificar tarefas:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao verificar tarefas existentes",
        error: err.message
      });
    }

    if (results[0].count > 0) {
      return res.send({
        success: true,
        message: "Tarefas já estão inicializadas"
      });
    }

    // Se não existem tarefas, insere as padrão
    const sql = "INSERT INTO tarefas (nome, intervalo_dias, esta_pausada) VALUES ?";
    const values = tarefasPadrao.map(t => [t.nome, t.intervalo_dias, false]);

    db.query(sql, [values], (err, result) => {
      if (err) {
        console.error("Erro ao inicializar tarefas:", err);
        return res.status(500).send({
          success: false,
          message: "Erro ao inicializar tarefas",
          error: err.message
        });
      }

      res.status(201).send({
        success: true,
        message: "Tarefas padrão inicializadas com sucesso!"
      });
    });
  });
});

/* Rotas de Agendamento de Tarefas */

// Verificar e atualizar responsáveis das tarefas
app.post("/tarefas/atualizar-responsaveis", (req, res) => {
  // Busca todas as tarefas que precisam de atualização
  const sql = `
    SELECT t.id, t.nome, t.responsavel_id, t.proxima_execucao
    FROM tarefas t
    WHERE t.esta_pausada = FALSE
    AND (
      t.responsavel_id IS NULL
      OR CURDATE() >= t.proxima_execucao
      OR t.proxima_execucao IS NULL
    )`;

  db.query(sql, (err, tarefas) => {
    if (err) {
      console.error("Erro ao buscar tarefas:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao buscar tarefas",
        error: err.message
      });
    }

    if (tarefas.length === 0) {
      return res.send({
        success: true,
        message: "Nenhuma tarefa precisa de atualização"
      });
    }

    // Para cada tarefa, encontra o próximo responsável elegível
    const processarTarefas = tarefas.map(tarefa => {
      return new Promise((resolve, reject) => {
        const sqlProximoResponsavel = `
          SELECT u.id
          FROM users u
          WHERE u.em_viagem = FALSE
          AND u.id NOT IN (
            SELECT DISTINCT e.usuario_id
            FROM execucoes_tarefas e
            WHERE e.data_execucao = CURDATE()
          )
          AND u.id != ?
          ORDER BY 
            CASE 
              WHEN u.id > ? THEN u.id
              ELSE u.id + (SELECT MAX(id) FROM users)
            END
          LIMIT 1`;

        db.query(
          sqlProximoResponsavel,
          [tarefa.responsavel_id || 0, tarefa.responsavel_id || 0],
          (err, responsaveis) => {
            if (err) {
              console.error("Erro ao buscar próximo responsável:", err);
              return reject(err);
            }

            if (responsaveis.length === 0) {
              // Se não encontrou ninguém elegível, busca o primeiro usuário disponível
              const sqlPrimeiroDisponivel = `
                SELECT u.id
                FROM users u
                WHERE u.em_viagem = FALSE
                LIMIT 1`;

              db.query(sqlPrimeiroDisponivel, (err, primeiros) => {
                if (err) return reject(err);
                if (primeiros.length === 0) return resolve(null);

                const novoResponsavel = primeiros[0].id;
                atualizarResponsavel(tarefa.id, novoResponsavel, resolve, reject);
              });
            } else {
              const novoResponsavel = responsaveis[0].id;
              atualizarResponsavel(tarefa.id, novoResponsavel, resolve, reject);
            }
          }
        );
      });
    });

    // Executa todas as atualizações
    Promise.all(processarTarefas)
      .then(() => {
        res.send({
          success: true,
          message: "Responsáveis atualizados com sucesso"
        });
      })
      .catch(err => {
        console.error("Erro ao atualizar responsáveis:", err);
        res.status(500).send({
          success: false,
          message: "Erro ao atualizar responsáveis",
          error: err.message
        });
      });
  });
});

function atualizarResponsavel(tarefaId, responsavelId, resolve, reject) {
  const sqlUpdate = `
    UPDATE tarefas 
    SET responsavel_id = ?,
        proxima_execucao = DATE_ADD(CURDATE(), INTERVAL intervalo_dias DAY)
    WHERE id = ?`;

  db.query(sqlUpdate, [responsavelId, tarefaId], (err) => {
    if (err) {
      console.error("Erro ao atualizar responsável:", err);
      return reject(err);
    }
    resolve();
  });
}

// Modificar a rota de agendamento para incluir informações do responsável
app.get("/tarefas/agendamento", (req, res) => {
  const sql = `
    SELECT 
      t.*,
      u.name as responsavel_nome,
      CASE 
        WHEN t.esta_pausada = 1 THEN 'pausada'
        WHEN t.ultima_execucao IS NULL THEN 'pendente'
        WHEN CURDATE() >= COALESCE(t.proxima_execucao, CURDATE()) THEN 'pendente'
        ELSE 'em_dia'
      END as status,
      COALESCE(t.proxima_execucao, CURDATE()) as data_prevista,
      (
        SELECT u2.name 
        FROM users u2 
        WHERE u2.id = (
          SELECT e.usuario_id 
          FROM execucoes_tarefas e 
          WHERE e.tarefa_id = t.id 
          ORDER BY e.data_execucao DESC 
          LIMIT 1
        )
      ) as ultimo_responsavel,
      (
        SELECT MAX(e.data_execucao)
        FROM execucoes_tarefas e
        WHERE e.tarefa_id = t.id
      ) as ultima_execucao
    FROM tarefas t
    LEFT JOIN users u ON t.responsavel_id = u.id
    ORDER BY 
      CASE 
        WHEN t.esta_pausada = 1 THEN 2
        WHEN t.ultima_execucao IS NULL THEN 0
        WHEN CURDATE() >= t.proxima_execucao THEN 0
        ELSE 1
      END,
      t.nome`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar agendamento:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao buscar agendamento de tarefas",
        error: err.message
      });
    }

    // Formatar os resultados
    const tarefas = results.map(tarefa => ({
      ...tarefa,
      esta_pausada: !!tarefa.esta_pausada,
      data_prevista: tarefa.data_prevista ? new Date(tarefa.data_prevista).toISOString().split('T')[0] : null,
      ultima_execucao: tarefa.ultima_execucao ? new Date(tarefa.ultima_execucao).toISOString().split('T')[0] : null,
      proxima_execucao: tarefa.proxima_execucao ? new Date(tarefa.proxima_execucao).toISOString().split('T')[0] : null
    }));

    res.send({
      success: true,
      tarefas: tarefas
    });
  });
});

// Registrar execução de tarefa
app.post("/tarefas/:id/executar", (req, res) => {
  const { id } = req.params;
  const { usuario_id, data_execucao } = req.body;

  // Primeiro verifica se a tarefa está pausada
  db.query("SELECT esta_pausada FROM tarefas WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Erro ao verificar status da tarefa:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao verificar status da tarefa",
        error: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).send({
        success: false,
        message: "Tarefa não encontrada"
      });
    }

    if (results[0].esta_pausada) {
      return res.status(400).send({
        success: false,
        message: "Não é possível executar uma tarefa pausada"
      });
    }

    // Se não estiver pausada, registra a execução
    const sql = "INSERT INTO execucoes_tarefas (tarefa_id, usuario_id, data_execucao) VALUES (?, ?, ?)";
    db.query(sql, [id, usuario_id, data_execucao || new Date()], (err, result) => {
      if (err) {
        console.error("Erro ao registrar execução:", err);
        return res.status(500).send({
          success: false,
          message: "Erro ao registrar execução da tarefa",
          error: err.message
        });
      }

      res.status(201).send({
        success: true,
        message: "Execução registrada com sucesso!",
        execucaoId: result.insertId
      });
    });
  });
});

// Histórico de execuções de uma tarefa
app.get("/tarefas/:id/historico", (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT e.*, u.name as responsavel
    FROM execucoes_tarefas e
    JOIN users u ON e.usuario_id = u.id
    WHERE e.tarefa_id = ?
    ORDER BY e.data_execucao DESC
    LIMIT 10`;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar histórico:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao buscar histórico de execuções",
        error: err.message
      });
    }

    // Formatar as datas
    const historico = results.map(execucao => ({
      ...execucao,
      data_execucao: new Date(execucao.data_execucao).toISOString().split('T')[0]
    }));

    res.send({
      success: true,
      historico: historico
    });
  });
});

/* Rotas de Gerenciamento de Pessoas */

// Listar pessoas com suas posições
app.get("/pessoas/ordem", (req, res) => {
  const sql = `SELECT * FROM view_pessoas_ordem ORDER BY posicao, name`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar ordem das pessoas:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao buscar ordem das pessoas",
        error: err.message
      });
    }

    res.send({
      success: true,
      pessoas: results
    });
  });
});

// Inicializar ordem das pessoas (para quem ainda não tem posição definida)
app.post("/pessoas/ordem/inicializar", (req, res) => {
  const sql = `
    INSERT INTO ordem_pessoas (usuario_id, posicao)
    SELECT 
      u.id,
      COALESCE((SELECT MAX(posicao) + 1 FROM ordem_pessoas), 1)
    FROM users u
    LEFT JOIN ordem_pessoas op ON u.id = op.usuario_id
    WHERE op.id IS NULL`;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Erro ao inicializar ordem das pessoas:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao inicializar ordem das pessoas",
        error: err.message
      });
    }

    res.send({
      success: true,
      message: "Ordem das pessoas inicializada com sucesso!"
    });
  });
});

// Atualizar posição de uma pessoa
app.put("/pessoas/ordem/:id", (req, res) => {
  const { id } = req.params;
  const { nova_posicao } = req.body;

  if (!nova_posicao || nova_posicao < 1) {
    return res.status(400).send({
      success: false,
      message: "Nova posição inválida"
    });
  }

  // Primeiro verifica se a pessoa já tem uma posição
  db.query(
    "SELECT posicao FROM ordem_pessoas WHERE usuario_id = ?",
    [id],
    (err, results) => {
      if (err) {
        console.error("Erro ao verificar posição atual:", err);
        return res.status(500).send({
          success: false,
          message: "Erro ao verificar posição atual",
          error: err.message
        });
      }

      if (results.length === 0) {
        // Se não tem posição, insere
        const insertSql = "INSERT INTO ordem_pessoas (usuario_id, posicao) VALUES (?, ?)";
        db.query(insertSql, [id, nova_posicao], handleResponse);
      } else {
        // Se já tem posição, atualiza
        const updateSql = "UPDATE ordem_pessoas SET posicao = ? WHERE usuario_id = ?";
        db.query(updateSql, [nova_posicao, id], handleResponse);
      }
    }
  );

  function handleResponse(err, result) {
    if (err) {
      console.error("Erro ao atualizar posição:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao atualizar posição",
        error: err.message
      });
    }

    res.send({
      success: true,
      message: "Posição atualizada com sucesso!"
    });
  }
});

// Mover pessoa para cima ou para baixo na lista
app.post("/pessoas/ordem/:id/mover", (req, res) => {
  const { id } = req.params;
  const { direcao } = req.body; // 'cima' ou 'baixo'

  if (!['cima', 'baixo'].includes(direcao)) {
    return res.status(400).send({
      success: false,
      message: "Direção inválida"
    });
  }

  // Primeiro busca a posição atual
  db.query(
    "SELECT posicao FROM ordem_pessoas WHERE usuario_id = ?",
    [id],
    (err, results) => {
      if (err) {
        console.error("Erro ao buscar posição atual:", err);
        return res.status(500).send({
          success: false,
          message: "Erro ao buscar posição atual",
          error: err.message
        });
      }

      if (results.length === 0) {
        return res.status(404).send({
          success: false,
          message: "Pessoa não encontrada na ordem"
        });
      }

      const posicaoAtual = results[0].posicao;
      const novaPosicao = direcao === 'cima' ? posicaoAtual - 1 : posicaoAtual + 1;

      // Verifica se existe alguém na nova posição
      db.query(
        "SELECT usuario_id FROM ordem_pessoas WHERE posicao = ?",
        [novaPosicao],
        (err, results) => {
          if (err) {
            console.error("Erro ao verificar nova posição:", err);
            return res.status(500).send({
              success: false,
              message: "Erro ao verificar nova posição",
              error: err.message
            });
          }

          if (results.length === 0) {
            return res.status(400).send({
              success: false,
              message: "Não é possível mover para esta posição"
            });
          }

          const outroUsuarioId = results[0].usuario_id;

          // Troca as posições
          db.beginTransaction(err => {
            if (err) {
              console.error("Erro ao iniciar transação:", err);
              return res.status(500).send({
                success: false,
                message: "Erro ao iniciar transação",
                error: err.message
              });
            }

            db.query(
              "UPDATE ordem_pessoas SET posicao = ? WHERE usuario_id = ?",
              [novaPosicao, id],
              (err) => {
                if (err) {
                  return db.rollback(() => {
                    res.status(500).send({
                      success: false,
                      message: "Erro ao atualizar posição",
                      error: err.message
                    });
                  });
                }

                db.query(
                  "UPDATE ordem_pessoas SET posicao = ? WHERE usuario_id = ?",
                  [posicaoAtual, outroUsuarioId],
                  (err) => {
                    if (err) {
                      return db.rollback(() => {
                        res.status(500).send({
                          success: false,
                          message: "Erro ao atualizar posição",
                          error: err.message
                        });
                      });
                    }

                    db.commit(err => {
                      if (err) {
                        return db.rollback(() => {
                          res.status(500).send({
                            success: false,
                            message: "Erro ao finalizar transação",
                            error: err.message
                          });
                        });
                      }

                      res.send({
                        success: true,
                        message: "Posição atualizada com sucesso!"
                      });
                    });
                  }
                );
              }
            );
          });
        }
      );
    }
  );
});

/* Rotas de Gerenciamento de Viagens */

// Registrar início de viagem
app.post("/viagens/iniciar", (req, res) => {
  const { usuario_id, data_saida } = req.body;

  db.beginTransaction(err => {
    if (err) {
      console.error("Erro ao iniciar transação:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao iniciar transação",
        error: err.message
      });
    }

    // Primeiro atualiza o status em_viagem do usuário
    db.query(
      "UPDATE users SET em_viagem = TRUE WHERE id = ?",
      [usuario_id],
      (err) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).send({
              success: false,
              message: "Erro ao atualizar status de viagem",
              error: err.message
            });
          });
        }

        // Depois registra a nova viagem
        db.query(
          "INSERT INTO viagens (usuario_id, data_saida) VALUES (?, ?)",
          [usuario_id, data_saida],
          (err, result) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).send({
                  success: false,
                  message: "Erro ao registrar viagem",
                  error: err.message
                });
              });
            }

            db.commit(err => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).send({
                    success: false,
                    message: "Erro ao finalizar transação",
                    error: err.message
                  });
                });
              }

              res.send({
                success: true,
                message: "Viagem registrada com sucesso!",
                viagem_id: result.insertId
              });
            });
          }
        );
      }
    );
  });
});

// Registrar retorno de viagem
app.post("/viagens/:id/retorno", (req, res) => {
  const { id } = req.params;
  const { data_retorno } = req.body;

  db.beginTransaction(err => {
    if (err) {
      console.error("Erro ao iniciar transação:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao iniciar transação",
        error: err.message
      });
    }

    // Primeiro busca os dados da viagem
    db.query(
      "SELECT usuario_id, data_saida FROM viagens WHERE id = ?",
      [id],
      (err, results) => {
        if (err) {
          return db.rollback(() => {
            res.status(500).send({
              success: false,
              message: "Erro ao buscar dados da viagem",
              error: err.message
            });
          });
        }

        if (results.length === 0) {
          return db.rollback(() => {
            res.status(404).send({
              success: false,
              message: "Viagem não encontrada"
            });
          });
        }

        const { usuario_id, data_saida } = results[0];
        const dias_fora = Math.ceil((new Date(data_retorno) - new Date(data_saida)) / (1000 * 60 * 60 * 24));

        // Variável para controlar quando todas as operações estão concluídas
        let operacoesConcluidas = false;

        // Atualiza o registro da viagem
        db.query(
          "UPDATE viagens SET data_retorno = ?, dias_fora = ? WHERE id = ?",
          [data_retorno, dias_fora, id],
          (err) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).send({
                  success: false,
                  message: "Erro ao registrar retorno",
                  error: err.message
                });
              });
            }

            // Atualiza o status em_viagem do usuário
            db.query(
              "UPDATE users SET em_viagem = FALSE WHERE id = ?",
              [usuario_id],
              (err) => {
                if (err) {
                  return db.rollback(() => {
                    res.status(500).send({
                      success: false,
                      message: "Erro ao atualizar status de viagem",
                      error: err.message
                    });
                  });
                }

                // Verifica se hoje é dia da pessoa fazer alguma tarefa
                db.query(
                  `SELECT t.id, t.nome
                   FROM tarefas t
                   WHERE t.responsavel_id = ?
                   AND t.esta_pausada = FALSE
                   AND CURDATE() >= COALESCE(t.proxima_execucao, CURDATE())`,
                  [usuario_id],
                  (err, tarefasHoje) => {
                    if (err) {
                      return db.rollback(() => {
                        res.status(500).send({
                          success: false,
                          message: "Erro ao verificar tarefas do dia",
                          error: err.message
                        });
                      });
                    }

                    // Se tem tarefas hoje, passa para a próxima pessoa
                    if (tarefasHoje.length > 0) {
                      const tarefasIds = tarefasHoje.map(t => t.id);
                      
                      // Busca próxima pessoa disponível (não em viagem) para cada tarefa
                      db.query(
                        `UPDATE tarefas t
                         JOIN (
                           SELECT u.id as proximo_id
                           FROM users u
                           WHERE u.em_viagem = FALSE
                           AND u.id != ?
                           AND u.id NOT IN (
                             SELECT e.usuario_id
                             FROM execucoes_tarefas e
                             WHERE e.data_execucao = CURDATE()
                           )
                           ORDER BY u.id
                           LIMIT 1
                         ) prox
                         SET t.responsavel_id = prox.proximo_id,
                             t.proxima_execucao = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
                         WHERE t.id IN (?)`,
                        [usuario_id, tarefasIds],
                        (err) => {
                          if (err) {
                            return db.rollback(() => {
                              res.status(500).send({
                                success: false,
                                message: "Erro ao realocar tarefas do dia",
                                error: err.message
                              });
                            });
                          }

                          // Agenda o retorno das tarefas para a pessoa no dia seguinte
                          db.query(
                            `UPDATE tarefas
                             SET responsavel_id = ?,
                                 proxima_execucao = DATE_ADD(CURDATE(), INTERVAL 2 DAY)
                             WHERE id IN (?)`,
                            [usuario_id, tarefasIds],
                            (err) => {
                              if (err) {
                                return db.rollback(() => {
                                  res.status(500).send({
                                    success: false,
                                    message: "Erro ao agendar retorno das tarefas",
                                    error: err.message
                                  });
                                });
                              }

                              // Se a viagem durou menos de 7 dias, retorna as outras tarefas
                              if (dias_fora < 7) {
                                db.query(
                                  `UPDATE tarefas 
                                   SET responsavel_id = ? 
                                   WHERE responsavel_id IS NULL 
                                   AND id NOT IN (?)
                                   AND id IN (
                                     SELECT tarefa_id 
                                     FROM execucoes_tarefas 
                                     WHERE usuario_id = ? 
                                     AND data_execucao < ?
                                     GROUP BY tarefa_id
                                   )`,
                                  [usuario_id, tarefasIds, usuario_id, data_saida],
                                  finalizeTransaction
                                );
                              } else {
                                finalizeTransaction(null);
                              }
                            }
                          );
                        }
                      );
                    } else {
                      // Se não tem tarefas hoje, apenas retorna as tarefas antigas se viagem < 7 dias
                      if (dias_fora < 7) {
                        db.query(
                          `UPDATE tarefas 
                           SET responsavel_id = ? 
                           WHERE responsavel_id IS NULL 
                           AND id IN (
                             SELECT tarefa_id 
                             FROM execucoes_tarefas 
                             WHERE usuario_id = ? 
                             AND data_execucao < ?
                             GROUP BY tarefa_id
                           )`,
                          [usuario_id, usuario_id, data_saida],
                          finalizeTransaction
                        );
                      } else {
                        finalizeTransaction(null);
                      }
                    }
                  }
                );
              }
            );
          }
        );
      }
    );
  });

  function finalizeTransaction(err) {
    if (err) {
      return db.rollback(() => {
        res.status(500).send({
          success: false,
          message: "Erro ao finalizar operação",
          error: err.message
        });
      });
    }

    db.commit(err => {
      if (err) {
        return db.rollback(() => {
          res.status(500).send({
            success: false,
            message: "Erro ao finalizar transação",
            error: err.message
          });
        });
      }

      let operacoesConcluidas = false;
      if (operacoesConcluidas) {
        res.send({
          success: true,
          message: "Retorno registrado com sucesso!",
          dias_fora: dias_fora
        });
      } else {
        operacoesConcluidas = true;
      }
    });
  }
});

// Listar viagens de um usuário
app.get("/viagens/usuario/:id", (req, res) => {
  const { id } = req.params;
  
  const sql = `
    SELECT v.*, u.name as nome_usuario
    FROM viagens v
    JOIN users u ON v.usuario_id = u.id
    WHERE v.usuario_id = ?
    ORDER BY v.data_saida DESC`;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar viagens:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao buscar viagens",
        error: err.message
      });
    }

    res.send({
      success: true,
      viagens: results.map(viagem => ({
        ...viagem,
        data_saida: new Date(viagem.data_saida).toISOString().split('T')[0],
        data_retorno: viagem.data_retorno ? new Date(viagem.data_retorno).toISOString().split('T')[0] : null
      }))
    });
  });
});

/* Rotas de Tarefas do Usuário */

// Rota para buscar tarefas do usuário
app.get("/tarefas/usuario/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    // Verificar se o usuário está em viagem
    const [userStatus] = await new Promise((resolve, reject) => {
      db.query(
        "SELECT em_viagem FROM users WHERE id = ?",
        [userId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    if (userStatus.em_viagem) {
      return res.json({
        success: true,
        em_viagem: true,
        tarefas_hoje: [],
        historico: []
      });
    }

    // Buscar tarefas para hoje
    const tarefasHoje = await new Promise((resolve, reject) => {
      db.query(
        `
        SELECT id, nome, intervalo_dias, proxima_execucao
        FROM view_tarefas_agendadas
        WHERE responsavel_id = ?
        AND esta_pausada = FALSE
        AND CURDATE() >= COALESCE(proxima_execucao, CURDATE())
        ORDER BY nome
        `,
        [userId],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    // Buscar histórico dos últimos 7 dias
    const historico = await new Promise((resolve, reject) => {
      db.query(
        `
        SELECT 
          DATE_FORMAT(e.data_execucao, '%d/%m/%Y') as data,
          GROUP_CONCAT(t.nome) as tarefas
        FROM execucoes_tarefas e
        JOIN tarefas t ON e.tarefa_id = t.id
        WHERE e.usuario_id = ?
        AND e.data_execucao >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY e.data_execucao
        ORDER BY e.data_execucao DESC
        `,
        [userId],
        (err, results) => {
          if (err) reject(err);
          else {
            resolve(results.map(row => ({
              data: row.data,
              tarefas: row.tarefas.split(',')
            })));
          }
        }
      );
    });

    res.json({
      success: true,
      em_viagem: false,
      tarefas_hoje: tarefasHoje,
      historico: historico
    });

  } catch (error) {
    console.error("Erro ao buscar tarefas do usuário:", error);
    res.status(500).json({
      success: false,
      message: "Erro ao buscar tarefas do usuário"
    });
  }
});

// Rotas para gerenciamento de pessoas
app.get("/pessoas/ordem", (req, res) => {
  db.query("SELECT * FROM users ORDER BY ordem ASC", (err, results) => {
    if (err) {
      console.error("Erro ao buscar pessoas:", err);
      res.status(500).send({
        success: false,
        message: "Erro ao buscar pessoas",
        error: err.message,
      });
      return;
    }
    res.send({
      success: true,
      pessoas: results
    });
  });
});

app.post("/pessoas/reordenar", (req, res) => {
  const { ordem } = req.body;
  
  if (!ordem || !Array.isArray(ordem)) {
    res.status(400).send({
      success: false,
      message: "Ordem inválida"
    });
    return;
  }

  // Atualiza a ordem de cada pessoa
  const updatePromises = ordem.map((id, index) => {
    return new Promise((resolve, reject) => {
      db.query(
        "UPDATE users SET ordem = ? WHERE id = ?",
        [index + 1, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  });

  Promise.all(updatePromises)
    .then(() => {
      res.send({
        success: true,
        message: "Ordem atualizada com sucesso"
      });
    })
    .catch((err) => {
      console.error("Erro ao atualizar ordem:", err);
      res.status(500).send({
        success: false,
        message: "Erro ao atualizar ordem",
        error: err.message
      });
    });
});

app.listen(3001, () => {
  console.log("Servidor rodando na porta 3001");
});
