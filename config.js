// Configuração centralizada para o endereço do servidor
// Altere este endereço para o IP correto da sua máquina na rede local
// ou use 'localhost' se estiver executando no mesmo dispositivo

// Tente diferentes opções de conexão se estiver tendo problemas

// Opção 1: Para dispositivos físicos na mesma rede Wi-Fi, use o IP da máquina que está executando o servidor
export const API_URL = "http://192.168.1.55:3001";

// Opção 2: Para desenvolvimento local, use localhost
// export const API_URL = "http://localhost:3001";

// Opção 3: Para emuladores Android, use 10.0.2.2 (que redireciona para o localhost da máquina host)
// export const API_URL = "http://10.0.2.2:3001";

// Opção 3: Para o iOS Simulator, use localhost
// export const API_URL = 'http://localhost:3001';

// Opção 4: Tente usar o endereço IPv4 da sua máquina
// Para descobrir seu IP, execute 'ipconfig' no Windows ou 'ifconfig' no Mac/Linux
// export const API_URL = 'http://SEU_IP_AQUI:3001';

// Opção 5: Se estiver usando um servidor na nuvem ou hospedado externamente
// export const API_URL = 'https://seu-servidor-na-nuvem.com';

// Configurações adicionais para requisições axios
export const API_CONFIG = {
  timeout: 30000, // 30 segundos (aumentado para dar mais tempo para conexões lentas)
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // Configurações para lidar com problemas de rede
  retry: 3,
  retryDelay: 2000,
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Aceita status codes entre 200 e 499
  },
};
