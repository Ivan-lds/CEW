const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(bodyParser.json());

// Configuração avançada do CORS para aceitar conexões de qualquer origem
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Cache-Control",
      "Pragma",
      "Expires",
    ],
  })
);

// Middleware para debug de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Endpoint para verificar a saúde do servidor
app.get("/health", (req, res) => {
  res.status(200).send({
    success: true,
    message: "Servidor está funcionando corretamente",
    timestamp: new Date().toISOString(),
  });
});

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
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

  console.log("Tentativa de login - Dados recebidos:", {
    email,
    senhaFornecida: password,
  });

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
      console.log("Usuário não encontrado");
      return res
        .status(401)
        .send({ success: false, message: "Email ou senha incorretos." });
    }

    const user = results[0];
    console.log("Comparação de senhas:", {
      senhaFornecida: password,
      senhaNoBanco: user.password,
      saoIguais: user.password === password,
    });

    if (user.password === password) {
      console.log("Login bem-sucedido para:", user.email);
      return res.status(200).send({
        success: true,
        role: user.role,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          departamento: user.departamento || "",
        },
        message: "Login realizado com sucesso!",
      });
    } else {
      console.log("Senha incorreta para usuário:", user.email);
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
  // Modificado para ordenar os usuários pela coluna 'ordem'
  const sql = "SELECT * FROM users ORDER BY ordem ASC";
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
      message: "Nome do usuário não fornecido",
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
        error: err.message,
      });
    }

    if (results.length === 0) {
      console.log("Usuário não encontrado:", name);
      return res.status(404).send({
        success: false,
        message: "Usuário não encontrado",
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
          error: err.message,
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
            error: err.message,
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
              error: err.message,
            });
          }

          /*Redefinir Senha*/
          const redefinirSenha =
            "UPDATE users SET password = '123456' WHERE id = ?";
          db.query(redefinirSenha, [userId], (err, result) => {
            if (err) {
              console.error("Erro ao redefinir senha:", err);
            }
          });

          console.log("Usuário removido com sucesso:", name);
          res.send({
            success: true,
            message: "Usuário removido com sucesso!",
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
      message: "Email e nova senha são obrigatórios",
    });
  }

  const sql = "UPDATE users SET password = ? WHERE email = ?";
  db.query(sql, [newPassword, email], (err, result) => {
    if (err) {
      console.error("Erro ao redefinir senha:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao redefinir senha",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({
        success: false,
        message: "Email não encontrado",
      });
    }

    res.send({
      success: true,
      message: "Senha redefinida com sucesso!",
    });
  });
});

/* Buscar dados do usuário logado */
app.get("/user-data", (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).send({
      success: false,
      message: "Email é obrigatório",
    });
  }

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("Erro ao buscar dados do usuário:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao buscar dados do usuário",
      });
    }

    if (results.length === 0) {
      return res.status(404).send({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    res.send({
      success: true,
      user: results[0],
    });
  });
});

/* Rotas de Gerenciamento de Tarefas */

