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
  Alert,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_URL, API_CONFIG } from "../config";

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

// Função para formatar a data no formato dd-mm-yyyy
const formatarData = (dataString: string | null): string => {
  if (!dataString) return "";

  try {
    const data = new Date(dataString);
    const dia = data.getDate().toString().padStart(2, "0");
    const mes = (data.getMonth() + 1).toString().padStart(2, "0");
    const ano = data.getFullYear();

    return `${dia}-${mes}-${ano}`;
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return dataString;
  }
};

const Home = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [tarefasHoje, setTarefasHoje] = useState<Tarefa[]>([]);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [emViagem, setEmViagem] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [tarefaExecutando, setTarefaExecutando] = useState<number | null>(null);
  const [buscandoTarefas, setBuscandoTarefas] = useState(false);
  const [aniversarios, setAniversarios] = useState<
    { id: number; name: string; aniversario: string }[]
  >([]);
  const navigation = useNavigation();

  const notifications: Notification[] = [
    { id: "1", message: "🔧 Manutenção: Solicitação de conserto enviada!" },
    { id: "2", message: "💰 Caixa: Novo relatório financeiro disponível." },
    { id: "3", message: "✍ Reunião agendada para 10/04/2025." },
  ];

  // Função para formatar data no padrão dd-mm-yyyy
  const formatarData = (dataString) => {
    if (!dataString) return "";

    try {
      const data = new Date(dataString);
      const dia = data.getDate().toString().padStart(2, "0");
      const mes = (data.getMonth() + 1).toString().padStart(2, "0");
      const ano = data.getFullYear();

      return `${dia}-${mes}-${ano}`;
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return dataString;
    }
  };

  // Função para buscar aniversários
  const buscarAniversarios = async () => {
    try {
      console.log("Buscando aniversários atualizados...");

      // Usar a configuração padrão da API para evitar problemas de CORS
      const response = await axios.get(`${API_URL}/users`, API_CONFIG);

      if (response.data) {
        // Filtrar apenas usuários que têm aniversário cadastrado
        const aniversariosUsuarios = response.data
          .filter((user) => user.aniversario)
          .map((user) => ({
            id: user.id,
            name: user.name,
            aniversario: formatarData(user.aniversario),
          }));

        console.log(`Encontrados ${aniversariosUsuarios.length} aniversários`);

        // Verificar se houve mudança na lista de aniversários
        const aniversariosAnteriores = JSON.stringify(
          aniversarios.map((a) => a.id)
        );
        const aniversariosNovos = JSON.stringify(
          aniversariosUsuarios.map((a) => a.id)
        );

        if (aniversariosAnteriores !== aniversariosNovos) {
          console.log("Lista de aniversários atualizada");
          setAniversarios(aniversariosUsuarios);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar aniversários:", error);
    }
  };

  // Efeito para atualizar os dados quando a tela recebe foco
  useEffect(() => {
    // Função para atualizar todos os dados
    const atualizarDados = async () => {
      if (userId) {
        await Promise.all([buscarTarefasUsuario(userId), buscarAniversarios()]);
      }
    };

    // Adicionar listener para quando a tela receber foco
    const unsubscribe = navigation.addListener("focus", () => {
      console.log("Home recebeu foco - atualizando dados");
      atualizarDados();
    });

    // Limpar o listener quando o componente for desmontado
    return unsubscribe;
  }, [navigation, userId]);

  useEffect(() => {
    const carregarDadosUsuario = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem("userId");
        const storedUserName = await AsyncStorage.getItem("userName");
        const role = await AsyncStorage.getItem("role");

        console.log("Dados do usuário carregados:", {
          userId: storedUserId,
          userName: storedUserName,
          role: role,
        });

        if (storedUserId && storedUserName) {
          setUserId(parseInt(storedUserId));
          setUserName(storedUserName);
          setIsAdmin(role === "admin");
          await buscarTarefasUsuario(parseInt(storedUserId));
          await buscarAniversarios(); // Buscar aniversários
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      } finally {
        setCarregando(false);
      }
    };

    carregarDadosUsuario();

    // Atualiza as tarefas e aniversários a cada minuto
    const interval = setInterval(() => {
      if (userId) {
        buscarTarefasUsuario(userId);
        buscarAniversarios(); // Também atualiza os aniversários periodicamente
      }
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Adicionar um useEffect para debug do estado isAdmin
  useEffect(() => {
    console.log("Estado isAdmin atualizado:", isAdmin);
  }, [isAdmin]);

  const buscarTarefasUsuario = async (id: number) => {
    // Evita múltiplas chamadas simultâneas
    if (buscandoTarefas) {
      console.log("Já está buscando tarefas. Aguarde...");
      return;
    }

    try {
      // Marca que está buscando tarefas
      setBuscandoTarefas(true);
      setCarregando(true);
      console.log(`Buscando tarefas para o usuário ${id}...`);

      const response = await axios.get(
        `${API_URL}/tarefas/usuario/${id}`,
        API_CONFIG
      );
      if (response.data.success) {
        console.log(
          `Tarefas encontradas: ${response.data.tarefas_hoje?.length || 0}`
        );
        setEmViagem(response.data.em_viagem);
        setTarefasHoje(response.data.tarefas_hoje || []);
        setHistorico(response.data.historico || []);

        // Log do número de tarefas encontradas
        console.log(
          `Número de tarefas encontradas: ${
            response.data.tarefas_hoje?.length || 0
          }`
        );
      } else {
        console.error("Erro na resposta do servidor:", response.data);
        Alert.alert("Erro", "Não foi possível carregar as tarefas");
      }
    } catch (error) {
      console.error("Erro ao buscar tarefas do usuário:", error);

      // Mensagem de erro mais específica baseada no tipo de erro
      let errorMessage =
        "Não foi possível carregar as tarefas. Verifique sua conexão.";

      if (error.code === "ECONNABORTED") {
        errorMessage =
          "Tempo de conexão esgotado. Verifique sua conexão com a internet e tente novamente.";
      } else if (error.message && error.message.includes("Network Error")) {
        errorMessage =
          "Erro de conexão. Verifique se o servidor está rodando e se você está conectado à internet.";
      } else if (error.response) {
        // O servidor respondeu com um status de erro
        errorMessage =
          error.response.data?.message ||
          `Erro ${error.response.status}: ${error.response.statusText}`;
      }

      Alert.alert("Erro", errorMessage);
    } finally {
      setCarregando(false);
      setBuscandoTarefas(false);
      console.log("Busca de tarefas finalizada");
    }
  };

  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const executarTarefa = async (tarefaId: number) => {
    if (!userId) return;

    // Se já estiver executando qualquer tarefa, não faz nada
    if (tarefaExecutando !== null) {
      console.log(`Já existe uma tarefa em execução. Ignorando clique.`);
      return;
    }

    // Desabilita o botão imediatamente para evitar cliques duplos
    setTarefaExecutando(tarefaId);

    // Cria uma cópia local da tarefa
    const tarefaParaExecutar = tarefasHoje.find((t) => t.id === tarefaId);

    try {
      console.log(`Executando tarefa ${tarefaId}...`);

      // Faz a requisição para o servidor
      const response = await axios.post(
        `${API_URL}/tarefas/${tarefaId}/executar`,
        {
          usuario_id: userId,
          data_execucao: new Date().toISOString().split("T")[0],
        },
        {
          ...API_CONFIG,
          timeout: 30000, // Aumenta o timeout para 30 segundos
        }
      );

      // Se a requisição for bem-sucedida
      if (response.data.success) {
        console.log(`Tarefa ${tarefaId} executada com sucesso!`);

        // Remove a tarefa da lista local após confirmação do servidor
        setTarefasHoje((prev) => prev.filter((t) => t.id !== tarefaId));

        // Mostra um alerta de sucesso com mais informações
        Alert.alert(
          "Tarefa Concluída",
          `A tarefa foi marcada como concluída com sucesso!\n\nPróximo responsável: ${
            response.data.novoResponsavelId || "Não definido"
          }`,
          [
            {
              text: "OK",
              style: "default",
              onPress: () => {
                // Atualiza a lista de tarefas quando o usuário fechar o alerta
                if (userId && !buscandoTarefas) {
                  buscarTarefasUsuario(userId);
                }
              },
            },
          ],
          { cancelable: false }
        );
      } else {
        throw new Error(response.data.message || "Erro ao executar tarefa");
      }
    } catch (error) {
      console.error("Erro ao executar tarefa:", error);

      // Mensagem de erro mais específica baseada no tipo de erro
      let errorMessage =
        "Não foi possível marcar a tarefa como concluída. Tente novamente.";

      if (error.code === "ECONNABORTED") {
        errorMessage =
          "Tempo de conexão esgotado. Verifique sua conexão com a internet e tente novamente.";
      } else if (error.message && error.message.includes("Network Error")) {
        errorMessage =
          "Erro de conexão. Verifique se o servidor está rodando e se você está conectado à internet.";
      } else if (error.response) {
        // O servidor respondeu com um status de erro
        errorMessage =
          error.response.data?.message ||
          `Erro ${error.response.status}: ${error.response.statusText}`;
      }

      Alert.alert(
        "Erro",
        errorMessage,
        [
          {
            text: "OK",
            style: "default",
          },
        ],
        { cancelable: false }
      );

      // Restaura a tarefa na lista local já que a execução falhou
      if (tarefaParaExecutar) {
        setTarefasHoje((prev) => [...prev, tarefaParaExecutar]);
      }

      // Atualiza a lista de tarefas após o erro
      if (userId && !buscandoTarefas) {
        setTimeout(async () => {
          try {
            await buscarTarefasUsuario(userId);
          } catch (updateError) {
            console.error(
              "Erro ao atualizar lista de tarefas após erro:",
              updateError
            );
          }
        }, 1000);
      }
    } finally {
      // Limpa o estado de execução antes de buscar as tarefas
      setTarefaExecutando(null);
      console.log(`Finalizando execução da tarefa ${tarefaId}`);
    }
  };

  if (!userId || carregando) {
    return (
      <SafeAreaView style={[styles.safeContainer, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </SafeAreaView>
    );
  }

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
          <ActivityIndicator
            size="large"
            color="#007bff"
            style={styles.loader}
          />
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
                  {tarefasHoje.map((tarefa) => (
                    <View key={tarefa.id} style={styles.tarefaItem}>
                      <View style={styles.tarefaInfo}>
                        <Text style={styles.tarefaNome}>{tarefa.nome}</Text>
                        {tarefa.proxima_execucao && (
                          <>
                            <Text style={styles.separador}>-</Text>
                            <Text style={styles.tarefaData}>
                              {formatarData(tarefa.proxima_execucao)}
                            </Text>
                          </>
                        )}
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.executarButton,
                          (tarefaExecutando === tarefa.id ||
                            tarefaExecutando !== null) &&
                            styles.executarButtonDisabled,
                        ]}
                        onPress={() => executarTarefa(tarefa.id)}
                        disabled={
                          tarefaExecutando === tarefa.id ||
                          tarefaExecutando !== null
                        }
                      >
                        {tarefaExecutando === tarefa.id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={styles.executarButtonText}>✓</Text>
                        )}
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
                        {Array.isArray(item.tarefas)
                          ? item.tarefas.join(", ")
                          : ""}
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
              {aniversarios.length > 0 ? (
                aniversarios.map((aniversario) => (
                  <Text key={aniversario.id} style={styles.aniversarioItem}>
                    - {aniversario.name}:{" "}
                    <Text style={styles.aniversarioData}>
                      {aniversario.aniversario}
                    </Text>
                  </Text>
                ))
              ) : (
                <Text style={styles.semAniversariosText}>
                  Nenhum aniversário cadastrado.
                </Text>
              )}
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
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#007bff",
  },
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
  tarefaInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  tarefaNome: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  separador: {
    fontSize: 16,
    color: "#6c757d",
    fontWeight: "bold",
    marginHorizontal: 4,
  },
  tarefaData: {
    fontSize: 14,
    color: "#fff",
    fontStyle: "italic",
    backgroundColor: "#6c757d",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 5,
    overflow: "hidden",
  },
  executarButton: {
    backgroundColor: "#28a745",
    width: 25,
    height: 25,
    borderRadius: 5,
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
  executarButtonDisabled: {
    backgroundColor: "#6c757d",
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
  aniversarioItem: {
    fontSize: 16,
    color: "#333",
    marginVertical: 4,
  },
  aniversarioData: {
    fontWeight: "bold",
    color: "#1382AB",
  },
  semAniversariosText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 10,
  },
});

export default Home;
