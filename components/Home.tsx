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
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

interface Notification {
  id: string;
  message: string;
}

interface Tarefa {
  id: number;
  nome: string;
  intervalo_dias: number;
  proxima_execucao: string | null;
}

interface HistoricoItem {
  data: string;
  tarefas: string[];
}

const Home = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [tarefasHoje, setTarefasHoje] = useState<Tarefa[]>([]);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [emViagem, setEmViagem] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const navigation = useNavigation();

  const notifications: Notification[] = [
    { id: "1", message: "🔧 Manutenção: Solicitação de conserto enviada!" },
    { id: "2", message: "💰 Caixa: Novo relatório financeiro disponível." },
    { id: "3", message: "✍ Reunião agendada para 10/04/2025." },
  ];

  useEffect(() => {
    const carregarDadosUsuario = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        const storedUserName = await AsyncStorage.getItem("userName");
        const role = await AsyncStorage.getItem("role");

        console.log("Dados do usuário carregados:", {
          userId: storedUserId,
          userName: storedUserName,
          role: role
        });

        if (storedUserId && storedUserName) {
          setUserId(parseInt(storedUserId));
          setUserName(storedUserName);
          setIsAdmin(role === "admin");
          await buscarTarefasUsuario(parseInt(storedUserId));
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      } finally {
        setCarregando(false);
      }
    };

    carregarDadosUsuario();

    // Atualiza as tarefas a cada minuto
    const interval = setInterval(() => {
      if (userId) {
        buscarTarefasUsuario(userId);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Adicionar um useEffect para debug do estado isAdmin
  useEffect(() => {
    console.log("Estado isAdmin atualizado:", isAdmin);
  }, [isAdmin]);

  const buscarTarefasUsuario = async (id: number) => {
    try {
      const response = await axios.get(`http://192.168.1.55:3001/tarefas/usuario/${id}`);
      if (response.data.success) {
        setEmViagem(response.data.em_viagem);
        setTarefasHoje(response.data.tarefas_hoje);
        setHistorico(response.data.historico);
      }
    } catch (error) {
      console.error("Erro ao buscar tarefas do usuário:", error);
    }
  };

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const executarTarefa = async (tarefaId: number) => {
    if (!userId) return;

    try {
      await axios.post(`http://192.168.1.55:3001/tarefas/${tarefaId}/executar`, {
        usuario_id: userId,
        data_execucao: new Date().toISOString().split('T')[0]
      });

      // Atualiza as tarefas após a execução
      await buscarTarefasUsuario(userId);
    } catch (error) {
      console.error("Erro ao executar tarefa:", error);
    }
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
        {carregando ? (
          <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
        ) : (
          <>
            {/* Painel de Tarefas do Usuário */}
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>📋 Minhas Tarefas</Text>
              {emViagem ? (
                <Text style={styles.emViagemText}>
                  Você está em viagem. Bom descanso! 🌴
                </Text>
              ) : tarefasHoje.length > 0 ? (
                <>
                  <Text style={styles.subTitle}>Tarefas para Hoje:</Text>
                  {tarefasHoje.map((tarefa) => (
                    <View key={tarefa.id} style={styles.tarefaItem}>
                      <Text style={styles.tarefaNome}>{tarefa.nome}</Text>
                      <TouchableOpacity
                        style={styles.executarButton}
                        onPress={() => executarTarefa(tarefa.id)}
                      >
                        <Text style={styles.executarButtonText}>✓</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </>
              ) : (
                <Text style={styles.semTarefasText}>
                  Nenhuma tarefa pendente para hoje! 🎉
                </Text>
              )}

              {/* Histórico de Tarefas */}
              {historico.length > 0 && (
                <>
                  <Text style={[styles.subTitle, styles.historicoTitle]}>
                    Histórico dos Últimos 7 Dias:
                  </Text>
                  {historico.map((item, index) => (
                    <View key={index} style={styles.historicoItem}>
                      <Text style={styles.historicoData}>{item.data}</Text>
                      <Text style={styles.historicoTarefas}>
                        {item.tarefas.join(", ")}
                      </Text>
                    </View>
                  ))}
                </>
              )}
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
          </>
        )}
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
  loader: {
    marginTop: 20,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    marginTop: 10,
    marginBottom: 5,
  },
  tarefaItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tarefaNome: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  executarButton: {
    backgroundColor: "#28a745",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  executarButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emViagemText: {
    fontSize: 16,
    color: "#6c757d",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 10,
  },
  semTarefasText: {
    fontSize: 16,
    color: "#28a745",
    textAlign: "center",
    marginTop: 10,
  },
  historicoTitle: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 15,
  },
  historicoItem: {
    marginVertical: 5,
  },
  historicoData: {
    fontSize: 14,
    color: "#666",
    fontWeight: "bold",
  },
  historicoTarefas: {
    fontSize: 14,
    color: "#333",
    marginTop: 2,
  },
});

export default Home;