// Criar tarefa
app.post("/tarefas", async (req, res) => {
  const { nome, intervalo_dias } = req.body;
  console.log("Recebido request para criar tarefa:", req.body);

  try {
    // Buscar o primeiro usuário disponível na ordem
    const usuariosDisponiveis = await new Promise((resolve, reject) => {
      const sqlUsuarios = `
        SELECT id
        FROM users
        WHERE em_viagem = FALSE
        ORDER BY ordem ASC
        LIMIT 1
      `;

      db.query(sqlUsuarios, (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (usuariosDisponiveis.length === 0) {
      return res.status(400).send({
        success: false,
        message: "Não há usuários disponíveis para atribuir a tarefa",
      });
    }

    const responsavelId = usuariosDisponiveis[0].id;
    console.log(`Atribuindo tarefa ao responsável ID ${responsavelId}`);

    // Calcular a próxima execução (hoje + intervalo_dias)
    const proximaExecucao = new Date();
    proximaExecucao.setDate(
      proximaExecucao.getDate() + parseInt(intervalo_dias)
    );
    const dataFormatada = proximaExecucao.toISOString().split("T")[0];

    const sql =
      "INSERT INTO tarefas (nome, intervalo_dias, esta_pausada, responsavel_id, proxima_execucao) VALUES (?, ?, false, ?, ?)";

    db.query(
      sql,
      [nome, intervalo_dias, responsavelId, dataFormatada],
      (err, result) => {
        if (err) {
          console.error("Erro ao criar tarefa:", err);
          return res.status(500).send({
            success: false,
            message: "Erro ao criar tarefa",
            error: err.message,
          });
        }

        console.log("Tarefa criada com sucesso:", result);
        res.status(201).send({
          success: true,
          message: "Tarefa criada com sucesso!",
          taskId: result.insertId,
          responsavelId: responsavelId,
        });
      }
    );
  } catch (error) {
    console.error("Erro ao processar criação de tarefa:", error);
    res.status(500).send({
      success: false,
      message: "Erro ao processar criação de tarefa",
      error: error.message,
    });
  }
});

// Listar todas as tarefas
app.get("/tarefas", (req, res) => {
  const sql = `
    SELECT t.*,
    EXISTS(
      SELECT 1 FROM feriados f
      WHERE f.tarefa_id = t.id
      AND f.data = CURDATE()
    ) as tem_feriado_hoje
    FROM tarefas t
    ORDER BY t.nome
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar tarefas:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao buscar tarefas",
        error: err.message,
      });
    }

    res.send({
      success: true,
      tarefas: results,
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
      message: "Intervalo de dias deve ser maior que zero",
    });
  }

  const sql = "UPDATE tarefas SET intervalo_dias = ? WHERE id = ?";

  db.query(sql, [intervalo_dias, id], (err, result) => {
    if (err) {
      console.error("Erro ao atualizar intervalo da tarefa:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao atualizar intervalo da tarefa",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({
        success: false,
        message: "Tarefa não encontrada",
      });
    }

    res.send({
      success: true,
      message: "Intervalo da tarefa atualizado com sucesso!",
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
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({
        success: false,
        message: "Tarefa não encontrada",
      });
    }

    const status = esta_pausada ? "pausada" : "retomada";
    res.send({
      success: true,
      message: `Tarefa ${status} com sucesso!`,
    });
  });
});

// Rota para deletar tarefa
app.delete("/tarefas/:id", (req, res) => {
  const { id } = req.params;

  // Usar transação para garantir que todas as operações sejam executadas
  db.beginTransaction((err) => {
    if (err) {
      console.error("Erro ao iniciar transação:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao iniciar transação",
        error: err.message,
      });
    }

    // Primeiro, deletar as execuções
    db.query(
      "DELETE FROM execucoes_tarefas WHERE tarefa_id = ?",
      [id],
      (err) => {
        if (err) {
          return db.rollback(() => {
            console.error("Erro ao deletar execuções:", err);
            res.status(500).send({
              success: false,
              message: "Erro ao deletar execuções",
              error: err.message,
            });
          });
        }

        // Depois, deletar os feriados
        db.query("DELETE FROM feriados WHERE tarefa_id = ?", [id], (err) => {
          if (err) {
            return db.rollback(() => {
              console.error("Erro ao deletar feriados:", err);
              res.status(500).send({
                success: false,
                message: "Erro ao deletar feriados",
                error: err.message,
              });
            });
          }

          // Por fim, deletar a tarefa
          db.query("DELETE FROM tarefas WHERE id = ?", [id], (err, result) => {
            if (err) {
              return db.rollback(() => {
                console.error("Erro ao deletar tarefa:", err);
                res.status(500).send({
                  success: false,
                  message: "Erro ao deletar tarefa",
                  error: err.message,
                });
              });
            }

            // Commit da transação
            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  console.error("Erro ao finalizar transação:", err);
                  res.status(500).send({
                    success: false,
                    message: "Erro ao finalizar transação",
                    error: err.message,
                  });
                });
              }

              res.status(200).send({
                success: true,
                message: "Tarefa excluída com sucesso!",
              });
            });
          });
        });
      }
    );
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
        error: err.message,
      });
    }

    if (tarefas.length === 0) {
      return res.send({
        success: true,
        message: "Nenhuma tarefa precisa de atualização",
      });
    }

    // Para cada tarefa, encontra o próximo responsável elegível
    const processarTarefas = tarefas.map((tarefa) => {
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
                atualizarResponsavel(
                  tarefa.id,
                  novoResponsavel,
                  resolve,
                  reject
                );
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
          message: "Responsáveis atualizados com sucesso",
        });
      })
      .catch((err) => {
        console.error("Erro ao atualizar responsáveis:", err);
        res.status(500).send({
          success: false,
          message: "Erro ao atualizar responsáveis",
          error: err.message,
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

// Buscar tarefas com agendamento
app.get("/tarefas/agendamento", (req, res) => {
  console.log("Iniciando busca de tarefas com agendamento");

  // Query simplificada para teste
  const sql = `
    SELECT
      t.*,
      CASE
        WHEN t.esta_pausada THEN 'pausada'
        WHEN CURDATE() >= COALESCE(t.proxima_execucao, CURDATE()) THEN 'pendente'
        ELSE 'em_dia'
      END as status
    FROM tarefas t
    ORDER BY t.nome`;

  console.log("SQL Query:", sql);

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro na consulta SQL:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao buscar tarefas",
        error: err.message,
      });
    }

    console.log("Tarefas encontradas:", results.length);
    res.send({
      success: true,
      tarefas: results,
    });
  });
});

// Função para encontrar o próximo responsável disponível
const encontrarProximoResponsavel = (tarefaId, responsavelAtualId) => {
  return new Promise((resolve, reject) => {
    // Buscar o ID do usuário que executou a tarefa (o usuário atual)
    const sqlExecutor = `
      SELECT responsavel_id
      FROM execucoes_tarefas
      WHERE tarefa_id = ?
      ORDER BY data_execucao DESC
      LIMIT 1
    `;

    db.query(sqlExecutor, [tarefaId], (err, ultimaExecucao) => {
      if (err) {
        console.error("Erro ao buscar última execução:", err);
        return reject(err);
      }

      // ID do usuário que acabou de executar a tarefa (pode ser diferente do responsável atual)
      const executorId =
        ultimaExecucao.length > 0 ? ultimaExecucao[0].responsavel_id : null;
      console.log(
        `Último executor da tarefa ${tarefaId}: ${executorId || "Nenhum"}`
      );

      // Buscar todos os usuários ordenados por ordem
      const sqlTodosUsuarios = `
        SELECT id, name, ordem, em_viagem
        FROM users
        ORDER BY ordem ASC
      `;

      db.query(sqlTodosUsuarios, (err, todosUsuarios) => {
        if (err) {
          console.error("Erro ao buscar todos os usuários:", err);
          return reject(err);
        }

        if (todosUsuarios.length === 0) {
          console.log("Nenhum usuário encontrado");
          return resolve(null);
        }

        console.log(
          "Todos os usuários:",
          todosUsuarios.map(
            (u) =>
              `${u.id}: ${u.name} (ordem: ${u.ordem}, em_viagem: ${u.em_viagem})`
          )
        );

        // Filtrar apenas usuários disponíveis (não em viagem)
        // E que não sejam o usuário que acabou de executar a tarefa
        const usuariosDisponiveis = todosUsuarios.filter(
          (u) => !u.em_viagem && (executorId === null || u.id !== executorId)
        );

        if (usuariosDisponiveis.length === 0) {
          console.log("Nenhum usuário disponível encontrado");
          // Se não houver usuários disponíveis, retornar qualquer usuário não em viagem
          const qualquerDisponivel = todosUsuarios.find((u) => !u.em_viagem);
          return resolve(qualquerDisponivel ? qualquerDisponivel.id : null);
        }

        console.log(
          "Usuários disponíveis:",
          usuariosDisponiveis.map(
            (u) => `${u.id}: ${u.name} (ordem: ${u.ordem})`
          )
        );

        // Ordenar os usuários disponíveis por ordem
        usuariosDisponiveis.sort((a, b) => a.ordem - b.ordem);

        // Encontrar o índice do responsável atual na lista ordenada
        const indiceAtual = todosUsuarios.findIndex(
          (u) => u.id === responsavelAtualId
        );

        if (indiceAtual === -1) {
          console.log(
            `Responsável atual (ID ${responsavelAtualId}) não encontrado na lista`
          );
          // Se o responsável atual não for encontrado, pegar o primeiro disponível
          return resolve(usuariosDisponiveis[0].id);
        }

        // Encontrar o próximo usuário na ordem circular
        let proximoIndice = indiceAtual;
        let proximoUsuario = null;

        // Procurar o próximo usuário disponível na ordem circular
        do {
          proximoIndice = (proximoIndice + 1) % todosUsuarios.length;
          const candidato = todosUsuarios[proximoIndice];

          // Verificar se o candidato está disponível e não é o executor
          if (
            !candidato.em_viagem &&
            (executorId === null || candidato.id !== executorId)
          ) {
            proximoUsuario = candidato;
            break;
          }

          // Evitar loop infinito se voltarmos ao índice inicial
          if (proximoIndice === indiceAtual) {
            break;
          }
        } while (true);

        // Se não encontrou ninguém na busca circular, pegar o primeiro disponível
        if (!proximoUsuario) {
          proximoUsuario = usuariosDisponiveis[0];
        }

        console.log(
          `Selecionando o próximo usuário: ${proximoUsuario.id}: ${proximoUsuario.name} (ordem: ${proximoUsuario.ordem})`
        );
        return resolve(proximoUsuario.id);
      });
    });
  });
};

// Registrar execução de tarefa
app.post("/tarefas/:id/executar", async (req, res) => {
  const { id } = req.params;
  const { usuario_id, data_execucao, tipo = "manual" } = req.body;

  try {
    // Inicia a transação
    await new Promise((resolve, reject) => {
      db.beginTransaction((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Verifica se a tarefa está pausada e obtém informações
    const tarefaInfo = await new Promise((resolve, reject) => {
      db.query(
        "SELECT esta_pausada, intervalo_dias, responsavel_id FROM tarefas WHERE id = ?",
        [id],
        (err, results) => {
          if (err) reject(err);
          else resolve(results[0]);
        }
      );
    });

    if (!tarefaInfo) {
      await new Promise((resolve, reject) => {
        db.rollback(() => resolve());
      });
      return res.status(404).send({
        success: false,
        message: "Tarefa não encontrada",
      });
    }

    if (tarefaInfo.esta_pausada) {
      await new Promise((resolve, reject) => {
        db.rollback(() => resolve());
      });
      return res.status(400).send({
        success: false,
        message: "Não é possível executar uma tarefa pausada",
      });
    }

    const intervalo_dias = tarefaInfo.intervalo_dias;
    const data_exec = data_execucao || new Date().toISOString().split("T")[0];

    // Encontrar o próximo responsável
    const proximoResponsavelId = await encontrarProximoResponsavel(
      id,
      tarefaInfo.responsavel_id
    );

    if (!proximoResponsavelId) {
      await new Promise((resolve, reject) => {
        db.rollback(() => resolve());
      });
      return res.status(500).send({
        success: false,
        message: "Não foi possível encontrar um próximo responsável",
      });
    }

    console.log(
      `Passando tarefa ${id} do responsável ${tarefaInfo.responsavel_id} para ${proximoResponsavelId}`
    );

    // Registra a execução
    const resultExecucao = await new Promise((resolve, reject) => {
      const sqlInsert = `
        INSERT INTO execucoes_tarefas
        (tarefa_id, responsavel_id, data_execucao, tipo)
        VALUES (?, ?, ?, ?)
      `;

      db.query(sqlInsert, [id, usuario_id, data_exec, tipo], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // Atualiza a próxima_execucao, ultima_execucao e o novo responsável
    await new Promise((resolve, reject) => {
      db.query(
        "UPDATE tarefas SET proxima_execucao = DATE_ADD(?, INTERVAL ? DAY), ultima_execucao = ?, responsavel_id = ? WHERE id = ?",
        [data_exec, intervalo_dias, data_exec, proximoResponsavelId, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Commit da transação
    await new Promise((resolve, reject) => {
      db.commit((err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.status(201).send({
      success: true,
      message:
        "Execução registrada com sucesso e tarefa atribuída ao próximo responsável!",
      execucaoId: resultExecucao.insertId,
      novoResponsavelId: proximoResponsavelId,
    });
  } catch (error) {
    console.error("Erro ao processar execução de tarefa:", error);

    // Rollback em caso de erro
    try {
      await new Promise((resolve) => {
        db.rollback(() => resolve());
      });
    } catch (rollbackError) {
      console.error("Erro ao fazer rollback:", rollbackError);
    }

    res.status(500).send({
      success: false,
      message: "Erro ao processar execução de tarefa",
      error: error.message,
    });
  }
});

// Histórico de execuções de uma tarefa
app.get("/tarefas/:id/historico", (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT e.*, u.name as responsavel
    FROM execucoes_tarefas e
    JOIN users u ON e.responsavel_id = u.id
    WHERE e.tarefa_id = ?
    ORDER BY e.data_execucao DESC
    LIMIT 10`;

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar histórico:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao buscar histórico de execuções",
        error: err.message,
      });
    }

    // Formatar as datas
    const historico = results.map((execucao) => ({
      ...execucao,
      data_execucao: new Date(execucao.data_execucao)
        .toISOString()
        .split("T")[0],
    }));

    res.send({
      success: true,
      historico: historico,
    });
  });
});

