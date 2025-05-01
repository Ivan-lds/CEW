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
import { FontAwesome } from "@expo/vector-icons";

const Login = ({ navigation }: { navigation: any }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [showConnectionStatus, setShowConnectionStatus] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const showStatusIndicator = () => {
    setShowConnectionStatus(true);

    setTimeout(() => {
      setShowConnectionStatus(false);
    }, 1200);
  };

  useEffect(() => {
    setConnectionError(false);
    showStatusIndicator();

    return () => {
      setConnectionError(false);
      setShowConnectionStatus(false);
    };
  }, []);

  useEffect(() => {
    const carregarCredenciaisSalvas = async () => {
      try {
        // Verifica se existem informações de login salvas
        const savedEmail = await AsyncStorage.getItem("savedEmail");
        const savedPassword = await AsyncStorage.getItem("savedPassword");
        const savedRememberMe = await AsyncStorage.getItem("rememberMe");

        if (savedEmail && savedPassword && savedRememberMe === "true") {
          // Preenche os campos com as informações salvas
          setEmail(savedEmail);
          setPassword(savedPassword);
          setRememberMe(true);
          console.log("Credenciais carregadas do armazenamento local");
        }
      } catch (error) {
        console.error("Erro ao carregar credenciais salvas:", error);
      }
    };

    carregarCredenciaisSalvas();
  }, []);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    if (isLoading) {
      console.log("Login já está em andamento. Aguarde...");
      return;
    }

    setIsLoading(true);

    setConnectionError(false);

    try {
      console.log(`Tentando fazer login no servidor: ${API_URL}/login`);

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
          timeout: 20000,
        }
      );

      console.log("Resposta completa do servidor:", response.data);

      if (response.data.success) {
        await AsyncStorage.setItem("userEmail", email);
        await AsyncStorage.setItem("userName", response.data.user.name);
        await AsyncStorage.setItem(
          "departamento", 
          response.data.user.departamento || ""
        );
        await AsyncStorage.setItem("role", response.data.role);
        await AsyncStorage.setItem("userId", response.data.user.id.toString());

        if (rememberMe) {
          await AsyncStorage.setItem("savedEmail", email);
          await AsyncStorage.setItem("savedPassword", password);
          await AsyncStorage.setItem("rememberMe", "true");
          console.log("Credenciais salvas para uso futuro");
        } else {
          await AsyncStorage.removeItem("savedEmail");
          await AsyncStorage.removeItem("savedPassword");
          await AsyncStorage.removeItem("rememberMe");
          console.log("Credenciais removidas do armazenamento local");
        }

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

        setTimeout(() => {
          console.log(
            "Redirecionando para a Home e atualizando notificações..."
          );

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
          "Não foi possível conectar ao servidor. Verifique se você está conectado à internet.";
        isConnectionError = true;
      } else if (error.response) {
        errorMessage =
          error.response.data?.message ||
          `Erro ${error.response.status}: ${error.response.statusText}`;
      }

      setConnectionError(isConnectionError);

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
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Senha"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <FontAwesome
            name={showPassword ? "eye" : "eye-slash"}
            size={20}
            color="#666"
          />
        </TouchableOpacity>
      </View>
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
              "Verifique se você está conectado à internet.",
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
  passwordContainer: {
    width: "80%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  passwordInput: {
    flex: 1,
    padding: 10,
  },
  eyeIcon: {
    padding: 10,
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
