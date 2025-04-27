-- Script para criar a tabela de notificações
CREATE TABLE IF NOT EXISTS notificacoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  mensagem TEXT NOT NULL,
  departamento VARCHAR(100) NOT NULL,
  remetente_id INT,
  remetente_nome VARCHAR(100),
  data_envio DATETIME DEFAULT CURRENT_TIMESTAMP,
  lida BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (remetente_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Índices para melhorar a performance
CREATE INDEX idx_notificacoes_departamento ON notificacoes(departamento);
CREATE INDEX idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX idx_notificacoes_data ON notificacoes(data_envio);
