import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  FlatList,
} from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

const Admin = () => {
  const [taskFrequency, setTaskFrequency] = useState(0);
  const [tasksPaused, setTasksPaused] = useState(false);
  const [tasks, setTasks] = useState([
    { id: 1, name: "Limpar cozinha", assignedTo: "João", completed: false },
    { id: 2, name: "Lavar banheiro", assignedTo: "Ana", completed: false },
    { id: 3, name: "Organizar sala", assignedTo: "Maria", completed: false },
  ]);

  const handleSetTaskFrequency = (frequency) => {
    if (!frequency || frequency <= 0) {
      Alert.alert("Erro", "Defina um número de dias válido.");
      return;
    }
    setTaskFrequency(frequency);
    Alert.alert("Sucesso", `Tarefas agora ocorrerão a cada ${frequency} dias.`);
  };

  const handleTogglePauseTasks = () => {
    setTasksPaused(!tasksPaused);
    const status = !tasksPaused ? "pausadas" : "retomadas";
    Alert.alert("Tarefas Atualizadas", `As tarefas foram ${status}.`);
  };

  const renderTasks = () => {
    if (tasksPaused) {
      return (
        <Text style={styles.pausedText}>
          ⚠️ As tarefas estão pausadas devido à falta d'água.
        </Text>
      );
    }

    return (
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <Text>{item.name}</Text>
            <Text>Responsável: {item.assignedTo}</Text>
          </View>
        )}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurações Presidente</Text>

      {/* Frequência das Tarefas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequência das Tarefas</Text>
        <TextInput
          style={styles.input}
          placeholder="Definir frequência (em dias)"
          keyboardType="numeric"
          onSubmitEditing={(event) =>
            handleSetTaskFrequency(parseInt(event.nativeEvent.text))
          }
        />
      </View>

      {/* Botão para pausar tarefas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pausar/Retomar Tarefas</Text>
        <Button
          title={tasksPaused ? "Retomar Tarefas" : "Pausar Tarefas"}
          onPress={handleTogglePauseTasks}
        />
      </View>

      {/* Lista de Tarefas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tarefas</Text>
        {renderTasks()}
      </View>
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    backgroundColor: "#fff",
  },
  taskItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  pausedText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#d9534f",
    textAlign: "center",
  },
});

export default Admin;
