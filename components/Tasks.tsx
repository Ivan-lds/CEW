import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  Switch,
  ActivityIndicator
} from "react-native";
import axios from "axios";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Tarefa {
  id: number;
  nome: string;
  intervalo_dias: number;
  esta_pausada: boolean;
  status: string;
  data_prevista: string;
  ultimo_responsavel: string | null;
  ultima_execucao: string | null;
  responsavel_nome: string | null;
  proxima_execucao: string | null;
}

interface Execucao {
  id: number;
  responsavel: string;
  data_execucao: string;
}

const Tasks = () => {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [historicoModalVisible, setHistoricoModalVisible] = useState(false);
  const [tarefaSelecionada, setTarefaSelecionada] = useState<Tarefa | null>(null);
  const [intervaloTemp, setIntervaloTemp] = useState("");
  const [historico, setHistorico] = useState<Execucao[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  // Buscar ID do usuário logado
  useEffect(() => {
    const carregarUserId = async () => {
      const email = await AsyncStorage.getItem("userEmail");
      if (email) {
        try {
          const response = await axios.get("http://192.168.1.55:3001/user-data", {
            params: { email }
          });
          if (response.data.success) {
            setUserId(response.data.user.id);
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
        }
      }
    };
    carregarUserId();
  }, []);

  // Atualizar responsáveis das tarefas
  const atualizarResponsaveis = async () => {
    try {
      await axios.post("http://192.168.1.55:3001/tarefas/atualizar-responsaveis");
      buscarTarefas();
    } catch (error) {
      console.error("Erro ao atualizar responsáveis:", error);
      Alert.alert("Erro", "Não foi possível atualizar os responsáveis das tarefas.");
    }
  };

  // Buscar tarefas agendadas
  const buscarTarefas = async () => {
    setCarregando(true);
    try {
      const response = await axios.get("http://192.168.1.55:3001/tarefas/agendamento");
      if (response.data.success) {
        setTarefas(response.data.tarefas);
      }
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error);
      Alert.alert("Erro", "Não foi possível carregar as tarefas.");
    } finally {
      setCarregando(false);
    }
  };

  // Inicializar tarefas padrão
  const inicializarTarefas = async () => {
    try {
      await axios.post("http://192.168.1.55:3001/tarefas/inicializar");
      buscarTarefas();
    } catch (error) {
      console.error("Erro ao inicializar tarefas:", error);
      Alert.alert("Erro", "Não foi possível inicializar as tarefas padrão.");
    }
  };

  // Atualizar intervalo de dias
  const atualizarIntervalo = async () => {
    if (!tarefaSelecionada) return;

    const intervalo = parseInt(intervaloTemp);
    if (isNaN(intervalo) || intervalo < 1) {
      Alert.alert("Erro", "Por favor, insira um número válido maior que zero.");
      return;
    }

    try {
      const response = await axios.put(
        `http://192.168.1.55:3001/tarefas/${tarefaSelecionada.id}/intervalo`,
        { intervalo_dias: intervalo }
      );

      if (response.data.success) {
        Alert.alert("Sucesso", "Intervalo atualizado com sucesso!");
        setModalVisible(false);
        buscarTarefas();
      }
    } catch (error) {
      console.error("Erro ao atualizar intervalo:", error);
      Alert.alert("Erro", "Não foi possível atualizar o intervalo.");
    }
  };

  // Alternar status de pausa da tarefa
  const alternarPausa = async (tarefa: Tarefa) => {
    try {
      const response = await axios.put(
        `http://192.168.1.55:3001/tarefas/${tarefa.id}/pausar`,
        { esta_pausada: !tarefa.esta_pausada }
      );

      if (response.data.success) {
        buscarTarefas();
      }
    } catch (error) {
      console.error("Erro ao alternar pausa:", error);
      Alert.alert("Erro", "Não foi possível alterar o status da tarefa.");
    }
  };

  // Buscar histórico de execuções
  const buscarHistorico = async (tarefaId: number) => {
    try {
      const response = await axios.get(`http://192.168.1.55:3001/tarefas/${tarefaId}/historico`);
      if (response.data.success) {
        setHistorico(response.data.historico);
      }
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      Alert.alert("Erro", "Não foi possível carregar o histórico.");
    }
  };

  // Registrar execução de tarefa
  const executarTarefa = async (tarefa: Tarefa) => {
    if (!userId) {
      Alert.alert("Erro", "Usuário não identificado.");
      return;
    }

    try {
      const response = await axios.post(`http://192.168.1.55:3001/tarefas/${tarefa.id}/executar`, {
        usuario_id: userId,
        data_execucao: new Date().toISOString().split('T')[0]
      });

      if (response.data.success) {
        Alert.alert("Sucesso", "Tarefa marcada como executada!");
        buscarTarefas();
      }
    } catch (error) {
      console.error("Erro ao executar tarefa:", error);
      Alert.alert("Erro", "Não foi possível registrar a execução da tarefa.");
    }
  };

  // Atualizar tarefas periodicamente
  useEffect(() => {
    buscarTarefas();
    atualizarResponsaveis();

    const interval = setInterval(() => {
      buscarTarefas();
      atualizarResponsaveis();
    }, 60000); // Atualiza a cada minuto

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return '#dc3545';
      case 'em_dia': return '#28a745';
      case 'pausada': return '#6c757d';
      default: return '#333';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Gerenciamento de Tarefas</Text>

      {carregando ? (
        <ActivityIndicator size="large" color="#007bff" style={styles.loader} />
      ) : (
        <>
          {tarefas.length === 0 && (
            <TouchableOpacity
              style={styles.initButton}
              onPress={inicializarTarefas}
            >
              <Text style={styles.buttonText}>Inicializar Tarefas Padrão</Text>
            </TouchableOpacity>
          )}

          {tarefas.map((tarefa) => (
            <View key={tarefa.id} style={styles.taskCard}>
              <View style={styles.taskHeader}>
                <Text style={styles.taskName}>{tarefa.nome}</Text>
                <Switch
                  value={!tarefa.esta_pausada}
                  onValueChange={() => alternarPausa(tarefa)}
                  trackColor={{ false: "#767577", true: "#81b0ff" }}
                  thumbColor={tarefa.esta_pausada ? "#f4f3f4" : "#f8f9fa"}
                />
              </View>

              <View style={styles.taskInfo}>
                <Text style={styles.intervalText}>
                  Intervalo: {tarefa.intervalo_dias} dia(s)
                </Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    setTarefaSelecionada(tarefa);
                    setIntervaloTemp(tarefa.intervalo_dias.toString());
                    setModalVisible(true);
                  }}
                >
                  <FontAwesome name="edit" size={20} color="#007bff" />
                </TouchableOpacity>
              </View>

              <Text style={[styles.statusText, { color: getStatusColor(tarefa.status) }]}>
                Status: {tarefa.status.charAt(0).toUpperCase() + tarefa.status.slice(1)}
              </Text>

              {tarefa.responsavel_nome && (
                <Text style={styles.responsavelText}>
                  Responsável: {tarefa.responsavel_nome}
                </Text>
              )}

              {tarefa.proxima_execucao && (
                <Text style={styles.nextExecutionText}>
                  Próxima execução: {new Date(tarefa.proxima_execucao).toLocaleDateString()}
                </Text>
              )}

              {tarefa.ultimo_responsavel && (
                <Text style={styles.lastExecutionText}>
                  Última execução: {tarefa.ultimo_responsavel} ({tarefa.ultima_execucao})
                </Text>
              )}

              <View style={styles.taskActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.historyButton]}
                  onPress={() => {
                    setTarefaSelecionada(tarefa);
                    buscarHistorico(tarefa.id);
                    setHistoricoModalVisible(true);
                  }}
                >
                  <Text style={styles.buttonText}>Histórico</Text>
                </TouchableOpacity>

                {!tarefa.esta_pausada && tarefa.responsavel_nome && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.executeButton]}
                    onPress={() => executarTarefa(tarefa)}
                  >
                    <Text style={styles.buttonText}>Marcar como Feita</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </>
      )}

      {/* Modal de Edição de Intervalo */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Editar Intervalo - {tarefaSelecionada?.nome}
            </Text>

            <TextInput
              style={styles.input}
              value={intervaloTemp}
              onChangeText={setIntervaloTemp}
              keyboardType="numeric"
              placeholder="Novo intervalo em dias"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={atualizarIntervalo}
              >
                <Text style={styles.buttonText}>Salvar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Histórico */}
      <Modal
        visible={historicoModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setHistoricoModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Histórico - {tarefaSelecionada?.nome}
            </Text>

            <ScrollView style={styles.historicoList}>
              {historico.map((execucao) => (
                <View key={execucao.id} style={styles.historicoItem}>
                  <Text style={styles.historicoText}>
                    {execucao.responsavel} - {execucao.data_execucao}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalButton, styles.closeButton]}
              onPress={() => setHistoricoModalVisible(false)}
            >
              <Text style={styles.buttonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
    color: "#333",
  },
  loader: {
    marginTop: 20,
  },
  initButton: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  taskCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  taskName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  taskInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  intervalText: {
    fontSize: 16,
    color: "#666",
  },
  statusText: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 5,
  },
  lastExecutionText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  editButton: {
    padding: 5,
  },
  taskActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
    marginHorizontal: 5,
  },
  historyButton: {
    backgroundColor: "#6c757d",
  },
  executeButton: {
    backgroundColor: "#28a745",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    width: "80%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 4,
    alignItems: "center",
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: "#28a745",
  },
  cancelButton: {
    backgroundColor: "#dc3545",
  },
  closeButton: {
    backgroundColor: "#6c757d",
    marginTop: 10,
  },
  historicoList: {
    maxHeight: 200,
    marginBottom: 10,
  },
  historicoItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  historicoText: {
    fontSize: 14,
    color: "#333",
  },
  responsavelText: {
    fontSize: 16,
    color: "#007bff",
    fontWeight: "500",
    marginBottom: 5,
  },
  nextExecutionText: {
    fontSize: 14,
    color: "#28a745",
    marginBottom: 5,
  },
});

export default Tasks;