/* Rotas de Gerenciamento de Pessoas */

// Listar pessoas com suas posições
app.get("/pessoas/ordem", (req, res) => {
  const sql = `SELECT u.* FROM users u ORDER BY u.ordem ASC`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar ordem das pessoas:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao buscar ordem das pessoas",
        error: err.message,
      });
    }

    res.send({
      success: true,
      pessoas: results,
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
        error: err.message,
      });
    }

    res.send({
      success: true,
      message: "Ordem das pessoas inicializada com sucesso!",
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
      message: "Nova posição inválida",
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
          error: err.message,
        });
      }

      if (results.length === 0) {
        // Se não tem posição, insere
        const insertSql =
          "INSERT INTO ordem_pessoas (usuario_id, posicao) VALUES (?, ?)";
        db.query(insertSql, [id, nova_posicao], handleResponse);
      } else {
        // Se já tem posição, atualiza
        const updateSql =
          "UPDATE ordem_pessoas SET posicao = ? WHERE usuario_id = ?";
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
        error: err.message,
      });
    }

    res.send({
      success: true,
      message: "Posição atualizada com sucesso!",
    });
  }
});

// Mover pessoa para cima ou para baixo na lista
app.post("/pessoas/ordem/:id/mover", (req, res) => {
  const { id } = req.params;
  const { direcao } = req.body; // 'cima' ou 'baixo'

  if (!["cima", "baixo"].includes(direcao)) {
    return res.status(400).send({
      success: false,
      message: "Direção inválida",
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
          error: err.message,
        });
      }

      if (results.length === 0) {
        return res.status(404).send({
          success: false,
          message: "Pessoa não encontrada na ordem",
        });
      }

      const posicaoAtual = results[0].posicao;
      const novaPosicao =
        direcao === "cima" ? posicaoAtual - 1 : posicaoAtual + 1;

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
              error: err.message,
            });
          }

          if (results.length === 0) {
            return res.status(400).send({
              success: false,
              message: "Não é possível mover para esta posição",
            });
          }

          const outroUsuarioId = results[0].usuario_id;

          // Troca as posições
          db.beginTransaction((err) => {
            if (err) {
              console.error("Erro ao iniciar transação:", err);
              return res.status(500).send({
                success: false,
                message: "Erro ao iniciar transação",
                error: err.message,
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
                      error: err.message,
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
                          error: err.message,
                        });
                      });
                    }

                    db.commit((err) => {
                      if (err) {
                        return db.rollback(() => {
                          res.status(500).send({
                            success: false,
                            message: "Erro ao finalizar transação",
                            error: err.message,
                          });
                        });
                      }

                      res.send({
                        success: true,
                        message: "Posição atualizada com sucesso!",
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

// Função para redistribuir as tarefas de um usuário
const redistribuirTarefasDoUsuario = (usuarioId) => {
  return new Promise((resolve, reject) => {
    // Buscar todas as tarefas do usuário
    const sqlBuscarTarefas = `
      SELECT id FROM tarefas
      WHERE responsavel_id = ?
      AND esta_pausada = FALSE
    `;

    db.query(sqlBuscarTarefas, [usuarioId], (err, tarefas) => {
      if (err) {
        console.error("Erro ao buscar tarefas do usuário:", err);
        return reject(err);
      }

      if (tarefas.length === 0) {
        // Nenhuma tarefa para redistribuir
        console.log(`Nenhuma tarefa encontrada para o usuário ${usuarioId}`);
        return resolve();
      }

      // Buscar todos os usuários ordenados por ordem
      const sqlTodosUsuarios = `
        SELECT id, name, ordem, em_viagem
        FROM users
        ORDER BY ordem ASC
      `;

      db.query(sqlTodosUsuarios, (err, todosUsuarios) => {
        if (err) {
          console.error("Erro ao buscar todos os usuários:", err);
          return reject(err);
        }

        if (todosUsuarios.length === 0) {
          console.log("Nenhum usuário encontrado");
          return resolve();
        }

        // Filtrar apenas usuários disponíveis (não em viagem)
        const usuariosDisponiveis = todosUsuarios.filter(
          (u) => !u.em_viagem && u.id !== usuarioId
        );

        if (usuariosDisponiveis.length === 0) {
          console.log("Nenhum usuário disponível para receber tarefas");
          return resolve();
        }

        // Ordenar os usuários disponíveis por ordem
        usuariosDisponiveis.sort((a, b) => a.ordem - b.ordem);

        // Encontrar o índice do usuário atual na lista completa
        const indiceAtual = todosUsuarios.findIndex((u) => u.id === usuarioId);

        if (indiceAtual === -1) {
          console.log(`Usuário ${usuarioId} não encontrado na lista`);
          // Se o usuário não for encontrado, usar o primeiro disponível
          const novoResponsavelId = usuariosDisponiveis[0].id;
          redistribuirParaNovoResponsavel(
            tarefas,
            novoResponsavelId,
            resolve,
            reject
          );
          return;
        }

        // Encontrar o próximo usuário na ordem circular
        let proximoIndice = indiceAtual;
        let proximoUsuario = null;

        // Procurar o próximo usuário disponível na ordem circular
        do {
          proximoIndice = (proximoIndice + 1) % todosUsuarios.length;
          const candidato = todosUsuarios[proximoIndice];

          // Verificar se o candidato está disponível e não é o usuário atual
          if (!candidato.em_viagem && candidato.id !== usuarioId) {
            proximoUsuario = candidato;
            break;
          }

          // Evitar loop infinito se voltarmos ao índice inicial
          if (proximoIndice === indiceAtual) {
            break;
          }
        } while (true);

        // Se não encontrou ninguém na busca circular, pegar o primeiro disponível
        if (!proximoUsuario && usuariosDisponiveis.length > 0) {
          proximoUsuario = usuariosDisponiveis[0];
        }

        if (!proximoUsuario) {
          console.log("Não foi possível encontrar um novo responsável");
          return resolve();
        }

        console.log(
          `Redistribuindo tarefas de ${usuarioId} para ${proximoUsuario.id} (${proximoUsuario.name})`
        );
        redistribuirParaNovoResponsavel(
          tarefas,
          proximoUsuario.id,
          resolve,
          reject
        );
      });
    });
  });
};

// Função auxiliar para atualizar as tarefas para o novo responsável
const redistribuirParaNovoResponsavel = (
  tarefas,
  novoResponsavelId,
  resolve,
  reject
) => {
  // Atualizar todas as tarefas para o novo responsável
  const atualizacoes = tarefas.map((tarefa) => {
    return new Promise((resolveUpdate, rejectUpdate) => {
      db.query(
        "UPDATE tarefas SET responsavel_id = ? WHERE id = ?",
        [novoResponsavelId, tarefa.id],
        (err) => {
          if (err) {
            console.error(`Erro ao atualizar tarefa ${tarefa.id}:`, err);
            rejectUpdate(err);
          } else {
            resolveUpdate();
          }
        }
      );
    });
  });

  Promise.all(atualizacoes)
    .then(() => {
      console.log(`${tarefas.length} tarefas redistribuídas com sucesso`);
      resolve();
    })
    .catch((err) => {
      console.error("Erro ao redistribuir tarefas:", err);
      reject(err);
    });
};

// Registrar início de viagem
app.post("/viagens/iniciar", async (req, res) => {
  const { usuario_id, data_saida } = req.body;

  if (!usuario_id || !data_saida) {
    return res.status(400).send({
      success: false,
      message: "ID do usuário e data de saída são obrigatórios",
    });
  }

  // Verifica se o usuário já está em viagem
  try {
    const results = await new Promise((resolve, reject) => {
      db.query(
        "SELECT em_viagem FROM users WHERE id = ?",
        [usuario_id],
        (err, results) => {
          if (err) reject(err);
          else resolve(results);
        }
      );
    });

    if (results.length === 0) {
      return res.status(404).send({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    if (results[0].em_viagem) {
      return res.status(400).send({
        success: false,
        message: "Usuário já está em viagem",
      });
    }

    // Inicia a transação
    db.beginTransaction(async (err) => {
      if (err) {
        console.error("Erro na transação:", err);
        return res.status(500).send({
          success: false,
          message: "Erro ao iniciar transação",
          error: err.message,
        });
      }

      try {
        // Primeiro registra a viagem
        const result = await new Promise((resolve, reject) => {
          db.query(
            "INSERT INTO viagens (usuario_id, data_saida) VALUES (?, ?)",
            [usuario_id, data_saida],
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
        });

        // Depois atualiza o status do usuário
        await new Promise((resolve, reject) => {
          db.query(
            "UPDATE users SET em_viagem = TRUE WHERE id = ?",
            [usuario_id],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        // Redistribuir as tarefas do usuário
        await redistribuirTarefasDoUsuario(usuario_id);

        // Commit da transação
        await new Promise((resolve, reject) => {
          db.commit((err) => {
            if (err) reject(err);
            else resolve();
          });
        });

        res.send({
          success: true,
          message: "Viagem registrada com sucesso e tarefas redistribuídas!",
          viagem_id: result.insertId,
        });
      } catch (error) {
        return db.rollback(() => {
          console.error("Erro ao processar viagem:", error);
          res.status(500).send({
            success: false,
            message: "Erro ao processar viagem",
            error: error.message,
          });
        });
      }
    });
  } catch (error) {
    console.error("Erro ao verificar status de viagem:", error);
    return res.status(500).send({
      success: false,
      message: "Erro ao verificar status de viagem",
      error: error.message,
    });
  }
});

// Registrar retorno de viagem
app.post("/viagens/:id/retorno", (req, res) => {
  const { id } = req.params;
  const { data_retorno } = req.body;

  console.log("Rota /viagens/:id/retorno - Recebido:", {
    id,
    data_retorno,
    body: req.body,
  });

  if (!id || !data_retorno) {
    console.log("Dados inválidos:", { id, data_retorno });
    return res.status(400).send({
      success: false,
      message: "ID da viagem e data de retorno são obrigatórios",
    });
  }

  // Primeiro verificar se a viagem existe e não tem data de retorno
  console.log("Verificando viagem:", id);
  db.query(
    "SELECT id, usuario_id, data_saida, data_retorno FROM viagens WHERE id = ?",
    [id],
    (err, results) => {
      if (err) {
        console.error("Erro na consulta:", err);
        return res.status(500).send({
          success: false,
          message: "Erro ao buscar dados da viagem",
          error: err.message,
        });
      }

      console.log("Resultado da consulta:", results);

      if (results.length === 0) {
        console.log("Viagem não encontrada:", id);
        return res.status(404).send({
          success: false,
          message: "Viagem não encontrada",
        });
      }

      const viagem = results[0];

      // Verificar se a viagem já tem data de retorno
      if (viagem.data_retorno) {
        console.log("Viagem já tem data de retorno:", viagem.data_retorno);
        return res.status(400).send({
          success: false,
          message: "Esta viagem já tem uma data de retorno registrada",
        });
      }

      const { usuario_id, data_saida } = viagem;
      // Converter as datas para objetos Date
      let dias_fora = 0;
      try {
        const dataSaida = new Date(data_saida);
        const dataRetorno = new Date(data_retorno);

        console.log("Datas para cálculo:", {
          data_saida: data_saida,
          data_saida_obj: dataSaida,
          data_retorno: data_retorno,
          data_retorno_obj: dataRetorno,
        });

        // Verificar se as datas são válidas
        if (isNaN(dataSaida.getTime()) || isNaN(dataRetorno.getTime())) {
          console.error("Datas inválidas:", { dataSaida, dataRetorno });
          return res.status(400).send({
            success: false,
            message: "Data de saída ou retorno inválida",
          });
        }

        // Calcular a diferença em dias
        const diffTime = Math.abs(dataRetorno - dataSaida);
        dias_fora = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        console.log("Calculado dias fora:", {
          data_saida,
          data_retorno,
          diffTime,
          dias_fora,
        });
      } catch (error) {
        console.error("Erro ao calcular dias fora:", error);
        return res.status(500).send({
          success: false,
          message: "Erro ao calcular dias fora",
          error: error.message,
        });
      }

      db.beginTransaction((err) => {
        if (err) {
          console.error("Erro na transação:", err);
          return res.status(500).send({
            success: false,
            message: "Erro ao iniciar transação",
            error: err.message,
          });
        }

        // Atualiza o registro da viagem
        console.log("Atualizando viagem com:", {
          id,
          data_retorno,
          dias_fora: dias_fora,
        });

        db.query(
          "UPDATE viagens SET data_retorno = ?, dias_fora = ? WHERE id = ?",
          [data_retorno, dias_fora, id],
          (err) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).send({
                  success: false,
                  message: "Erro ao registrar retorno",
                  error: err.message,
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
                      error: err.message,
                    });
                  });
                }

                db.commit((err) => {
                  if (err) {
                    return db.rollback(() => {
                      res.status(500).send({
                        success: false,
                        message: "Erro ao finalizar transação",
                        error: err.message,
                      });
                    });
                  }

                  res.send({
                    success: true,
                    message: "Retorno registrado com sucesso!",
                    dias_fora: dias_fora,
                  });
                });
              }
            );
          }
        );
      });
    }
  );
}); // Registrar retorno de viagem

// Buscar viagem atual de um usuário
app.get("/viagens/atual/:usuario_id", (req, res) => {
  const { usuario_id } = req.params;

  const sql = `
    SELECT v.id
    FROM viagens v
    WHERE v.usuario_id = ?
    AND v.data_retorno IS NULL
    ORDER BY v.data_saida DESC
    LIMIT 1`;

  db.query(sql, [usuario_id], (err, results) => {
    if (err) {
      console.error("Erro ao buscar viagem atual:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao buscar viagem atual",
        error: err.message,
      });
    }

    if (results.length === 0) {
      return res.status(404).send({
        success: false,
        message: "Nenhuma viagem em andamento encontrada",
      });
    }

    res.send({
      success: true,
      viagem_id: results[0].id,
    });
  });
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
        error: err.message,
      });
    }

    res.send({
      success: true,
      viagens: results.map((viagem) => ({
        ...viagem,
        data_saida: new Date(viagem.data_saida).toISOString().split("T")[0],
        data_retorno: viagem.data_retorno
          ? new Date(viagem.data_retorno).toISOString().split("T")[0]
          : null,
      })),
    });
  });
});

