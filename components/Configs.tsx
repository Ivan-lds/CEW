import { useState } from "react";
import { View, Text, StyleSheet, Button, Switch, Alert } from "react-native";

const Configs = () => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  const toggleTheme = () => {
    setIsDarkTheme((previousState) => !previousState);
    Alert.alert(
      "Tema Alterado",
      isDarkTheme ? "Tema Claro Ativado!" : "Tema Escuro Ativado!"
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurações</Text>

      {/* Seção: Dados Pessoais */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Dados Pessoais</Text>
        <Button title="Editar Perfil" onPress={() => alert("Editar Perfil")} />
      </View>

      {/* Seção: Temas */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎨 Tema</Text>
        <View style={styles.themeSwitcher}>
          <Text style={styles.themeText}>
            {isDarkTheme ? "Modo Escuro" : "Modo Claro"}
          </Text>
          <Switch
            value={isDarkTheme}
            onValueChange={toggleTheme}
            thumbColor={isDarkTheme ? "#f4f3f4" : "#f8f9fa"}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
          />
        </View>
      </View>

      {/* Seção: Documentos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📁 Documentos</Text>
        <Button
          title="Gerenciar Documentos"
          onPress={() => alert("Gerenciar Documentos")}
        />
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
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  section: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 10,
  },
  themeSwitcher: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  themeText: {
    fontSize: 16,
    color: "#333",
  },
});

export default Configs;