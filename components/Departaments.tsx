import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Alert,
  ActivityIndicator,
} from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import axios from "axios";
import { API_URL, API_CONFIG } from "../config";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Departaments = () => {
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);

  // Carregar dados do usuário ao montar o componente
  useEffect(() => {
    const carregarDadosUsuario = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        const storedUserName = await AsyncStorage.getItem("userName");

        if (storedUserId && storedUserName) {
          setUserId(parseInt(storedUserId));
          setUserName(storedUserName);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      }
    };

    carregarDadosUsuario();
  }, []);

  const sendNotification = async () => {
    if (!selectedDepartment) {
      Alert.alert("Erro", "Por favor, selecione um departamento.");
      return;
    }
    if (!message) {
      Alert.alert("Erro", "Por favor, escreva uma mensagem.");
      return;
    }

    setLoading(true);

    try {
      console.log("Enviando notificação:", {
        mensagem: message,
        departamento: selectedDepartment,
        remetente_id: userId,
        remetente_nome: userName,
      });

      // Enviar notificação para o servidor
      const response = await axios.post(
        `${API_URL}/notificacoes`,
        {
          mensagem: message,
          departamento: selectedDepartment,
          remetente_id: userId,
          remetente_nome: userName,
        },
        API_CONFIG
      );

      if (response.data.success) {
        Alert.alert(
          "Sucesso",
          `Mensagem enviada com sucesso para o departamento ${selectedDepartment}!`
        );

        // Limpar campos após envio
        setMessage("");
        setSelectedDepartment("");
      } else {
        Alert.alert(
          "Erro",
          "Não foi possível enviar a mensagem. Tente novamente."
        );
      }
    } catch (error) {
      console.error("Erro ao enviar notificação:", error);
      Alert.alert(
        "Erro",
        "Ocorreu um erro ao enviar a mensagem. Verifique sua conexão."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gerenciar Departamentos</Text>
      <Text style={styles.subtitle}>Selecione o departamento:</Text>

      {/* Lista de Departamentos */}
      <View style={styles.departmentsContainer}>
        <TouchableOpacity
          style={[
            styles.departmentButton,
            selectedDepartment === "Todos" && styles.selectedButton,
          ]}
          onPress={() => setSelectedDepartment("Todos")}
        >
          <Text style={styles.departmentText}>📢 Todos os Departamentos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.departmentButton,
            selectedDepartment === "Presidente" && styles.selectedButton,
          ]}
          onPress={() => setSelectedDepartment("Presidente")}
        >
          <Text style={styles.departmentText}>👨‍💼 Presidente</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.departmentButton,
            selectedDepartment === "Vice-Presidente" && styles.selectedButton,
          ]}
          onPress={() => setSelectedDepartment("Vice-Presidente")}
        >
          <Text style={styles.departmentText}>👨‍💼 Vice-Presidente</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.departmentButton,
            selectedDepartment === "Secretário" && styles.selectedButton,
          ]}
          onPress={() => setSelectedDepartment("Secretário")}
        >
          <Text style={styles.departmentText}>✍️ Secretário</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.departmentButton,
            selectedDepartment === "Vice-Secretário" && styles.selectedButton,
          ]}
          onPress={() => setSelectedDepartment("Vice-Secretário")}
        >
          <Text style={styles.departmentText}>✍️ Vice-Secretário</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.departmentButton,
            selectedDepartment === "Manutenção" && styles.selectedButton,
          ]}
          onPress={() => setSelectedDepartment("Manutenção")}
        >
          <Text style={styles.departmentText}>🔧 Manutenção</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.departmentButton,
            selectedDepartment === "Compras" && styles.selectedButton,
          ]}
          onPress={() => setSelectedDepartment("Compras")}
        >
          <Text style={styles.departmentText}>🛒 Compras</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.departmentButton,
            selectedDepartment === "Fiscalização" && styles.selectedButton,
          ]}
          onPress={() => setSelectedDepartment("Fiscalização")}
        >
          <Text style={styles.departmentText}>👀 Fiscalização</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.departmentButton,
            selectedDepartment === "Caixa" && styles.selectedButton,
          ]}
          onPress={() => setSelectedDepartment("Caixa")}
        >
          <Text style={styles.departmentText}>💰 Caixa</Text>
        </TouchableOpacity>
      </View>

      {/* Campo de Texto para a Mensagem */}
      <Text style={styles.subtitle}>Escreva sua solicitação:</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Digite as necessidades do setor"
        value={message}
        onChangeText={setMessage}
        editable={!!selectedDepartment}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
      ) : (
        <Button title="Enviar Notificação" onPress={sendNotification} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  departmentsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 5,
  },
  departmentButton: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    width: "100%",
    alignItems: "center",
  },
  selectedButton: {
    backgroundColor: "#007bff",
    borderColor: "#0056b3",
  },
  departmentText: {
    fontSize: 16,
    color: "#333",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  loader: {
    marginVertical: 20,
  },
});

export default Departaments;
