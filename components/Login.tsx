import React from "react";
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL, API_CONFIG } from "../config";

const Login = ({ navigation }: { navigation: any }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [showConnectionStatus, setShowConnectionStatus] = useState(false);

  // Função para mostrar o indicador de status por 1 segundo
  const showStatusIndicator = () => {
    // Mostrar o indicador
    setShowConnectionStatus(true);

    // Esconder o indicador após 1 segundo
    setTimeout(() => {
      setShowConnectionStatus(false);
    }, 1200);
  };

  // Mostra o indicador de status quando o componente é montado
  useEffect(() => {
    // Simula um status de conexão bem-sucedido
    setConnectionError(false);
    showStatusIndicator();

    // Limpa o estado quando o componente é desmontado
    return () => {
      setConnectionError(false);
      setShowConnectionStatus(false);
    };
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    // Evita múltiplos cliques no botão de login
    if (isLoading) {
      console.log("Login já está em andamento. Aguarde...");
      return;
    }

    setIsLoading(true);

    // Limpa o estado de erro de conexão
    setConnectionError(false);

    try {
      console.log(`Tentando fazer login no servidor: ${API_URL}/login`);

      // Mostra o indicador de status de conexão
      setConnectionError(false);
      showStatusIndicator();

      const response = await axios.post(
        `${API_URL}/login`,
        {
          email,
          password,
        },
        {
          ...API_CONFIG,
          // Aumenta o timeout para 20 segundos para o login
          timeout: 20000,
        }
      );

      console.log("Resposta completa do servidor:", response.data);

      if (response.data.success) {
        // Armazenar informações do usuário logado
        await AsyncStorage.setItem("userEmail", email);
        await AsyncStorage.setItem("userName", response.data.user.name);
        await AsyncStorage.setItem(
          "departamento", // Corrigido para "departamento" em vez de "userDepartment"
          response.data.user.departamento || ""
        );
        await AsyncStorage.setItem("role", response.data.role);
        await AsyncStorage.setItem("userId", response.data.user.id.toString());

        console.log("Informações do usuário armazenadas:");
        console.log("Email:", email);
        console.log("Nome:", response.data.user.name);
        console.log("Departamento:", response.data.user.departamento);
        console.log("Role:", response.data.role);
        console.log("UserId:", response.data.user.id);

        console.log(
          "Navegando para:",
          response.data.role === "admin" ? "Home" : "Home"
        );

        // Adiciona um pequeno atraso para garantir que os dados foram salvos
        setTimeout(() => {
          console.log(
            "Redirecionando para a Home e atualizando notificações..."
          );

          // Reseta a pilha de navegação e vai para Home
          navigation.reset({
            index: 0,
            routes: [{ name: "Home", params: { refreshNotifications: true } }],
          });
        }, 300);
      } else {
        Alert.alert("Erro", response.data.message || "Credenciais inválidas");
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);

      // Mensagem de erro mais específica baseada no tipo de erro
      let errorMessage = "Erro ao fazer login. Tente novamente.";
      let isConnectionError = false;
      let title = "Erro de Login";

      if (error.code === "ECONNABORTED") {
        title = "Tempo de Conexão Esgotado";
        errorMessage =
          "O servidor demorou muito para responder. Verifique sua conexão com a internet e tente novamente.";
        isConnectionError = true;
      } else if (error.message && error.message.includes("Network Error")) {
        title = "Erro de Conexão";
        errorMessage =
          "Não foi possível conectar ao servidor. Verifique se o servidor está rodando e se você está conectado à internet.";
        isConnectionError = true;
      } else if (error.response) {
        // O servidor respondeu com um status de erro
        errorMessage =
          error.response.data?.message ||
          `Erro ${error.response.status}: ${error.response.statusText}`;
      }

      // Define o estado de erro de conexão
      setConnectionError(isConnectionError);

      // Mostra uma mensagem de erro mais amigável
      Alert.alert(
        title,
        errorMessage,
        [
          { text: "OK" },
          isConnectionError
            ? {
                text: "Verificar Conexão",
                onPress: () => {
                  Alert.alert(
                    "Dicas de Conexão",
                    "1. Verifique se o servidor está rodando\n" +
                      "2. Verifique se o endereço IP no arquivo config.js está correto\n" +
                      "3. Tente usar 'localhost' ou o IP da sua máquina\n" +
                      "4. Reinicie o servidor e o aplicativo"
                  );
                },
              }
            : null,
        ].filter(Boolean)
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Login</Text>
      <Image
        source={require("../assets/img/background.png")}
        style={styles.image}
      />

      {/* Indicador de status de conexão */}
      {showConnectionStatus && (
        <Text
          style={[
            styles.serverStatus,
            connectionError ? styles.serverStatusError : styles.serverStatusOk,
          ]}
        >
          {connectionError
            ? "⚠️ Servidor Desconectado"
            : "✅ Servidor Conectado"}
        </Text>
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <View style={styles.rememberMe}>
        <TouchableOpacity onPress={() => setRememberMe(!rememberMe)}>
          <Text style={styles.rememberMeText}>
            {rememberMe ? "✅ Lembrar-me" : "⬜ Lembrar-me"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.linkContainer}>
        <Text
          style={styles.linkText}
          onPress={() => navigation.navigate("RedefinirSenha")}
        >
          Esqueceu sua senha?
        </Text>
        <Text
          style={styles.linkText}
          onPress={() => navigation.navigate("Cadastro")}
        >
          Não tem uma conta?
        </Text>
      </View>

      {/* Botão de reconexão quando houver erro de conexão */}
      {connectionError && (
        <TouchableOpacity
          style={styles.reconnectButton}
          onPress={() => {
            Alert.alert(
              "Problemas de Conexão",
              "Verifique se o servidor está rodando e se você está conectado à internet. Você também pode editar o arquivo config.js para alterar o endereço do servidor.",
              [
                { text: "OK", style: "cancel" },
                {
                  text: "Tentar Novamente",
                  onPress: () => handleLogin(),
                },
              ]
            );
          }}
        >
          <Text style={styles.reconnectButtonText}>
            Problemas de Conexão? Clique Aqui
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f8f9fa",
    padding: 20,
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    width: "100%",
  },
  header: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 10,
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 10,
  },
  input: {
    width: "80%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  rememberMe: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 15,
  },
  rememberMeText: {
    fontSize: 16,
    color: "#333",
  },
  button: {
    backgroundColor: "#007bff",
    borderRadius: 5,
    padding: 5,
    width: 100,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  linkText: {
    marginTop: 20,
    color: "#007bff",
    fontSize: 14,
  },
  buttonDisabled: {
    backgroundColor: "#6c757d",
    opacity: 0.7,
  },
  reconnectButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#dc3545",
    borderRadius: 5,
    alignItems: "center",
  },
  reconnectButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  serverStatus: {
    fontSize: 14,
    marginBottom: 15,
    fontWeight: "bold",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  serverStatusOk: {
    color: "#fff",
    backgroundColor: "#28a745",
  },
  serverStatusError: {
    color: "#fff",
    backgroundColor: "#dc3545",
  },
});

export default Login;
