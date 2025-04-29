// Endpoints para o gerenciamento do caixa
// Adicione este código ao seu arquivo Server.js

// Obter saldo do caixa
app.get("/caixa/saldo", (req, res) => {
  const sql = "SELECT saldo_total, saldo_atual FROM caixa_saldo WHERE id = 1";
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar saldo do caixa:", err);
      return res.status(500).json({ success: false, message: "Erro ao buscar saldo do caixa" });
    }
    
    if (results.length === 0) {
      // Se não houver registro, criar um com valores zerados
      const insertSql = "INSERT INTO caixa_saldo (id, saldo_total, saldo_atual) VALUES (1, 0, 0)";
      db.query(insertSql, (insertErr) => {
        if (insertErr) {
          console.error("Erro ao criar registro de saldo:", insertErr);
          return res.status(500).json({ success: false, message: "Erro ao criar registro de saldo" });
        }
        
        return res.json({ success: true, saldo: { saldo_total: 0, saldo_atual: 0 } });
      });
    } else {
      res.json({ success: true, saldo: results[0] });
    }
  });
});

// Obter totais mensais
app.get("/caixa/totais", (req, res) => {
  const sql = "SELECT mes, ano, total_entradas, total_saidas, saldo_mes FROM caixa_totais ORDER BY ano DESC, FIELD(mes, 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro') DESC";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar totais mensais:", err);
      return res.status(500).json({ success: false, message: "Erro ao buscar totais mensais" });
    }
    
    res.json({ success: true, totais: results });
  });
});

// Obter todas as transações
app.get("/caixa/transacoes", (req, res) => {
  const sql = "SELECT * FROM caixa_transacoes ORDER BY data_registro DESC";
  
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Erro ao buscar transações:", err);
      return res.status(500).json({ success: false, message: "Erro ao buscar transações" });
    }
    
    res.json({ success: true, transacoes: results });
  });
});

// Obter transações por mês e ano
app.get("/caixa/transacoes/:mes/:ano", (req, res) => {
  const { mes, ano } = req.params;
  const sql = "SELECT * FROM caixa_transacoes WHERE mes = ? AND ano = ? ORDER BY data_registro DESC";
  
  db.query(sql, [mes, ano], (err, results) => {
    if (err) {
      console.error("Erro ao buscar transações por mês/ano:", err);
      return res.status(500).json({ success: false, message: "Erro ao buscar transações" });
    }
    
    res.json({ success: true, transacoes: results });
  });
});

