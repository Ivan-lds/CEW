import React from "react";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Login = ({ navigation }: { navigation: any }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    try {
      const response = await axios.post("http://192.168.1.55:3001/login", {
        email,
        password,
      });

      console.log("Resposta completa do servidor:", response.data);

      if (response.data.success) {
        // Armazenar informações do usuário logado
        await AsyncStorage.setItem('userEmail', email);
        await AsyncStorage.setItem('userName', response.data.user.name);
        await AsyncStorage.setItem('userDepartment', response.data.user.departamento || '');
        await AsyncStorage.setItem('role', response.data.role);
        
        console.log("Informações do usuário armazenadas:");
        console.log("Email:", email);
        console.log("Nome:", response.data.user.name);
        console.log("Departamento:", response.data.user.departamento);
        console.log("Role:", response.data.role);
        
        console.log("Navegando para:", response.data.role === "admin" ? "Home" : "Home");
        
        // Sempre navega para Home primeiro
        navigation.navigate("Home");
      } else {
        Alert.alert("Erro", response.data.message);
      }
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      Alert.alert(
        "Erro",
        error.response?.data?.message || "Erro ao fazer login. Tente novamente."
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Login</Text>
      <Image
        source={require("../assets/img/background.png")}
        style={styles.image}
      />
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
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
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
});

export default Login;
