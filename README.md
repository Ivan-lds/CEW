# 🎉 Casa Estudante CEW 

**Casa Estudante CEW** é uma aplicação desenvolvida para facilitar a gestão e organização de tarefas, departamentos e atividades de uma residência estudantil. Este projeto é voltado para promover um ambiente colaborativo, organizado e eficiente, proporcionando funções que atendem às necessidades de administração de pessoas e suas responsabilidades.

---

## ✨ **Funcionalidades Principais**
- **Cadastro e Login**:
  - Os usuários podem se registrar e fazer login no aplicativo.
  - Validação de credenciais com armazenamento seguro.

- **Gestão de Departamentos**:
  - Atribuir usuários aos departamentos definidos (ex.: Caixa, Secretaria, etc.).

- **Notificações de Aniversários**:
  - Adicionar aniversários dos usuários e enviar notificações na data.

- **Datas Importantes**:
  - Definir datas para eventos como: fechamento de caixa e digitalização de contas.
  - Notificar os responsáveis no dia apropriado.

- **Cronograma de Lavanderia**:
  - Organizar dias da semana para lavagem de roupas.
  - Permitir mais de uma pessoa por dia.

- **Frequência de Tarefas**:
  - Definir de quantos em quantos dias as tarefas serão realizadas.
  - Pausar tarefas em casos de situações como falta d'água.

- **Gerenciamento de Viagens**:
  - Atualizar status de usuários que estão viajando.
  - Reatribuir automaticamente as tarefas durante o período de ausência.

- **Transferência de Administração**:
  - Transferir os privilégios de administração para outro usuário.

---

## 🛠️ **Tecnologias Utilizadas**
- **Frontend**: React Native
- **Backend**: Node.js com Express
- **Banco de Dados**: MySQL
- **Bibliotecas Utilizadas**:
  - Axios
  - AsyncStorage
  - React Navigation
  - Cors e Body-Parser no backend

---

## 🚀 **Como Configurar o Projeto**
### **Pré-Requisitos**
1. Node.js (v16 ou superior).
2. Banco de dados MySQL.
3. Um editor de código como Visual Studio Code.

### **Passos para Configuração**
1. **Clone o Repositório**:
   ```bash
   git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   cd SEU_REPOSITORIO
   ```

2. **Configuração do Backend**:
   - Edite o arquivo `server.js` com as credenciais do seu banco de dados MySQL.
   - Instale as dependências:
     ```bash
     npm install
     ```
   - Inicie o servidor:
     ```bash
     node server.js
     ```

3. **Configuração do Frontend**:
   - Instale as dependências:
     ```bash
     npm install
     ```
   - Inicie o projeto:
     ```bash
     npx expo start
     ```

4. **Banco de Dados**:
   - Certifique-se de criar as tabelas necessárias conforme descrito no código do backend.

---

## 📂 **Estrutura do Projeto**
```plaintext
.
├── backend/
│   ├── server.js         # Código do servidor backend
│   └── package.json      # Dependências do backend
├── frontend/
│   ├── src/
│   │   ├── components/   # Componentes React Native
│   │   └── screens/      # Telas do aplicativo
│   └── App.js            # Arquivo principal do frontend
├── database.sql          # Esquema do banco de dados
└── README.md             # Este arquivo
```

---

## 🛡️ **Contribuições**
Contribuições são bem-vindas! Sinta-se à vontade para abrir uma _issue_ ou criar um _pull request_ com melhorias.

1. **Fork o repositório**.
2. Crie uma nova branch:
   ```bash
   git checkout -b feature/minha-feature
   ```
3. Envie suas alterações:
   ```bash
   git commit -m "Minha contribuição"
   git push origin feature/minha-feature
   ```

---

## 📄 **Licença**
Este projeto está sob a licença MIT. Consulte o arquivo `LICENSE` para mais detalhes.
