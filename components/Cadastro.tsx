import { useState } from "react";
import { View, Text, TextInput, StyleSheet, Image } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import axios from "axios";

const Cadastro = ({ navigation }: { navigation: any }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = () => {
    if (!name || !email || !password || !confirmPassword) {
      alert("Por favor, preencha todos os campos.");
      return;
    }
    if (password !== confirmPassword) {
      alert("As senhas não conferem.");
      return;
    }

    // Enviar dados ao backend
    axios
      .post("http://192.168.1.55:3001/register", {
        name,
        email,
        password,
      })
      .then((response) => {
        alert(response.data.message);
        navigation.navigate("Login");
      })
      .catch((error) => {
        alert("Erro ao cadastrar. Tente novamente.");
        console.error(error);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Cadastro</Text>

      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={name}
        onChangeText={setName}
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
      <TextInput
        style={styles.input}
        placeholder="Confirme a senha"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Cadastrar</Text>
      </TouchableOpacity>

      <Text
        style={styles.linkText}
        onPress={() => navigation.navigate("Login")}
      >
        Já tem uma conta? Faça login.
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
    width: 120,
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

export default Cadastro;