/* Rotas de Tarefas do Usuário */

// Buscar tarefas do usuário
app.get("/tarefas/usuario/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Verifica se o usuário está em viagem
    const emViagem = await new Promise((resolve, reject) => {
      db.query(
        "SELECT em_viagem FROM users WHERE id = ?",
        [id],
        (err, results) => {
          if (err) reject(err);
          else resolve(results[0]?.em_viagem || false);
        }
      );
    });

    // Se estiver em viagem, retorna sem tarefas
    if (emViagem) {
      return res.send({
        success: true,
        em_viagem: true,
        tarefas_hoje: [],
        historico: [],
      });
    }

    // Busca tarefas para hoje
    const tarefasHoje = await new Promise((resolve, reject) => {
      const sql = `
        SELECT
          t.id,
          t.nome,
          t.intervalo_dias,
          t.proxima_execucao
        FROM tarefas t
        WHERE t.responsavel_id = ?
        AND t.esta_pausada = FALSE
        ORDER BY t.nome
      `;

      console.log(`Buscando tarefas para o usuário ID ${id}`);
      db.query(sql, [id], (err, results) => {
        if (err) {
          console.error("Erro ao buscar tarefas do usuário:", err);
          reject(err);
        } else {
          console.log(
            `Encontradas ${results.length} tarefas para o usuário ID ${id}`
          );
          results.forEach((t) => console.log(`- ${t.id}: ${t.nome}`));
          resolve(results);
        }
      });
    });

    // Busca histórico dos últimos 7 dias
    const historico = await new Promise((resolve, reject) => {
      const sql = `
        SELECT
          DATE_FORMAT(e.data_execucao, '%d/%m/%Y') as data,
          GROUP_CONCAT(t.nome ORDER BY t.nome SEPARATOR ', ') as tarefas
        FROM execucoes_tarefas e
        JOIN tarefas t ON e.tarefa_id = t.id
        WHERE e.responsavel_id = ?
        AND e.data_execucao >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY e.data_execucao
        ORDER BY e.data_execucao DESC
      `;

      db.query(sql, [id], (err, results) => {
        if (err) {
          console.error("Erro na query de histórico:", err);
          reject(err);
        } else {
          resolve(results);
        }
      });
    });

    res.send({
      success: true,
      em_viagem: false,
      tarefas_hoje: tarefasHoje,
      historico: historico,
    });
  } catch (error) {
    console.error("Erro ao buscar tarefas do usuário:", error);
    res.status(500).send({
      success: false,
      message: "Erro ao buscar tarefas do usuário",
      error: error.message,
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
      pessoas: results,
    });
  });
});