// Registrar nova transação
app.post("/caixa/transacoes", (req, res) => {
  const { tipo, mes, ano, valor, descricao } = req.body;
  const userId = req.session?.userId || null;
  
  // Validar campos obrigatórios
  if (!tipo || !mes || !ano || !valor || !descricao) {
    return res.status(400).json({ success: false, message: "Todos os campos são obrigatórios" });
  }
  
  // Iniciar transação no banco de dados
  db.beginTransaction(async (err) => {
    if (err) {
      console.error("Erro ao iniciar transação:", err);
      return res.status(500).json({ success: false, message: "Erro ao processar transação" });
    }
    
    try {
      // 1. Inserir a transação
      const insertTransacao = new Promise((resolve, reject) => {
        const sql = "INSERT INTO caixa_transacoes (tipo, mes, ano, valor, descricao, usuario_id) VALUES (?, ?, ?, ?, ?, ?)";
        db.query(sql, [tipo, mes, ano, valor, descricao, userId], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      
      await insertTransacao;
      
      // 2. Atualizar ou criar o total mensal
      const updateTotalMensal = new Promise((resolve, reject) => {
        // Verificar se já existe um registro para este mês/ano
        const checkSql = "SELECT * FROM caixa_totais WHERE mes = ? AND ano = ?";
        db.query(checkSql, [mes, ano], (err, results) => {
          if (err) {
            reject(err);
            return;
          }
          
          if (results.length > 0) {
            // Atualizar registro existente
            let updateSql;
            let updateParams;
            
            if (tipo === "entrada") {
              updateSql = "UPDATE caixa_totais SET total_entradas = total_entradas + ?, saldo_mes = saldo_mes + ? WHERE mes = ? AND ano = ?";
              updateParams = [valor, valor, mes, ano];
            } else {
              updateSql = "UPDATE caixa_totais SET total_saidas = total_saidas + ?, saldo_mes = saldo_mes - ? WHERE mes = ? AND ano = ?";
              updateParams = [valor, valor, mes, ano];
            }
            
            db.query(updateSql, updateParams, (err, result) => {
              if (err) reject(err);
              else resolve(result);
            });
          } else {
            // Criar novo registro
            let total_entradas = 0;
            let total_saidas = 0;
            let saldo_mes = 0;
            
            if (tipo === "entrada") {
              total_entradas = valor;
              saldo_mes = valor;
            } else {
              total_saidas = valor;
              saldo_mes = -valor;
            }
            
            const insertSql = "INSERT INTO caixa_totais (mes, ano, total_entradas, total_saidas, saldo_mes) VALUES (?, ?, ?, ?, ?)";
            db.query(insertSql, [mes, ano, total_entradas, total_saidas, saldo_mes], (err, result) => {
              if (err) reject(err);
              else resolve(result);
            });
          }
        });
      });
      
      await updateTotalMensal;
      
      // 3. Atualizar o saldo total do caixa
      const updateSaldoCaixa = new Promise((resolve, reject) => {
        let updateSql;
        
        if (tipo === "entrada") {
          updateSql = "UPDATE caixa_saldo SET saldo_total = saldo_total + ?, saldo_atual = saldo_atual + ? WHERE id = 1";
        } else {
          updateSql = "UPDATE caixa_saldo SET saldo_total = saldo_total + ?, saldo_atual = saldo_atual - ? WHERE id = 1";
        }
        
        db.query(updateSql, [valor, valor], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      
      await updateSaldoCaixa;
      
      // Commit da transação
      db.commit((err) => {
        if (err) {
          console.error("Erro ao finalizar transação:", err);
          return db.rollback(() => {
            res.status(500).json({ success: false, message: "Erro ao finalizar transação" });
          });
        }
        
        res.json({ success: true, message: "Transação registrada com sucesso" });
      });
    } catch (error) {
      console.error("Erro ao processar transação:", error);
      db.rollback(() => {
        res.status(500).json({ success: false, message: "Erro ao processar transação" });
      });
    }
  });
});

// Excluir transação
app.delete("/caixa/transacoes/:id", (req, res) => {
  const { id } = req.params;
  
  // Iniciar transação no banco de dados
  db.beginTransaction(async (err) => {
    if (err) {
      console.error("Erro ao iniciar transação:", err);
      return res.status(500).json({ success: false, message: "Erro ao processar exclusão" });
    }
    
    try {
      // 1. Obter detalhes da transação
      const getTransacao = new Promise((resolve, reject) => {
        const sql = "SELECT * FROM caixa_transacoes WHERE id = ?";
        db.query(sql, [id], (err, results) => {
          if (err) reject(err);
          else if (results.length === 0) reject(new Error("Transação não encontrada"));
          else resolve(results[0]);
        });
      });
      
      const transacao = await getTransacao;
      const { tipo, mes, ano, valor } = transacao;
      
      // 2. Atualizar o total mensal
      const updateTotalMensal = new Promise((resolve, reject) => {
        let updateSql;
        let updateParams;
        
        if (tipo === "entrada") {
          updateSql = "UPDATE caixa_totais SET total_entradas = total_entradas - ?, saldo_mes = saldo_mes - ? WHERE mes = ? AND ano = ?";
          updateParams = [valor, valor, mes, ano];
        } else {
          updateSql = "UPDATE caixa_totais SET total_saidas = total_saidas - ?, saldo_mes = saldo_mes + ? WHERE mes = ? AND ano = ?";
          updateParams = [valor, valor, mes, ano];
        }
        
        db.query(updateSql, updateParams, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      
      await updateTotalMensal;
      
      // 3. Atualizar o saldo total do caixa
      const updateSaldoCaixa = new Promise((resolve, reject) => {
        let updateSql;
        
        if (tipo === "entrada") {
          updateSql = "UPDATE caixa_saldo SET saldo_total = saldo_total - ?, saldo_atual = saldo_atual - ? WHERE id = 1";
        } else {
          updateSql = "UPDATE caixa_saldo SET saldo_total = saldo_total - ?, saldo_atual = saldo_atual + ? WHERE id = 1";
        }
        
        db.query(updateSql, [valor, valor], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      
      await updateSaldoCaixa;
      
      // 4. Excluir a transação
      const deleteTransacao = new Promise((resolve, reject) => {
        const sql = "DELETE FROM caixa_transacoes WHERE id = ?";
        db.query(sql, [id], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
      
      await deleteTransacao;
      
      // Commit da transação
      db.commit((err) => {
        if (err) {
          console.error("Erro ao finalizar exclusão:", err);
          return db.rollback(() => {
            res.status(500).json({ success: false, message: "Erro ao finalizar exclusão" });
          });
        }
        
        res.json({ success: true, message: "Transação excluída com sucesso" });
      });
    } catch (error) {
      console.error("Erro ao processar exclusão:", error);
      db.rollback(() => {
        res.status(500).json({ success: false, message: error.message || "Erro ao processar exclusão" });
      });
    }
  });
});
