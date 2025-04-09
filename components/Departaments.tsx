import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Button, Alert } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

const Departaments = () => {
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [message, setMessage] = useState("");

  const sendNotification = () => {
    if (!selectedDepartment) {
      Alert.alert("Erro", "Por favor, selecione um departamento.");
      return;
    }
    if (!message) {
      Alert.alert("Erro", "Por favor, escreva uma mensagem.");
      return;
    }
    Alert.alert(
      "Notificação Enviada",
      `Departamento: ${selectedDepartment}\nMensagem: ${message}`
    );
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

      <Button title="Enviar Notificação" onPress={sendNotification} />
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
});

export default Departaments;
