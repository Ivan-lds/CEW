import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  FlatList,
  TouchableOpacity,
  Switch,
  Modal,
} from "react-native";
import axios from "axios";
import { ScrollView } from "react-native-gesture-handler";
import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { API_URL, API_CONFIG } from "../config";

interface Tarefa {
  id: number;
  nome: string;
  intervalo_dias: number;
  responsavel_id: number | null;
  responsavel_nome: string | null;
  esta_pausada: boolean;
  proxima_execucao: string | null;
  data_execucao: string | null;
  ultimo_responsavel: string | null;
  ultimo_responsavel_id: number | null;
  tem_feriado_hoje: boolean;
  status: "pendente" | "em_dia" | "pausada";
}

const Admin = ({ navigation }: { navigation: any }) => {
  const [taskFrequency, setTaskFrequency] = useState(0);
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [birthdayInput, setBirthdayInput] = useState("");
  const [departmentInput, setDepartmentInput] = useState("");
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    departamento: "",
  });
  const [isGerenciarTarefasVisible, setIsGerenciarTarefasVisible] =
    useState(false);
  const [feriados, setFeriados] = useState([]);
  const [novoFeriado, setNovoFeriado] = useState({ data: "", tarefa_id: null });
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [tarefaSelecionada, setTarefaSelecionada] = useState<Tarefa | null>(
    null
  );
  const [intervaloTemp, setIntervaloTemp] = useState("");
  const [editarIntervaloVisible, setEditarIntervaloVisible] = useState(false);
  const [novaTarefaVisible, setNovaTarefaVisible] = useState(false);
  const [novaTarefaNome, setNovaTarefaNome] = useState("");
  const [novaTarefaIntervalo, setNovaTarefaIntervalo] = useState("");
  const [isGerenciarPessoasVisible, setIsGerenciarPessoasVisible] =
    useState(false);
  const [pessoas, setPessoas] = useState<any[]>([]);
  const [pessoaSelecionada, setPessoaSelecionada] = useState<any>(null);
  const [diasViagem, setDiasViagem] = useState("");
  const [dataRetorno, setDataRetorno] = useState("");
  const [isRetornoModalVisible, setIsRetornoModalVisible] = useState(false);
  const [viagemAtual, setViagemAtual] = useState<any>(null);
  const [pessoasOrdenadas, setPessoasOrdenadas] = useState<any[]>([]);
  const [isOrdenacaoAtiva, setIsOrdenacaoAtiva] = useState(false);
  const [isReatribuirModalVisible, setIsReatribuirModalVisible] =
    useState(false);
  const [tarefaParaReatribuir, setTarefaParaReatribuir] =
    useState<Tarefa | null>(null);
  const [usuariosDisponiveis, setUsuariosDisponiveis] = useState<any[]>([]);
  const [novoResponsavelId, setNovoResponsavelId] = useState<number | null>(
    null
  );

  // Carregar pessoas quando o componente montar
  useEffect(() => {
    buscarPessoas();
    buscarFeriados();
  }, []);

  // Sincronizar estados de pessoas
  useEffect(() => {
    setPessoasOrdenadas(pessoas);
  }, [pessoas]);

  // Função para buscar usuários do banco de dados
  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`, API_CONFIG); // Ajuste o endpoint conforme necessário
      setUsers(response.data);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      Alert.alert("Erro", "Não foi possível carregar os usuários.");
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${API_URL}/user-data`, {
        params: {
          email: userData.email,
        },
      });

      if (response.data.success) {
        setUserData(response.data.user);
      }
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
    }
  };

  // Funções de tarefas
  const handleSetTaskFrequency = (frequency) => {
    if (!frequency || frequency <= 0) {
      Alert.alert("Erro", "Defina um número de dias válido.");
      return;
    }
    setTaskFrequency(frequency);
    Alert.alert("Sucesso", `Tarefas agora ocorrerão a cada ${frequency} dias.`);
  };

  // Funções de tema
  const toggleTheme = () => {
    setIsDarkTheme((prev) => !prev);
    Alert.alert(
      "Tema Alterado",
      isDarkTheme ? "Tema Claro Ativado!" : "Tema Escuro Ativado!"
    );
  };

  // Funções para interagir com usuários
  const handleUserOptions = (user) => {
    setSelectedUser(user);
    setIsModalVisible(true);
  };

  const handleSetAdmin = async (role) => {
    try {
      await axios.post(`${API_URL}/transfer-admin`, {
        newAdminId: selectedUser.name,
        role: role,
      });
      Alert.alert("Sucesso", `${selectedUser.name} agora é ${role}.`);
      setIsModalVisible(false);
    } catch (error) {
      console.error("Erro ao definir role:", error);
      Alert.alert("Erro", "Não foi possível definir o role do usuário.");
    }
  };

  const convertDateToDatabaseFormat = (date) => {
    console.log("convertDateToDatabaseFormat - Input:", date);

    // Verifica se a data está no formato correto (dd-mm-yyyy)
    if (!/^\d{2}-\d{2}-\d{4}$/.test(date)) {
      console.log("Formato inválido detectado:", date);
      throw new Error("Data em formato inválido. Use DD-MM-YYYY");
    }

    // Converte dd-mm-yyyy para yyyy-mm-dd
    const [day, month, year] = date.split("-");
    const result = `${year}-${month}-${day}`;
    console.log("convertDateToDatabaseFormat - Output:", result);
    return result;
  };

  const handleSetBirthday = async (date) => {
    try {
      const formattedDate = convertDateToDatabaseFormat(date);
      await axios.post(`${API_URL}/aniversarios`, {
        name: selectedUser.name,
        date: formattedDate,
      });
      Alert.alert("Sucesso", `Aniversário definido para ${date}.`);
      setIsModalVisible(false);
    } catch (error) {
      console.error("Erro ao definir aniversário:", error);
      Alert.alert("Erro", "Não foi possível definir o aniversário.");
    }
  };

  const handleSetDepartment = async (department) => {
    try {
      await axios.post(`${API_URL}/departamentos`, {
        name: selectedUser.name,
        departamento: department,
      });
      Alert.alert("Sucesso", `Departamento definido como ${department}.`);
      setIsModalVisible(false);
    } catch (error) {
      console.error("Erro ao definir departamento:", error);
      Alert.alert("Erro", "Não foi possível definir o departamento.");
    }
  };

  const handleRemoveUser = async () => {
    try {
      console.log("Iniciando remoção do usuário:", selectedUser.name);
      const response = await axios.post(`${API_URL}/remove-user`, {
        name: selectedUser.name,
      });

      if (response.data.success) {
        console.log("Usuário removido com sucesso:", selectedUser.name);
        Alert.alert("Sucesso", `${selectedUser.name} foi removido.`);
        setUsers(users.filter((user) => user.name !== selectedUser.name));
        setIsModalVisible(false);
      } else {
        console.error("Erro na resposta do servidor:", response.data);
        Alert.alert(
          "Erro",
          response.data.message || "Não foi possível remover o usuário."
        );
      }
    } catch (error) {
      console.error("Erro ao remover usuário:", error);
      console.error("Detalhes do erro:", error.response?.data);
      Alert.alert(
        "Erro",
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Não foi possível remover o usuário."
      );
    }
  };

  const formatDate = (text) => {
    // Remove todos os caracteres não numéricos
    const numbers = text.replace(/\D/g, "");

    // Limita a 8 dígitos (ddmmyyyy)
    const limited = numbers.slice(0, 8);

    // Formata como dd-mm-yyyy
    let formatted = "";
    if (limited.length > 0) {
      formatted += limited.slice(0, 2);
      if (limited.length > 2) {
        formatted += "-" + limited.slice(2, 4);
        if (limited.length > 4) {
          formatted += "-" + limited.slice(4, 8);
        }
      }
    }

    return formatted;
  };

  const handleDateChange = (text) => {
    const formatted = formatDate(text);
    setBirthdayInput(formatted);
  };

  // Buscar tarefas
  const buscarFeriados = async () => {
    try {
      const response = await axios.get(`${API_URL}/feriados`, API_CONFIG);
      if (response.data.success) {
        setFeriados(response.data.feriados);
      }
    } catch (error) {
      console.error("Erro ao buscar feriados:", error);
      Alert.alert("Erro", "Não foi possível carregar os feriados.");
    }
  };

  const adicionarFeriado = async () => {
    if (!novoFeriado.data || !novoFeriado.tarefa_id) {
      Alert.alert("Erro", "Por favor, selecione uma data e uma tarefa.");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/feriados`, novoFeriado);
      if (response.data.success) {
        Alert.alert("Sucesso", "Feriado cadastrado com sucesso!");
        setNovoFeriado({ data: "", tarefa_id: null });
        buscarFeriados();
        buscarTarefas();
      }
    } catch (error) {
      console.error("Erro ao cadastrar feriado:", error);
      Alert.alert("Erro", "Não foi possível cadastrar o feriado.");
    }
  };

  const removerFeriado = async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/feriados/${id}`);
      if (response.data.success) {
        Alert.alert("Sucesso", "Feriado removido com sucesso!");
        buscarFeriados();
        buscarTarefas();
      }
    } catch (error) {
      console.error("Erro ao remover feriado:", error);
      Alert.alert("Erro", "Não foi possível remover o feriado.");
    }
  };

  const buscarTarefas = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/tarefas/agendamento`,
        API_CONFIG
      );
      if (response.data.success) {
        setTarefas(response.data.tarefas);
      }
    } catch (error) {
      console.error("Erro ao buscar tarefas:", error);
      Alert.alert("Erro", "Não foi possível carregar as tarefas.");
    }
  };

  // Criar nova tarefa
  const criarTarefa = async () => {
    try {
      console.log("Criando tarefa:", {
        nome: novaTarefaNome,
        intervalo: novaTarefaIntervalo,
      });
      const response = await axios.post(`${API_URL}/tarefas`, {
        nome: novaTarefaNome,
        intervalo_dias: parseInt(novaTarefaIntervalo),
      });
      console.log("Resposta da criação:", response.data);

      if (response.data.success) {
        await buscarTarefas(); // Adicione await aqui
        console.log("Tarefas após busca:", tarefas);
      }
    } catch (error) {
      console.error("Erro completo:", error);
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
        `${API_URL}/tarefas/${tarefaSelecionada.id}/intervalo`,
        { intervalo_dias: intervalo }
      );

      if (response.data.success) {
        Alert.alert("Sucesso", "Intervalo atualizado com sucesso!");
        setEditarIntervaloVisible(false);
        buscarTarefas();
      }
    } catch (error) {
      console.error("Erro ao atualizar intervalo:", error);
      Alert.alert("Erro", "Não foi possível atualizar o intervalo.");
    }
  };

  // Deletar tarefa
  const deletarTarefa = async (tarefaId: number) => {
    try {
      await axios.delete(`${API_URL}/tarefas/${tarefaId}`, API_CONFIG);
      buscarTarefas();
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
      Alert.alert("Erro", "Não foi possível excluir a tarefa.");
    }
  };

  // Alternar status de pausa da tarefa
  const alternarPausa = async (tarefa: Tarefa) => {
    try {
      const response = await axios.put(
        `${API_URL}/tarefas/${tarefa.id}/pausar`,
        { esta_pausada: !tarefa.esta_pausada }
      );
      if (response.data.success) {
        Alert.alert(
          "Sucesso",
          `Tarefa ${tarefa.esta_pausada ? "reativada" : "pausada"} com sucesso!`
        );
        buscarTarefas();
      }
    } catch (error) {
      console.error("Erro ao alternar pausa da tarefa:", error);
      Alert.alert("Erro", "Não foi possível alterar o status da tarefa.");
    }
  };

  // Função para buscar pessoas
  const buscarPessoas = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`, API_CONFIG);
      console.log("Resposta buscarPessoas:", response.data); // Log para debug
      setPessoas(response.data);
    } catch (error) {
      console.error("Erro ao buscar pessoas:", error);
      Alert.alert("Erro", "Não foi possível carregar a lista de pessoas.");
    }
  };

  const moverPessoa = async (id: number, direcao: "cima" | "baixo") => {
    const index = pessoasOrdenadas.findIndex((p) => p.id === id);
    if (index === -1) return;

    const novaLista = [...pessoasOrdenadas];
    if (direcao === "cima" && index > 0) {
      // Troca com o item anterior
      [novaLista[index], novaLista[index - 1]] = [
        novaLista[index - 1],
        novaLista[index],
      ];
    } else if (direcao === "baixo" && index < novaLista.length - 1) {
      // Troca com o próximo item
      [novaLista[index], novaLista[index + 1]] = [
        novaLista[index + 1],
        novaLista[index],
      ];
    } else {
      return; // Não pode mover mais
    }

    setPessoasOrdenadas(novaLista);
    setPessoas(novaLista); // Atualiza também o estado pessoas

    try {
      await axios.post(`${API_URL}/pessoas/reordenar`, {
        ordem: novaLista.map((pessoa) => pessoa.id),
      });
    } catch (error) {
      console.error("Erro ao reordenar pessoas:", error);
      Alert.alert("Erro", "Não foi possível salvar a nova ordem.");
    }
  };

  // Função para iniciar viagem
  const iniciarViagem = async (usuarioId: number) => {
    try {
      const response = await axios.post(`${API_URL}/viagens/iniciar`, {
        usuario_id: usuarioId,
        data_saida: new Date().toISOString().split("T")[0],
      });

      if (response.data.success) {
        Alert.alert("Sucesso", "Viagem iniciada com sucesso!");
        setViagemAtual(response.data.viagem_id);
        buscarPessoas();
      }
    } catch (error) {
      console.error("Erro ao iniciar viagem:", error);
      Alert.alert("Erro", "Não foi possível iniciar a viagem.");
    }
  };

  const formatDateForDisplay = (date: string) => {
    // Converte yyyy-mm-dd para dd-mm-yyyy
    if (!date) return "";
    const [year, month, day] = date.split("-");
    return `${day}-${month}-${year}`;
  };

  // Função para registrar retorno
  const registrarRetorno = async () => {
    console.log("Iniciando registrarRetorno");
    console.log("pessoaSelecionada:", pessoaSelecionada);
    console.log("dataRetorno:", dataRetorno);

    if (!pessoaSelecionada) {
      Alert.alert("Erro", "Nenhuma pessoa selecionada.");
      return;
    }

    if (!dataRetorno) {
      Alert.alert("Erro", "Por favor, preencha a data de retorno.");
      return;
    }

    try {
      // Verificar se a pessoa está realmente em viagem
      if (!pessoaSelecionada.em_viagem) {
        Alert.alert("Erro", "Esta pessoa não está em viagem.");
        return;
      }

      // Verificar viagem_atual_id
      let viagemId = pessoaSelecionada.viagem_atual_id;

      // Se não tiver viagem_atual_id mas estiver em viagem, buscar a viagem atual
      if (!viagemId && pessoaSelecionada.em_viagem) {
        console.log(
          "Buscando viagem atual para o usuário:",
          pessoaSelecionada.id
        );
        try {
          const viagemResponse = await axios.get(
            `${API_URL}/viagens/atual/${pessoaSelecionada.id}`,
            API_CONFIG
          );
          if (viagemResponse.data.success) {
            viagemId = viagemResponse.data.viagem_id;
            console.log("Viagem atual encontrada:", viagemId);
          } else {
            console.log("Nenhuma viagem em andamento encontrada");
            Alert.alert("Erro", "Não foi possível identificar a viagem atual.");
            return;
          }
        } catch (error) {
          console.error("Erro ao buscar viagem atual:", error);
          Alert.alert(
            "Erro",
            "Não foi possível identificar a viagem atual. Por favor, atualize a lista de pessoas."
          );
          return;
        }
      } else if (!viagemId) {
        console.log("Dados da pessoa:", pessoaSelecionada);
        Alert.alert(
          "Erro",
          "Não foi possível identificar a viagem atual. Por favor, atualize a lista de pessoas."
        );
        return;
      }

      // Validação adicional do formato da data
      if (!/^\d{2}-\d{2}-\d{4}$/.test(dataRetorno)) {
        console.log("Formato de data inválido:", dataRetorno);
        Alert.alert("Erro", "Data inválida. Use o formato DD-MM-YYYY");
        return;
      }

      const formattedDate = convertDateToDatabaseFormat(dataRetorno);

      console.log("Preparando requisição:", {
        url: `${API_URL}/viagens/${viagemId}/retorno`,
        payload: {
          data_retorno: formattedDate,
        },
      });

      const response = await axios.post(
        `${API_URL}/viagens/${viagemId}/retorno`,
        {
          data_retorno: formattedDate,
        }
      );

      console.log("Resposta do servidor:", response.data);

      if (response.data.success) {
        console.log("Retorno registrado com sucesso");
        Alert.alert("Sucesso", "Retorno registrado com sucesso!");
        setIsRetornoModalVisible(false);
        setDataRetorno("");
        setPessoaSelecionada(null);
        buscarPessoas();
      }
    } catch (error) {
      console.error("Erro detalhado:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      const mensagemErro =
        error.response?.data?.message ||
        (error.message === "Data em formato inválido. Use DD-MM-YYYY"
          ? error.message
          : "Não foi possível registrar o retorno.");
      Alert.alert("Erro", mensagemErro);
    }
  };

  // Adiciona um useEffect para monitorar mudanças no estado das tarefas
  useEffect(() => {
    console.log(
      "Estado das tarefas atualizado:",
      tarefas.map((t) => ({
        id: t.id,
        nome: t.nome,
        tem_feriado_hoje: t.tem_feriado_hoje,
      }))
    );
  }, [tarefas]);

  useEffect(() => {
    const loadUserData = async () => {
      const email = await AsyncStorage.getItem("userEmail");
      const name = await AsyncStorage.getItem("userName");
      const department = await AsyncStorage.getItem("userDepartment");

      if (email && name) {
        setUserData({
          email,
          name,
          departamento: department || "",
        });
      }
    };
    loadUserData();
    fetchUsers();
  }, []);

  useEffect(() => {
    if (userData.email) {
      fetchUserData();
    }
  }, [userData.email]);

  // Carregar tarefas quando abrir o modal
  useEffect(() => {
    if (isGerenciarTarefasVisible) {
      buscarTarefas();
    }
  }, [isGerenciarTarefasVisible]);

  // Carregar pessoas quando abrir o modal
  useEffect(() => {
    if (isGerenciarPessoasVisible) {
      buscarPessoas();
    }
  }, [isGerenciarPessoasVisible]);

  // Função para buscar usuários disponíveis
  const buscarUsuariosDisponiveis = async () => {
    try {
      const response = await axios.get(`${API_URL}/users`, API_CONFIG);
      const usuariosAtivos = response.data.filter((user) => !user.em_viagem);
      setUsuariosDisponiveis(usuariosAtivos);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      Alert.alert("Erro", "Não foi possível carregar a lista de usuários.");
    }
  };

  // Função para reatribuir tarefa
  const reatribuirTarefa = async () => {
    if (!tarefaParaReatribuir || !novoResponsavelId) {
      Alert.alert("Erro", "Por favor, selecione um novo responsável.");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/tarefas/${tarefaParaReatribuir.id}/reatribuir`,
        { novo_responsavel_id: novoResponsavelId }
      );

      if (response.data.success) {
        Alert.alert("Sucesso", "Tarefa reatribuída com sucesso!");
        setIsReatribuirModalVisible(false);
        setTarefaParaReatribuir(null);
        setNovoResponsavelId(null);
        buscarTarefas();
      }
    } catch (error) {
      console.error("Erro ao reatribuir tarefa:", error);
      Alert.alert(
        "Erro",
        error.response?.data?.message || "Não foi possível reatribuir a tarefa."
      );
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Administração</Text>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Seção: Dados Pessoais */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Dados Pessoais</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setIsProfileModalVisible(true)}
          >
            <Text style={styles.buttonText}>Editar Perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Modal de Dados Pessoais */}
        <Modal
          visible={isProfileModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsProfileModalVisible(false)}
        >
          <View style={styles.profileModalContainer}>
            <View style={styles.profileModalContent}>
              <Text style={styles.modalTitle}>Dados Pessoais</Text>

              {/* Informações do Usuário */}
              <View style={styles.infoContainer}>
                <Text style={styles.label}>Nome:</Text>
                <Text style={styles.value}>{userData.name}</Text>

                <Text style={styles.label}>Email:</Text>
                <Text style={styles.value}>{userData.email}</Text>

                <Text style={styles.label}>Departamento:</Text>
                <Text style={styles.value}>{userData.departamento}</Text>
              </View>

              {/* Botões de Ação */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.changePasswordButton]}
                  onPress={() => {
                    setIsProfileModalVisible(false);
                    navigation.navigate("RedefinirSenha");
                  }}
                >
                  <Text style={styles.buttonText}>Alterar Senha</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.closeButton]}
                  onPress={() => setIsProfileModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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
          <TouchableOpacity
            style={[styles.button, styles.documentButton]}
            onPress={() => alert("Gerenciar Documentos")}
          >
            <Text style={styles.buttonText}>Gerenciar Documentos</Text>
          </TouchableOpacity>
        </View>

        {/* Seção: Gerenciar Tarefas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Gerenciar Tarefas</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setIsGerenciarTarefasVisible(true)}
          >
            <Text style={styles.buttonText}>Gerenciar Tarefas</Text>
          </TouchableOpacity>
        </View>

        {/* Seção: Gerenciar Pessoas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Gerenciar Pessoas</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setIsGerenciarPessoasVisible(true)}
          >
            <Text style={styles.buttonText}>Gerenciar Pessoas</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de usuários */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Usuários Cadastrados</Text>
          <FlatList
            data={users}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleUserOptions(item)}
                style={styles.userItem}
              >
                <Text style={styles.userText}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Modal para opções do usuário */}
        {selectedUser && (
          <Modal visible={isModalVisible} animationType="slide">
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  Opções para {selectedUser.name}
                </Text>

                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, styles.flexInput]}
                    placeholder="Data de Aniversário (DD-MM-YYYY)"
                    value={birthdayInput}
                    onChangeText={handleDateChange}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                  <TouchableOpacity
                    style={styles.smallButton}
                    onPress={() => handleSetBirthday(birthdayInput)}
                  >
                    <Text style={styles.buttonText}>Enviar</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputRow}>
                  <TextInput
                    style={[styles.input, styles.flexInput]}
                    placeholder="Departamento"
                    value={departmentInput}
                    onChangeText={setDepartmentInput}
                  />
                  <TouchableOpacity
                    style={styles.smallButton}
                    onPress={() => handleSetDepartment(departmentInput)}
                  >
                    <Text style={styles.buttonText}>Enviar</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.roleButtons}>
                  <TouchableOpacity
                    style={[styles.roleButton, styles.adminButton]}
                    onPress={() => handleSetAdmin("admin")}
                  >
                    <Text style={styles.roleButtonText}>
                      Definir como Admin
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.roleButton, styles.userButton]}
                    onPress={() => handleSetAdmin("user")}
                  >
                    <Text style={styles.roleButtonText}>
                      Definir como Usuário
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.button, styles.removeButton]}
                  onPress={handleRemoveUser}
                >
                  <Text style={styles.buttonText}>Remover Usuário</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.closeButton]}
                  onPress={() => {
                    setIsModalVisible(false);
                    setBirthdayInput("");
                    setDepartmentInput("");
                  }}
                >
                  <Text style={styles.buttonText}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Seção: Lista de Pessoas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Lista de Pessoas</Text>

          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Pessoas Cadastradas</Text>
            <TouchableOpacity
              style={[
                styles.smallButton,
                isOrdenacaoAtiva && styles.activeButton,
              ]}
              onPress={() => setIsOrdenacaoAtiva(!isOrdenacaoAtiva)}
            >
              <Text style={styles.buttonText}>
                {isOrdenacaoAtiva ? "Salvar Ordem" : "Reordenar"}
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={isOrdenacaoAtiva ? pessoasOrdenadas : pessoas}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => (
              <View style={styles.pessoaItem}>
                <View style={styles.pessoaInfo}>
                  <Text style={styles.pessoaNome}>{item.name}</Text>
                  {item.departamento && (
                    <Text style={styles.pessoaDepartamento}>
                      {item.departamento}
                    </Text>
                  )}
                </View>
                {isOrdenacaoAtiva && (
                  <View style={styles.setasContainer}>
                    <TouchableOpacity
                      style={[
                        styles.setaButton,
                        index === 0 && styles.setaDisabled,
                      ]}
                      onPress={() => moverPessoa(item.id, "cima")}
                      disabled={index === 0}
                    >
                      <FontAwesome
                        name="arrow-up"
                        size={20}
                        color={index === 0 ? "#ccc" : "#007bff"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.setaButton,
                        index === pessoasOrdenadas.length - 1 &&
                          styles.setaDisabled,
                      ]}
                      onPress={() => moverPessoa(item.id, "baixo")}
                      disabled={index === pessoasOrdenadas.length - 1}
                    >
                      <FontAwesome
                        name="arrow-down"
                        size={20}
                        color={
                          index === pessoasOrdenadas.length - 1
                            ? "#ccc"
                            : "#007bff"
                        }
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          />
        </View>

        {/* Modal de Gerenciamento de Tarefas */}
        <Modal
          visible={isGerenciarTarefasVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsGerenciarTarefasVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { maxHeight: "90%" }]}>
              <Text style={styles.modalTitle}>Gerenciamento de Tarefas</Text>

              <TouchableOpacity
                style={[styles.button, { marginBottom: 15 }]}
                onPress={() => setNovaTarefaVisible(true)}
              >
                <Text style={styles.buttonText}>Nova Tarefa</Text>
              </TouchableOpacity>

              <ScrollView>
                {tarefas.map((tarefa) => (
                  <View key={tarefa.id} style={styles.tarefaItem}>
                    <View style={styles.tarefaHeader}>
                      <Text style={styles.tarefaNome}>{tarefa.nome}</Text>
                      <Switch
                        value={!tarefa.esta_pausada}
                        onValueChange={() => alternarPausa(tarefa)}
                        trackColor={{ false: "#767577", true: "#81b0ff" }}
                        thumbColor={tarefa.esta_pausada ? "#f4f3f4" : "#f8f9fa"}
                      />
                    </View>

                    <View style={styles.tarefaInfo}>
                      <Text style={styles.tarefaIntervalo}>
                        Intervalo: {tarefa.intervalo_dias} dia(s)
                      </Text>
                      <View style={styles.tarefaAcoes}>
                        <TouchableOpacity
                          onPress={() => {
                            setTarefaSelecionada(tarefa);
                            setIntervaloTemp(tarefa.intervalo_dias.toString());
                            setEditarIntervaloVisible(true);
                          }}
                          style={styles.acaoButton}
                        >
                          <FontAwesome name="edit" size={20} color="#007bff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            setTarefaParaReatribuir(tarefa);
                            buscarUsuariosDisponiveis();
                            setIsReatribuirModalVisible(true);
                          }}
                          style={styles.acaoButton}
                        >
                          <FontAwesome
                            name="exchange"
                            size={20}
                            color="#28a745"
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => deletarTarefa(tarefa.id)}
                          style={styles.acaoButton}
                        >
                          <FontAwesome name="trash" size={20} color="#dc3545" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.tarefaStatus,
                        { color: tarefa.esta_pausada ? "#6c757d" : "#28a745" },
                      ]}
                    >
                      Status: {tarefa.esta_pausada ? "Pausada" : "Ativa"}
                    </Text>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.button, styles.closeButton, { marginTop: 15 }]}
                onPress={() => setIsGerenciarTarefasVisible(false)}
              >
                <Text style={styles.buttonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal de Nova Tarefa */}
        <Modal
          visible={novaTarefaVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setNovaTarefaVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nova Tarefa</Text>

              <TextInput
                style={styles.input}
                placeholder="Nome da tarefa"
                value={novaTarefaNome}
                onChangeText={setNovaTarefaNome}
              />

              <TextInput
                style={styles.input}
                placeholder="Intervalo em dias"
                value={novaTarefaIntervalo}
                onChangeText={setNovaTarefaIntervalo}
                keyboardType="numeric"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={criarTarefa}
                >
                  <Text style={styles.buttonText}>Criar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setNovaTarefaVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de Editar Intervalo */}
        <Modal
          visible={editarIntervaloVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setEditarIntervaloVisible(false)}
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
                  onPress={() => setEditarIntervaloVisible(false)}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de Gerenciamento de Pessoas */}
        <Modal
          visible={isGerenciarPessoasVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsGerenciarPessoasVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={[styles.modalContent, { maxHeight: "90%" }]}>
              <Text style={styles.modalTitle}>Gerenciamento de Pessoas</Text>

              <ScrollView>
                {pessoas.map((pessoa) => (
                  <View key={pessoa.id} style={styles.pessoaItem}>
                    <View style={styles.pessoaInfo}>
                      <Text style={styles.pessoaNome}>{pessoa.name}</Text>
                      {pessoa.departamento && (
                        <Text style={styles.pessoaDepartamento}>
                          {pessoa.departamento}
                        </Text>
                      )}
                    </View>

                    <View style={styles.pessoaAcoes}>
                      {!pessoa.em_viagem ? (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.viajarButton]}
                          onPress={() => iniciarViagem(pessoa.id)}
                        >
                          <Text style={styles.buttonText}>Iniciar Viagem</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.actionButton, styles.retornarButton]}
                          onPress={() => {
                            setPessoaSelecionada(pessoa);
                            setIsRetornoModalVisible(true);
                          }}
                        >
                          <Text style={styles.buttonText}>
                            Registrar Retorno
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={[styles.button, styles.closeButton, { marginTop: 15 }]}
                onPress={() => setIsGerenciarPessoasVisible(false)}
              >
                <Text style={styles.buttonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal de Registro de Retorno */}
        <Modal
          visible={isRetornoModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsRetornoModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Registrar Retorno - {pessoaSelecionada?.name}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Data de Retorno (DD-MM-YYYY)"
                value={dataRetorno}
                onChangeText={(text) => {
                  console.log("Input original:", text);
                  // Aplica máscara de formatação
                  const formatted = text
                    .replace(/\D/g, "") // Remove não-dígitos
                    .replace(/^(\d{2})(\d)/, "$1-$2") // Coloca hífen após dia
                    .replace(/^(\d{2})\-(\d{2})(\d)/, "$1-$2-$3") // Coloca hífen após mês
                    .substring(0, 10); // Limita a 10 caracteres
                  console.log("Input formatado:", formatted);
                  setDataRetorno(formatted);
                }}
                keyboardType="numeric"
                maxLength={10}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={registrarRetorno}
                >
                  <Text style={styles.buttonText}>Registrar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setIsRetornoModalVisible(false);
                    setDataRetorno("");
                  }}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Modal de Reatribuição */}
        <Modal
          visible={isReatribuirModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsReatribuirModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                Reatribuir Tarefa: {tarefaParaReatribuir?.nome}
              </Text>

              <Text style={styles.label}>Selecione o novo responsável:</Text>
              <ScrollView style={styles.usuariosList}>
                {usuariosDisponiveis.map((usuario) => (
                  <TouchableOpacity
                    key={usuario.id}
                    style={[
                      styles.usuarioOption,
                      novoResponsavelId === usuario.id &&
                        styles.usuarioSelected,
                    ]}
                    onPress={() => setNovoResponsavelId(usuario.id)}
                  >
                    <Text
                      style={[
                        styles.usuarioText,
                        novoResponsavelId === usuario.id &&
                          styles.usuarioTextSelected,
                      ]}
                    >
                      {usuario.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={reatribuirTarefa}
                >
                  <Text style={styles.buttonText}>Confirmar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setIsReatribuirModalVisible(false);
                    setTarefaParaReatribuir(null);
                    setNovoResponsavelId(null);
                  }}
                >
                  <Text style={styles.buttonText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  feriadosSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  feriadoForm: {
    marginBottom: 15,
  },
  pickerContainer: {
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
  },
  picker: {
    height: 50,
  },
  feriadosList: {
    maxHeight: 200,
  },
  feriadoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#fff",
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  feriadoText: {
    fontSize: 14,
    color: "#333",
  },
  removeButtonIcon: {
    padding: 5,
  },
  addButton: {
    backgroundColor: "#28a745",
    marginTop: 10,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  content: {
    marginTop: 10,
    paddingHorizontal: 10,
    paddingBottom: 20,
    height: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  section: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
  buttonTextPerfil: {
    color: "blue",
    fontWeight: "bold",
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
  userItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },
  userText: {
    fontSize: 16,
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  roleButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  flexInput: {
    flex: 1,
  },
  smallButton: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    width: 80,
    alignItems: "center",
  },
  button: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: "center",
  },
  removeButton: {
    backgroundColor: "#dc3545",
  },
  closeButton: {
    backgroundColor: "#6c757d",
  },
  roleButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: "center",
  },
  adminButton: {
    backgroundColor: "#007bff",
  },
  userButton: {
    backgroundColor: "#6c757d",
  },
  roleButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  documentButton: {
    backgroundColor: "#007bff",
  },
  // Estilos do modal de dados pessoais
  profileModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  profileModalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "90%",
    maxHeight: "80%",
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  changePhotoButton: {
    backgroundColor: "#007bff",
    padding: 8,
    borderRadius: 5,
  },
  changePhotoText: {
    color: "#fff",
    fontSize: 12,
  },
  infoContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    marginTop: 10,
  },
  value: {
    fontSize: 16,
    color: "#333",
    marginBottom: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  changePasswordButton: {
    backgroundColor: "#007bff",
  },
  tarefaItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tarefaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  tarefaNome: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  tarefaInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  tarefaIntervalo: {
    fontSize: 14,
    color: "#666",
  },
  tarefaStatus: {
    fontSize: 14,
    fontWeight: "500",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "90%",
    maxWidth: 500,
    alignSelf: "center",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
    alignItems: "center",
  },
  saveButton: {
    backgroundColor: "#007bff",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  pessoaItem: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pessoaInfo: {
    marginBottom: 10,
  },
  pessoaNome: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  pessoaDepartamento: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  pessoaAcoes: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  viajarButton: {
    backgroundColor: "#28a745",
  },
  retornarButton: {
    backgroundColor: "#007bff",
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  activeButton: {
    backgroundColor: "#28a745",
  },
  dragging: {
    opacity: 0.5,
    transform: [{ scale: 1.1 }],
    backgroundColor: "#f8f9fa",
  },
  setasContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
  },
  setaButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  setaDisabled: {
    opacity: 0.5,
  },

  tarefaAcoes: {
    flexDirection: "row",
    gap: 15,
  },
  acaoButton: {
    padding: 5,
  },

  usuariosList: {
    maxHeight: 200,
    marginVertical: 10,
  },
  usuarioOption: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  usuarioSelected: {
    backgroundColor: "#007bff",
  },
  usuarioText: {
    fontSize: 16,
    color: "#333",
  },
  usuarioTextSelected: {
    color: "#fff",
  },
  responsavelText: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
});

export default Admin;
