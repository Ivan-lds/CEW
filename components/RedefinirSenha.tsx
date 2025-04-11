import React from "react";
import { useState } from "react";
import { View, Text, TextInput, StyleSheet, Alert } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import axios from "axios";

const RedefinirSenha = ({ navigation }: { navigation: any }) => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRedefinirSenha = () => {
    if (!email || !newPassword || !confirmPassword) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Erro", "As senhas não conferem.");
      return;
    }

    // Enviar dados ao backend
    axios
      .post("http://192.168.1.55:3001/redefinir-senha", {
        email,
        newPassword,
      })
      .then((response) => {
        Alert.alert("Sucesso", response.data.message);
        navigation.navigate("Login");
      })
      .catch((error) => {
        Alert.alert(
          "Erro",
          error.response?.data?.message || "Erro ao redefinir senha. Tente novamente."
        );
        console.error(error);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Redefinir Senha</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Nova Senha"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirme a Nova Senha"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleRedefinirSenha}>
        <Text style={styles.buttonText}>Redefinir Senha</Text>
      </TouchableOpacity>

      <Text
        style={styles.linkText}
        onPress={() => navigation.navigate("Login")}
      >
        Voltar para o Login
      </Text>
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
  header: {
    marginTop: -10,
    fontSize: 30,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 20,
  },
  input: {
    width: "80%",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#007bff",
    borderRadius: 5,
    padding: 6,
    width: 150,
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

export default RedefinirSenha; 