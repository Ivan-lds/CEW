import React from "react";
import { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  FlatList,
  StatusBar,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Notification {
  id: string;
  message: string;
}

const Home = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigation = useNavigation();

  const notifications: Notification[] = [
    { id: "1", message: "🔧 Manutenção: Solicitação de conserto enviada!" },
    { id: "2", message: "💰 Caixa: Novo relatório financeiro disponível." },
    { id: "3", message: "✍ Reunião agendada para 10/04/2025." },
  ];

  useEffect(() => {
    const checkAdminStatus = async () => {
      const role = await AsyncStorage.getItem("role");
      console.log("Role lido do AsyncStorage:", role);
      setIsAdmin(role === "admin");
    };
    checkAdminStatus();
  }, []);

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CEW</Text>
        <TouchableOpacity
          onPress={toggleModal}
          style={{ padding: 10, cursor: "pointer" }}
        >
          <FontAwesome name="bell" size={24} color="#1382AB" />
        </TouchableOpacity>
      </View>

      {/* Painéis da Página Inicial */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Painel de Tarefas */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>📋 Tarefas</Text>
          <Text>- Casa</Text>
          <Text>- Lixo</Text>
          <Text>- Pia, Mesa, Microondas...</Text>
          <Text>- Fogão</Text>
        </View>

        {/* Painel de Roupas */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>🧺 Roupas</Text>
          <Text>- João: Segunda-feira</Text>
          <Text>- Maria: Terça-feira</Text>
          <Text>- Ana: Quarta-feira</Text>
        </View>

        {/* Painel de Aniversários */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>🎉 Aniversários</Text>
          <Text>- João Silva: 15/04</Text>
          <Text>- Maria Santos: 20/08</Text>
          <Text>- Ana Costa: 25/12</Text>
        </View>

        {/* Painel de Controle de Gás */}
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>⛽ Controle de Gás</Text>
          <Text>- Última reposição: 15/03/2025</Text>
        </View>
      </ScrollView>

      {/* Menu Inferior */}
      <View style={styles.menu}>
        <Text
          style={styles.menuItem}
          onPress={() => navigation.navigate("Home")}
        >
          📋
        </Text>
        <Text
          style={styles.menuItem}
          onPress={() => navigation.navigate("Departaments")}
        >
          🛠️
        </Text>
        <Text
          style={styles.menuItem}
          onPress={() => navigation.navigate("Budget")}
        >
          💰
        </Text>
        <Text
          style={styles.menuItem}
          onPress={() => navigation.navigate(isAdmin ? "Admin" : "Configs")}
        >
          ⚙️
        </Text>
      </View>

      {/* Modal de Notificações */}
      <Modal visible={isModalVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>📨 Notificações</Text>
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }: { item: Notification }) => (
              <View style={styles.notificationItem}>
                <Text style={styles.notificationText}>{item.message}</Text>
              </View>
            )}
          />
          <TouchableOpacity style={styles.closeButton} onPress={toggleModal}>
            <Text style={styles.closeButtonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    paddingTop: StatusBar.currentHeight,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#1382AB",
  },
  headerTitle: {
    fontSize: 26,
    paddingRight: 100,
    borderLeftWidth: 5,
    borderLeftColor: "#1382AB",
    borderTopWidth: 2,
    borderTopColor: "#1382AB",
    paddingLeft: 5,
    fontWeight: "bold",
    color: "#333",
  },
  content: {
    marginTop: 10,
    paddingHorizontal: 15,
    paddingBottom: 20,
    height: 400,
  },
  panel: {
    backgroundColor: "#fff",
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  menu: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#ffffff",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    marginTop: 10,
  },
  menuItem: {
    fontSize: 20,
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  notificationItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 5,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  notificationText: {
    fontSize: 16,
    color: "#333",
  },
  closeButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Home;