// Função para atualizar responsáveis das tarefas baseado na ordem dos usuários
const atualizarResponsaveisPorOrdem = async () => {
  return new Promise((resolve, reject) => {
    // Primeiro, pega todas as tarefas que precisam de atualização
    const sqlTarefas = `
      SELECT t.id, t.nome
      FROM tarefas t
      WHERE t.esta_pausada = FALSE
      ORDER BY t.id
    `;

    db.query(sqlTarefas, (err, tarefas) => {
      if (err) {
        console.error("Erro ao buscar tarefas:", err);
        return reject(err);
      }

      if (tarefas.length === 0) {
        return resolve();
      }

      // Busca usuários disponíveis ordenados
      const sqlUsuarios = `
        SELECT id
        FROM users
        WHERE em_viagem = FALSE
        ORDER BY ordem ASC
      `;

      db.query(sqlUsuarios, (err, usuarios) => {
        if (err) {
          console.error("Erro ao buscar usuários:", err);
          return reject(err);
        }

        if (usuarios.length === 0) {
          return resolve();
        }

        // Distribui as tarefas entre os usuários de forma circular
        const atualizacoes = tarefas.map((tarefa, index) => {
          const usuarioIndex = index % usuarios.length;
          const usuarioId = usuarios[usuarioIndex].id;

          return new Promise((resolveUpdate, rejectUpdate) => {
            db.query(
              "UPDATE tarefas SET responsavel_id = ? WHERE id = ?",
              [usuarioId, tarefa.id],
              (err) => {
                if (err) rejectUpdate(err);
                else resolveUpdate();
              }
            );
          });
        });

        Promise.all(atualizacoes)
          .then(() => resolve())
          .catch((err) => reject(err));
      });
    });
  });
};

