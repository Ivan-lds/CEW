import React, { useState, useEffect, useContext } from "react";
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
import { ThemeContext } from "../ThemeContext";

const Departaments = () => {
  // Usar o contexto de tema global
  const { theme } = useContext(ThemeContext);

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
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        Gerenciar Departamentos
      </Text>
      <Text style={[styles.subtitle, { color: theme.text }]}>
        Selecione o departamento:
      </Text>

      {/* Lista de Departamentos */}
      <View style={styles.departmentsContainer}>
        <TouchableOpacity
          style={[
            styles.departmentButton,
            { backgroundColor: theme.panel, borderColor: theme.border },
            selectedDepartment === "Todos" && [
              styles.selectedButton,
              {
                backgroundColor: theme.accent || "#007bff",
                borderColor: theme.border,
              },
            ],
          ]}
          onPress={() => setSelectedDepartment("Todos")}
        >
          <Text
            style={[
              styles.departmentText,
              { color: selectedDepartment === "Todos" ? "#fff" : theme.text },
            ]}
          >
            📢 Todos os Departamentos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.departmentButton,
            { backgroundColor: theme.panel, borderColor: theme.border },
            selectedDepartment === "Presidente" && [
              styles.selectedButton,
              {
                backgroundColor: theme.accent || "#007bff",
                borderColor: theme.border,
              },
            ],
          ]}
          onPress={() => setSelectedDepartment("Presidente")}
        >
          <Text
            style={[
              styles.departmentText,
              {
                color:
                  selectedDepartment === "Presidente" ? "#fff" : theme.text,
              },
            ]}
          >
            👨‍💼 Presidente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.departmentButton,
            { backgroundColor: theme.panel, borderColor: theme.border },
            selectedDepartment === "Vice-Presidente" && [
              styles.selectedButton,
              {
                backgroundColor: theme.accent || "#007bff",
                borderColor: theme.border,
              },
            ],
          ]}
          onPress={() => setSelectedDepartment("Vice-Presidente")}
        >
          <Text
            style={[
              styles.departmentText,
              {
                color:
                  selectedDepartment === "Vice-Presidente"
                    ? "#fff"
                    : theme.text,
              },
            ]}
          >
            👨‍💼 Vice-Presidente
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.departmentButton,
            { backgroundColor: theme.panel, borderColor: theme.border },
            selectedDepartment === "Secretário" && [
              styles.selectedButton,
              {
                backgroundColor: theme.accent || "#007bff",
                borderColor: theme.border,
              },
            ],
          ]}
          onPress={() => setSelectedDepartment("Secretário")}
        >
          <Text
            style={[
              styles.departmentText,
              {
                color:
                  selectedDepartment === "Secretário" ? "#fff" : theme.text,
              },
            ]}
          >
            ✍️ Secretário
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.departmentButton,
            { backgroundColor: theme.panel, borderColor: theme.border },
            selectedDepartment === "Vice-Secretário" && [
              styles.selectedButton,
              {
                backgroundColor: theme.accent || "#007bff",
                borderColor: theme.border,
              },
            ],
          ]}
          onPress={() => setSelectedDepartment("Vice-Secretário")}
        >
          <Text
            style={[
              styles.departmentText,
              {
                color:
                  selectedDepartment === "Vice-Secretário"
                    ? "#fff"
                    : theme.text,
              },
            ]}
          >
            ✍️ Vice-Secretário
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.departmentButton,
            { backgroundColor: theme.panel, borderColor: theme.border },
            selectedDepartment === "Manutenção" && [
              styles.selectedButton,
              {
                backgroundColor: theme.accent || "#007bff",
                borderColor: theme.border,
              },
            ],
          ]}
          onPress={() => setSelectedDepartment("Manutenção")}
        >
          <Text
            style={[
              styles.departmentText,
              {
                color:
                  selectedDepartment === "Manutenção" ? "#fff" : theme.text,
              },
            ]}
          >
            🔧 Manutenção
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.departmentButton,
            { backgroundColor: theme.panel, borderColor: theme.border },
            selectedDepartment === "Compras" && [
              styles.selectedButton,
              {
                backgroundColor: theme.accent || "#007bff",
                borderColor: theme.border,
              },
            ],
          ]}
          onPress={() => setSelectedDepartment("Compras")}
        >
          <Text
            style={[
              styles.departmentText,
              { color: selectedDepartment === "Compras" ? "#fff" : theme.text },
            ]}
          >
            🛒 Compras
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.departmentButton,
            { backgroundColor: theme.panel, borderColor: theme.border },
            selectedDepartment === "Fiscalização" && [
              styles.selectedButton,
              {
                backgroundColor: theme.accent || "#007bff",
                borderColor: theme.border,
              },
            ],
          ]}
          onPress={() => setSelectedDepartment("Fiscalização")}
        >
          <Text
            style={[
              styles.departmentText,
              {
                color:
                  selectedDepartment === "Fiscalização" ? "#fff" : theme.text,
              },
            ]}
          >
            👀 Fiscalização
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.departmentButton,
            { backgroundColor: theme.panel, borderColor: theme.border },
            selectedDepartment === "Caixa" && [
              styles.selectedButton,
              {
                backgroundColor: theme.accent || "#007bff",
                borderColor: theme.border,
              },
            ],
          ]}
          onPress={() => setSelectedDepartment("Caixa")}
        >
          <Text
            style={[
              styles.departmentText,
              { color: selectedDepartment === "Caixa" ? "#fff" : theme.text },
            ]}
          >
            💰 Caixa
          </Text>
        </TouchableOpacity>
      </View>

      {/* Campo de Texto para a Mensagem */}
      <Text style={[styles.subtitle, { color: theme.text }]}>
        Escreva sua solicitação:
      </Text>
      <TextInput
        style={[
          styles.textInput,
          {
            backgroundColor: "#FFFFFF",
            color: "#000000",
            borderColor: theme.border,
            opacity: !!selectedDepartment ? 1 : 0.5,
          },
        ]}
        placeholder="Digite as necessidades do setor"
        placeholderTextColor="#666666"
        value={message}
        onChangeText={setMessage}
        editable={!!selectedDepartment}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.accent || "#007bff"}
          style={styles.loader}
        />
      ) : (
        <View style={{ marginTop: 10 }}>
          <Button
            title="Enviar Notificação"
            onPress={sendNotification}
            color={theme.accent || "#007bff"}
          />
        </View>
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
