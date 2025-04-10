import React from "react";
import { useState } from "react";
import { View, Text, StyleSheet, Button } from "react-native";

const Tasks = () => {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Limpeza da Casa", completed: false },
    { id: 2, title: "Lavar Louça", completed: true },
  ]);

  const toggleTaskCompletion = (id: number) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tarefas Pendentes</Text>
      {tasks.map((task) => (
        <View key={task.id} style={styles.task}>
          <Text
            style={{
              textDecorationLine: task.completed ? "line-through" : "none",
            }}
          >
            {task.title}
          </Text>
          <Button
            title={task.completed ? "Desfazer" : "Concluir"}
            onPress={() => toggleTaskCompletion(task.id)}
          />
        </View>
      ))}
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
  task: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
});

export default Tasks;