app.post("/pessoas/reordenar", (req, res) => {
  const { ordem } = req.body;

  if (!ordem || !Array.isArray(ordem)) {
    res.status(400).send({
      success: false,
      message: "Ordem inválida",
    });
    return;
  }

  // Inicia uma transação para garantir consistência
  db.beginTransaction(async (err) => {
    if (err) {
      console.error("Erro ao iniciar transação:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao iniciar atualização da ordem",
        error: err.message,
      });
    }

    try {
      // Atualiza a ordem de cada pessoa
      await Promise.all(
        ordem.map((id, index) => {
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
        })
      );

      // Atualiza os responsáveis das tarefas
      await atualizarResponsaveisPorOrdem();

      // Commit da transação
      db.commit((err) => {
        if (err) {
          return db.rollback(() => {
            console.error("Erro ao fazer commit da transação:", err);
            res.status(500).send({
              success: false,
              message: "Erro ao salvar alterações",
              error: err.message,
            });
          });
        }

        res.send({
          success: true,
          message: "Ordem atualizada e responsáveis redistribuídos com sucesso",
        });
      });
    } catch (error) {
      return db.rollback(() => {
        console.error("Erro durante a atualização:", error);
        res.status(500).send({
          success: false,
          message: "Erro ao atualizar ordem",
          error: error.message,
        });
      });
    }
  });
});

/* Rotas para gerenciamento de feriados */
app.post("/feriados", (req, res) => {
  const { data, tarefa_id } = req.body;

  const sql = "INSERT INTO feriados (data, tarefa_id) VALUES (?, ?)";
  db.query(sql, [data, tarefa_id], (err, result) => {
    if (err) {
      console.error("Erro ao cadastrar feriado:", err);
      res.status(500).send({
        success: false,
        message: "Erro ao cadastrar feriado",
        error: err.message,
      });
      return;
    }

    res.send({
      success: true,
      message: "Feriado cadastrado com sucesso!",
    });
  });
});

app.get("/feriados", (req, res) => {
  const sql =
    "SELECT f.*, t.nome as tarefa_nome FROM feriados f LEFT JOIN tarefas t ON f.tarefa_id = t.id ORDER BY f.data";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar feriados:", err);
      res.status(500).send({
        success: false,
        message: "Erro ao buscar feriados",
        error: err.message,
      });
      return;
    }

    res.send({
      success: true,
      feriados: results,
    });
  });
});

