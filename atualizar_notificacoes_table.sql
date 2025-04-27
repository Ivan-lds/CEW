-- Script para atualizar a tabela de notificações existente

-- Verificar se a coluna departamento existe, se não, adicionar
ALTER TABLE notificacoes 
ADD COLUMN IF NOT EXISTS departamento VARCHAR(100) NOT NULL DEFAULT 'Geral';

-- Verificar se a coluna remetente_id existe, se não, adicionar
ALTER TABLE notificacoes 
ADD COLUMN IF NOT EXISTS remetente_id INT,
ADD CONSTRAINT fk_remetente FOREIGN KEY (remetente_id) REFERENCES users(id) ON DELETE SET NULL;

-- Verificar se a coluna remetente_nome existe, se não, adicionar
ALTER TABLE notificacoes 
ADD COLUMN IF NOT EXISTS remetente_nome VARCHAR(100);

-- Verificar se a coluna data_envio existe, se não, adicionar
ALTER TABLE notificacoes 
ADD COLUMN IF NOT EXISTS data_envio DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Verificar se a coluna lida existe, se não, adicionar
ALTER TABLE notificacoes 
ADD COLUMN IF NOT EXISTS lida BOOLEAN DEFAULT FALSE;

-- Criar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_notificacoes_departamento ON notificacoes(departamento);
CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
CREATE INDEX IF NOT EXISTS idx_notificacoes_data ON notificacoes(data_envio);