app.delete("/feriados/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM feriados WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Erro ao remover feriado:", err);
      res.status(500).send({
        success: false,
        message: "Erro ao remover feriado",
        error: err.message,
      });
      return;
    }

    res.send({
      success: true,
      message: "Feriado removido com sucesso!",
    });
  });
});

// Remover feriado específico de uma tarefa em uma data específica
app.delete("/feriados/:tarefa_id/:data", (req, res) => {
  const { tarefa_id, data } = req.params;

  const sql = "DELETE FROM feriados WHERE tarefa_id = ? AND data = ?";
  db.query(sql, [tarefa_id, data], (err, result) => {
    if (err) {
      console.error("Erro ao remover feriado:", err);
      res.status(500).send({
        success: false,
        message: "Erro ao remover feriado",
        error: err.message,
      });
      return;
    }

    res.send({
      success: true,
      message: "Feriado removido com sucesso!",
    });
  });
});

/* Rota para verificar acúmulo de lixo */
app.post("/tarefas/lixo/status", (req, res) => {
  const { tarefa_id } = req.body;

  // Verifica se é domingo ou feriado
  const hoje = new Date();
  const sql = `
    SELECT COUNT(*) as count
    FROM feriados
    WHERE data = CURDATE()
    AND tarefa_id = ?
  `;

  db.query(sql, [tarefa_id], (err, results) => {
    if (err) {
      res.status(500).send({
        success: false,
        message: "Erro ao verificar status do lixo",
        error: err.message,
      });
      return;
    }

    const ehFeriado = results[0].count > 0;
    const ehDomingo = hoje.getDay() === 0;

    if (ehFeriado || ehDomingo) {
      res.send({
        success: true,
        deve_pular: true,
        motivo: ehDomingo ? "domingo" : "feriado",
      });
    } else {
      res.send({
        success: true,
        deve_pular: false,
      });
    }
  });
});

/* Rota para notificar responsável sobre ajuda */
app.post("/tarefas/lixo/notificar", (req, res) => {
  const { usuario_id, motivo } = req.body;

  // Aqui você implementaria a lógica de notificação
  // Por exemplo, salvando em uma tabela de notificações
  const sql = `
    INSERT INTO notificacoes (usuario_id, mensagem, data_criacao)
    VALUES (?, ?, NOW())
  `;

  const mensagem =
    motivo === "domingo"
      ? "Você quer que outra pessoa te ajude na segunda?"
      : "Quer que outra pessoa tire com você amanhã?";

  db.query(sql, [usuario_id, mensagem], (err, result) => {
    if (err) {
      res.status(500).send({
        success: false,
        message: "Erro ao criar notificação",
        error: err.message,
      });
      return;
    }

    res.send({
      success: true,
      message: "Notificação criada com sucesso!",
      notificacao_id: result.insertId,
    });
  });
});

// Remover feriados de uma tarefa específica
app.delete("/feriados/tarefa/:tarefaId", (req, res) => {
  const { tarefaId } = req.params;

  const sql = "DELETE FROM feriados WHERE tarefa_id = ?";
  db.query(sql, [tarefaId], (err, result) => {
    if (err) {
      console.error("Erro ao remover feriados da tarefa:", err);
      res.status(500).send({
        success: false,
        message: "Erro ao remover feriados da tarefa",
        error: err.message,
      });
      return;
    }

    res.send({
      success: true,
      message: "Feriados removidos com sucesso!",
    });
  });
});

// Remover execuções de uma tarefa específica
app.delete("/execucoes/tarefa/:tarefaId", (req, res) => {
  const { tarefaId } = req.params;

  const sql = "DELETE FROM execucoes_tarefas WHERE tarefa_id = ?";
  db.query(sql, [tarefaId], (err, result) => {
    if (err) {
      console.error("Erro ao remover execuções da tarefa:", err);
      res.status(500).send({
        success: false,
        message: "Erro ao remover execuções da tarefa",
        error: err.message,
      });
      return;
    }

    res.send({
      success: true,
      message: "Execuções removidas com sucesso!",
    });
  });
});

// Rotas para controle de gás - versão simplificada
app.get("/gas/ultima-troca", (req, res) => {
  // Usar DATE_FORMAT para garantir que a data seja retornada no formato DD-MM-YYYY
  const sql =
    "SELECT id, DATE_FORMAT(data, '%d-%m-%Y') as data FROM controle_gas ORDER BY data DESC LIMIT 1";
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Erro ao buscar última troca:", err);
      res.status(500).send({
        success: false,
        message: "Erro ao buscar última troca",
        error: err.message,
      });
      return;
    }
    res.send({
      success: true,
      data: result[0]?.data || null,
      id: result[0]?.id || null,
    });
  });
});

// Endpoint para buscar todas as trocas de gás
app.get("/gas/todas-trocas", (req, res) => {
  console.log("Recebida solicitação para buscar todas as trocas de gás");

  // Usar DATE_FORMAT para garantir que a data seja retornada no formato DD-MM-YYYY
  const sql =
    "SELECT id, DATE_FORMAT(data, '%d-%m-%Y') as data FROM controle_gas ORDER BY data DESC";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar todas as trocas:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao buscar todas as trocas",
        error: err.message,
      });
    }

    console.log(`Encontradas ${results.length} trocas de gás`);

    res.send({
      success: true,
      trocas: results,
    });
  });
});

app.post("/gas/registrar", (req, res) => {
  const { data } = req.body;
  const sql = "INSERT INTO controle_gas (data) VALUES (?)";
  db.query(sql, [data], (err, result) => {
    if (err) {
      console.error("Erro ao registrar troca:", err);
      res.status(500).send({
        success: false,
        message: "Erro ao registrar troca",
        error: err.message,
      });
      return;
    }
    console.log("Troca registrada com sucesso. Data:", data);
    res.send({
      success: true,
      message: "Troca registrada com sucesso",
    });
  });
});

// Endpoint super simples para deletar o último registro de gás
app.get("/gas/deletar-ultimo", (req, res) => {
  console.log("Recebida solicitação para deletar último registro de gás");

  // Executar a exclusão diretamente
  db.query(
    "DELETE FROM controle_gas ORDER BY data DESC LIMIT 1",
    (err, result) => {
      if (err) {
        console.error("Erro ao deletar registro:", err);
        return res.status(500).send({
          success: false,
          message: "Erro ao deletar registro",
          error: err.message,
        });
      }

      console.log("Resultado da exclusão:", result);
      console.log("Linhas afetadas:", result.affectedRows);

      res.send({
        success: true,
        message: "Registro deletado com sucesso",
        affectedRows: result.affectedRows,
      });
    }
  );
});

// Endpoint para deletar um registro específico pelo ID
app.delete("/gas/deletar/:id", (req, res) => {
  const id = req.params.id;
  console.log(
    `Recebida solicitação para deletar registro de gás com ID: ${id}`
  );

  // Verificar se o ID é válido
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).send({
      success: false,
      message: "ID inválido",
    });
  }

  // Executar a exclusão pelo ID
  db.query("DELETE FROM controle_gas WHERE id = ?", [id], (err, result) => {
    if (err) {
      console.error("Erro ao deletar registro:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao deletar registro",
        error: err.message,
      });
    }

    console.log("Resultado da exclusão:", result);
    console.log("Linhas afetadas:", result.affectedRows);

    if (result.affectedRows === 0) {
      return res.status(404).send({
        success: false,
        message: "Registro não encontrado",
      });
    }

    res.send({
      success: true,
      message: "Registro deletado com sucesso",
      affectedRows: result.affectedRows,
    });
  });
});

// Reatribuir tarefa manualmente
app.post("/tarefas/:id/reatribuir", (req, res) => {
  const { id } = req.params;
  const { novo_responsavel_id } = req.body;

  if (!novo_responsavel_id) {
    return res.status(400).send({
      success: false,
      message: "ID do novo responsável é obrigatório",
    });
  }

  // Verifica se o novo responsável existe e não está em viagem
  const sqlVerificaUsuario = `
    SELECT id, em_viagem
    FROM users
    WHERE id = ?
  `;

  db.query(sqlVerificaUsuario, [novo_responsavel_id], (err, usuarios) => {
    if (err) {
      console.error("Erro ao verificar usuário:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao verificar usuário",
        error: err.message,
      });
    }

    if (usuarios.length === 0) {
      return res.status(404).send({
        success: false,
        message: "Usuário não encontrado",
      });
    }

    if (usuarios[0].em_viagem) {
      return res.status(400).send({
        success: false,
        message: "Não é possível atribuir tarefa a um usuário em viagem",
      });
    }

    // Atualiza o responsável da tarefa
    const sqlAtualizaTarefa = `
      UPDATE tarefas
      SET responsavel_id = ?
      WHERE id = ?
    `;

    db.query(sqlAtualizaTarefa, [novo_responsavel_id, id], (err, result) => {
      if (err) {
        console.error("Erro ao reatribuir tarefa:", err);
        return res.status(500).send({
          success: false,
          message: "Erro ao reatribuir tarefa",
          error: err.message,
        });
      }

      if (result.affectedRows === 0) {
        return res.status(404).send({
          success: false,
          message: "Tarefa não encontrada",
        });
      }

      res.send({
        success: true,
        message: "Tarefa reatribuída com sucesso",
      });
    });
  });
});

/* Endpoints para gerenciar notificações */

// Enviar mensagem para departamento (cria uma notificação)
app.post("/notificacoes", (req, res) => {
  const { mensagem, departamento, remetente_id, remetente_nome } = req.body;

  if (!mensagem || !departamento) {
    return res.status(400).send({
      success: false,
      message: "Mensagem e departamento são obrigatórios",
    });
  }

  const sql =
    "INSERT INTO notificacoes (mensagem, departamento, remetente_id, remetente_nome) VALUES (?, ?, ?, ?)";
  db.query(
    sql,
    [mensagem, departamento, remetente_id, remetente_nome],
    (err, result) => {
      if (err) {
        console.error("Erro ao criar notificação:", err);
        return res.status(500).send({
          success: false,
          message: "Erro ao criar notificação",
          error: err.message,
        });
      }

      res.status(201).send({
        success: true,
        message: "Mensagem enviada com sucesso!",
        notificacaoId: result.insertId,
      });
    }
  );
});

// Buscar notificações por departamento
app.get("/notificacoes", (req, res) => {
  const { departamento } = req.query;

  let sql = "SELECT * FROM notificacoes";
  let params = [];

  if (departamento) {
    sql += " WHERE departamento = ?";
    params.push(departamento);
  }

  sql += " ORDER BY data_envio DESC LIMIT 50";

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Erro ao buscar notificações:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao buscar notificações",
        error: err.message,
      });
    }

    res.send(results);
  });
});

// Marcar notificação como lida
app.put("/notificacoes/:id", (req, res) => {
  const { id } = req.params;
  const { lida } = req.body;

  const sql = "UPDATE notificacoes SET lida = ? WHERE id = ?";
  db.query(sql, [lida, id], (err, result) => {
    if (err) {
      console.error("Erro ao atualizar notificação:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao atualizar notificação",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({
        success: false,
        message: "Notificação não encontrada",
      });
    }

    res.send({
      success: true,
      message: "Notificação atualizada com sucesso!",
    });
  });
});

// Excluir notificação
app.delete("/notificacoes/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM notificacoes WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Erro ao excluir notificação:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao excluir notificação",
        error: err.message,
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({
        success: false,
        message: "Notificação não encontrada",
      });
    }

    res.send({
      success: true,
      message: "Notificação excluída com sucesso!",
    });
  });
});

// Endpoint para definir o dia de lavanderia de um usuário
app.post("/dia-lavanderia", (req, res) => {
  const { name, dia_lavanderia } = req.body;
  console.log("Recebida solicitação para definir dia de lavanderia:", {
    name,
    dia_lavanderia,
  });

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

// Endpoint para buscar todos os usuários com seus dias de lavanderia
app.get("/dias-lavanderia", (req, res) => {
  console.log("Recebida solicitação para buscar todos os dias de lavanderia");

  const sql =
    "SELECT id, name, dia_lavanderia FROM users WHERE dia_lavanderia IS NOT NULL ORDER BY name";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar dias de lavanderia:", err);
      return res.status(500).send({
        success: false,
        message: "Erro ao buscar dias de lavanderia",
        error: err.message,
      });
    }

    console.log(
      `Encontrados ${results.length} usuários com dias de lavanderia definidos`
    );

    res.send({
      success: true,
      usuarios: results,
    });
  });
});

app.listen(3001, "0.0.0.0", () => {
  console.log(
    "Servidor rodando na porta 3001 e acessível em todas as interfaces de rede"
  );
  console.log("\nEndereços de acesso:");
  console.log(" - Local: http://localhost:3001");
  console.log(
    " - Rede: http://192.168.1.2:3001 (se este for seu IP na rede)\n"
  );
});
