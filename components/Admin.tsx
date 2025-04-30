import { useState, useEffect, useContext } from "react";
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
  ActivityIndicator,
  Platform,
} from "react-native";
import axios from "axios";
import { ScrollView } from "react-native-gesture-handler";
import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import { Picker } from "@react-native-picker/picker";
import { API_URL, API_CONFIG } from "../config";
// Usando expo-document-picker para consistência com o resto do app
import * as DocumentPicker from "expo-document-picker";
// Importar bibliotecas para visualização de documentos
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import { ThemeContext } from "../ThemeContext";

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
  // Usar o contexto de tema global
  const { isDarkMode, toggleTheme, theme } = useContext(ThemeContext);

  const [taskFrequency, setTaskFrequency] = useState(0);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [birthdayInput, setBirthdayInput] = useState("");
  const [departmentInput, setDepartmentInput] = useState("");
  const [laundryDayInput, setLaundryDayInput] = useState("");
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    departamento: "",
    dia_lavanderia: "",
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
  const [isDocumentosModalVisible, setIsDocumentosModalVisible] =
    useState(false);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Carregar pessoas quando o componente montar
  useEffect(() => {
    buscarPessoas();
    buscarFeriados();
    carregarDocumentos();
  }, []);

  // Sincronizar estados de pessoas
  useEffect(() => {
    // Ordenar as pessoas pela coluna 'ordem' antes de atualizar o estado
    const pessoasOrdenadas = [...pessoas].sort((a, b) => {
      // Se a ordem não estiver definida, usar um valor alto para colocar no final
      const ordemA = a.ordem || 9999;
      const ordemB = b.ordem || 9999;
      return ordemA - ordemB;
    });
    setPessoasOrdenadas(pessoasOrdenadas);
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

  // Função para alternar o tema usando o contexto global
  const handleToggleTheme = () => {
    toggleTheme();
    Alert.alert(
      "Tema Alterado",
      isDarkMode ? "Tema Claro Ativado!" : "Tema Escuro Ativado!"
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
      // Enviar para o servidor
      await axios.post(`${API_URL}/departamentos`, {
        name: selectedUser.name,
        departamento: department,
      });

      // Se o usuário atual for o que está sendo modificado, atualizar o AsyncStorage
      const userId = await AsyncStorage.getItem("userId");
      if (userId && selectedUser.id === parseInt(userId)) {
        await AsyncStorage.setItem("departamento", department);
        console.log(
          `Departamento do usuário atualizado no AsyncStorage: ${department}`
        );
      }

      Alert.alert("Sucesso", `Departamento definido como ${department}.`);
      setIsModalVisible(false);
    } catch (error) {
      console.error("Erro ao definir departamento:", error);
      Alert.alert("Erro", "Não foi possível definir o departamento.");
    }
  };

  const handleSetLaundryDay = async (day) => {
    try {
      // Enviar para o servidor
      await axios.post(`${API_URL}/dia-lavanderia`, {
        name: selectedUser.name,
        dia_lavanderia: day,
      });

      // Se o usuário atual for o que está sendo modificado, atualizar o AsyncStorage
      const userId = await AsyncStorage.getItem("userId");
      if (userId && selectedUser.id === parseInt(userId)) {
        await AsyncStorage.setItem("diaLavanderia", day);
        console.log(
          `Dia de lavanderia do usuário atualizado no AsyncStorage: ${day}`
        );
      }

      Alert.alert("Sucesso", `Dia de lavar roupa definido como ${day}.`);
      setIsModalVisible(false);
    } catch (error) {
      console.error("Erro ao definir dia de lavar roupa:", error);
      Alert.alert("Erro", "Não foi possível definir o dia de lavar roupa.");
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
      const laundryDay = await AsyncStorage.getItem("diaLavanderia");

      if (email && name) {
        setUserData({
          email,
          name,
          departamento: department || "",
          dia_lavanderia: laundryDay || "",
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

  // Carregar documentos quando abrir o modal
  useEffect(() => {
    if (isDocumentosModalVisible) {
      carregarDocumentos();
    }
  }, [isDocumentosModalVisible]);

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

  // Função para selecionar documentos
  const selecionarDocumentos = async () => {
    // Verifica se está rodando na web
    if (Platform.OS === "web") {
      Alert.alert(
        "Funcionalidade limitada",
        "O upload de documentos só está disponível em dispositivos móveis. Por favor, teste esta funcionalidade no aplicativo móvel."
      );
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-powerpoint",
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "image/*",
        ],
        multiple: true,
      });

      if (result.assets && result.assets.length > 0) {
        uploadDocumentos(result.assets);
      }
    } catch (err) {
      console.error("Erro ao selecionar documento:", err);
      Alert.alert("Erro", "Não foi possível selecionar o documento.");
    }
  };

  // Função para fazer upload de documentos - versão simplificada
  const uploadDocumentos = async (arquivos) => {
    // Verifica se está rodando na web
    if (Platform.OS === "web") {
      Alert.alert(
        "Funcionalidade limitada",
        "O upload de documentos só está disponível em dispositivos móveis. Por favor, teste esta funcionalidade no aplicativo móvel."
      );
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // Obter ID do usuário atual
      const userId = await AsyncStorage.getItem("userId");
      const userName = await AsyncStorage.getItem("userName");

      if (!userId || !userName) {
        Alert.alert("Erro", "Não foi possível identificar o usuário.");
        setIsUploading(false);
        return;
      }

      // Criar novos documentos a partir dos arquivos selecionados
      const novosDocumentos = [];
      for (let i = 0; i < arquivos.length; i++) {
        const arquivo = arquivos[i];

        novosDocumentos.push({
          id: Date.now() + i,
          nome: arquivo.name,
          tipo: arquivo.mimeType || "application/octet-stream",
          tamanho: arquivo.size,
          uri: arquivo.uri,
          dataUpload: new Date().toISOString(),
        });

        // Atualizar progresso
        setUploadProgress(Math.round(((i + 1) / arquivos.length) * 100));
      }

      // Atualizar lista de documentos
      setDocumentos([...documentos, ...novosDocumentos]);

      // Salvar lista de documentos no AsyncStorage com uma chave global
      const todosDocumentos = [...documentos, ...novosDocumentos];
      await AsyncStorage.setItem(
        `documentos_${userId}`,
        JSON.stringify(todosDocumentos)
      );

      // Também salvar em uma chave global para persistência entre sessões
      await AsyncStorage.setItem(
        "todos_documentos",
        JSON.stringify(todosDocumentos)
      );

      Alert.alert("Sucesso", "Documentos enviados com sucesso!");
    } catch (error) {
      console.error("Erro ao fazer upload de documentos:", error);
      Alert.alert("Erro", "Não foi possível fazer o upload dos documentos.");
    } finally {
      setIsUploading(false);
    }
  };

  // Função para carregar documentos
  const carregarDocumentos = async () => {
    try {
      // Primeiro, tentar carregar da chave global
      const todosDocumentosString = await AsyncStorage.getItem(
        "todos_documentos"
      );

      if (todosDocumentosString) {
        setDocumentos(JSON.parse(todosDocumentosString));
        return;
      }

      // Se não encontrar na chave global, tentar carregar da chave do usuário
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) return;

      const documentosString = await AsyncStorage.getItem(
        `documentos_${userId}`
      );
      if (documentosString) {
        const docs = JSON.parse(documentosString);
        setDocumentos(docs);

        // Atualizar também a chave global
        await AsyncStorage.setItem("todos_documentos", JSON.stringify(docs));
      }
    } catch (error) {
      console.error("Erro ao carregar documentos:", error);
    }
  };

  // Função para excluir documento - versão simplificada
  const excluirDocumento = async (documento) => {
    // Verifica se está rodando na web
    if (Platform.OS === "web") {
      Alert.alert(
        "Funcionalidade limitada",
        "A exclusão de documentos só está disponível em dispositivos móveis. Por favor, teste esta funcionalidade no aplicativo móvel."
      );
      return;
    }

    try {
      // Atualizar lista de documentos
      const novosDocumentos = documentos.filter(
        (doc) => doc.id !== documento.id
      );
      setDocumentos(novosDocumentos);

      // Atualizar AsyncStorage
      const userId = await AsyncStorage.getItem("userId");
      if (userId) {
        await AsyncStorage.setItem(
          `documentos_${userId}`,
          JSON.stringify(novosDocumentos)
        );

        // Também atualizar a chave global
        await AsyncStorage.setItem(
          "todos_documentos",
          JSON.stringify(novosDocumentos)
        );
      }

      Alert.alert("Sucesso", "Documento excluído com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir documento:", error);
      Alert.alert("Erro", "Não foi possível excluir o documento.");
    }
  };

  // Função para abrir documento com suporte a diferentes tipos de arquivos
  const abrirDocumento = async (documento) => {
    // Verifica se está rodando na web
    if (Platform.OS === "web") {
      Alert.alert(
        "Funcionalidade limitada",
        "A visualização de documentos só está disponível em dispositivos móveis. Por favor, teste esta funcionalidade no aplicativo móvel."
      );
      return;
    }

    try {
      // Verificar se o documento tem uma URI
      if (!documento.uri) {
        Alert.alert("Erro", "O documento não possui uma URI válida.");
        return;
      }

      // Mostrar informações do documento
      console.log("Abrindo documento:", documento);

      if (Platform.OS === "android") {
        // Em Android, podemos usar o IntentLauncher
        try {
          const contentUri = await FileSystem.getContentUriAsync(documento.uri);
          await IntentLauncher.startActivityAsync(
            "android.intent.action.VIEW",
            {
              data: contentUri,
              flags: 1,
              type: documento.tipo || "application/octet-stream",
            }
          );
        } catch (intentError) {
          console.error("Erro ao abrir com intent:", intentError);
          Alert.alert(
            "Informação",
            `Não foi possível abrir o documento automaticamente.\n\nDocumento: ${documento.nome}\nTipo: ${documento.tipo}\nTamanho: ${documento.tamanho} bytes`
          );
        }
      } else if (Platform.OS === "ios") {
        // Em iOS, podemos usar o Sharing para abrir
        try {
          await Sharing.shareAsync(documento.uri, {
            UTI: getUTIForFileType(documento.tipo),
            mimeType: documento.tipo || "application/octet-stream",
            dialogTitle: `Abrir ${documento.nome}`,
          });
        } catch (shareError) {
          console.error("Erro ao abrir com sharing:", shareError);
          Alert.alert(
            "Informação",
            `Não foi possível abrir o documento automaticamente.\n\nDocumento: ${documento.nome}\nTipo: ${documento.tipo}\nTamanho: ${documento.tamanho} bytes`
          );
        }
      } else {
        // Fallback para outros casos
        Alert.alert(
          "Informação",
          `Documento: ${documento.nome}\nTipo: ${documento.tipo}\nTamanho: ${documento.tamanho} bytes\n\nNão foi possível abrir o documento automaticamente.`
        );
      }
    } catch (error) {
      console.error("Erro ao abrir documento:", error);
      Alert.alert("Erro", "Não foi possível abrir o documento.");
    }
  };

  // Função para compartilhar documento
  const compartilharDocumento = async (documento) => {
    // Verifica se está rodando na web
    if (Platform.OS === "web") {
      Alert.alert(
        "Funcionalidade limitada",
        "O compartilhamento de documentos só está disponível em dispositivos móveis. Por favor, teste esta funcionalidade no aplicativo móvel."
      );
      return;
    }

    try {
      // Verificar se o documento tem uma URI
      if (!documento.uri) {
        Alert.alert("Erro", "O documento não possui uma URI válida.");
        return;
      }

      // Verificar se o compartilhamento está disponível
      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        // Usar o sistema de compartilhamento
        await Sharing.shareAsync(documento.uri, {
          UTI: getUTIForFileType(documento.tipo),
          mimeType: documento.tipo || "application/octet-stream",
          dialogTitle: `Compartilhar ${documento.nome}`,
        });
      } else {
        Alert.alert(
          "Erro",
          "O compartilhamento não está disponível neste dispositivo."
        );
      }
    } catch (error) {
      console.error("Erro ao compartilhar documento:", error);
      Alert.alert("Erro", "Não foi possível compartilhar o documento.");
    }
  };

  // Função para baixar documento
  const baixarDocumento = async (documento) => {
    // Verifica se está rodando na web
    if (Platform.OS === "web") {
      Alert.alert(
        "Funcionalidade limitada",
        "O download de documentos só está disponível em dispositivos móveis. Por favor, teste esta funcionalidade no aplicativo móvel."
      );
      return;
    }

    try {
      // Verificar se o documento tem uma URI
      if (!documento.uri) {
        Alert.alert("Erro", "O documento não possui uma URI válida.");
        return;
      }

      // No caso de dispositivos móveis, o documento já está no dispositivo
      // Podemos apenas mostrar onde ele está armazenado
      Alert.alert(
        "Informação",
        `O documento já está armazenado no seu dispositivo.\n\nNome: ${documento.nome}\nLocalização: ${documento.uri}`
      );

      // Alternativamente, podemos copiar o arquivo para a pasta de Downloads
      // Isso requer permissões adicionais e varia entre plataformas
      // Por simplicidade, apenas informamos que o arquivo já está no dispositivo
    } catch (error) {
      console.error("Erro ao baixar documento:", error);
      Alert.alert("Erro", "Não foi possível baixar o documento.");
    }
  };

  // Função auxiliar para obter o UTI (Uniform Type Identifier) para iOS
  const getUTIForFileType = (mimeType) => {
    // Mapeamento de tipos MIME para UTIs do iOS
    const mimeToUTI = {
      "application/pdf": "com.adobe.pdf",
      "application/msword": "com.microsoft.word.doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "com.microsoft.word.docx",
      "application/vnd.ms-excel": "com.microsoft.excel.xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "com.microsoft.excel.xlsx",
      "application/vnd.ms-powerpoint": "com.microsoft.powerpoint.ppt",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        "com.microsoft.powerpoint.pptx",
      "image/jpeg": "public.jpeg",
      "image/png": "public.png",
      "image/gif": "com.compuserve.gif",
      "text/plain": "public.plain-text",
    };

    return mimeToUTI[mimeType] || "public.data";
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>Administração</Text>
      <ScrollView
        style={[styles.content, { backgroundColor: theme.background }]}
        showsVerticalScrollIndicator={true}
      >
        {/* Seção: Dados Pessoais */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.panel,
              borderColor: theme.border,
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            📋 Dados Pessoais
          </Text>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.accent || "#007bff" },
            ]}
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
          <View
            style={[
              styles.profileModalContainer,
              { backgroundColor: "rgba(0,0,0,0.5)" },
            ]}
          >
            <View
              style={[
                styles.profileModalContent,
                {
                  backgroundColor: theme.panel,
                  borderColor: theme.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Dados Pessoais
              </Text>

              {/* Informações do Usuário */}
              <View style={styles.infoContainer}>
                <Text style={[styles.label, { color: theme.text }]}>Nome:</Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {userData.name}
                </Text>

                <Text style={[styles.label, { color: theme.text }]}>
                  Email:
                </Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {userData.email}
                </Text>

                <Text style={[styles.label, { color: theme.text }]}>
                  Departamento:
                </Text>
                <Text style={[styles.value, { color: theme.text }]}>
                  {userData.departamento}
                </Text>
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
                  style={[
                    styles.actionButton,
                    { backgroundColor: "#dc3545" }, // Cor vermelha fixa para o botão de fechar
                  ]}
                  onPress={() => setIsProfileModalVisible(false)}
                >
                  <Text style={styles.buttonText}>Fechar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Seção: Temas */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.panel,
              borderColor: theme.border,
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            🎨 Tema
          </Text>
          <View style={styles.themeSwitcher}>
            <Text style={[styles.themeText, { color: theme.text }]}>
              {isDarkMode ? "Modo Escuro" : "Modo Claro"}
            </Text>
            <Switch
              value={isDarkMode}
              onValueChange={handleToggleTheme}
              thumbColor={isDarkMode ? "#f4f3f4" : "#f8f9fa"}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
            />
          </View>
        </View>

        {/* Seção: Documentos */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.panel,
              borderColor: theme.border,
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            📁 Documentos
          </Text>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.accent || "#007bff" },
            ]}
            onPress={() => setIsDocumentosModalVisible(true)}
          >
            <Text style={styles.buttonText}>Gerenciar Documentos</Text>
          </TouchableOpacity>
        </View>

        {/* Modal de Gerenciamento de Documentos */}
        <Modal
          visible={isDocumentosModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsDocumentosModalVisible(false)}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: "rgba(0,0,0,0.5)" },
            ]}
          >
            <View
              style={[
                styles.modalContent,
                {
                  maxHeight: "90%",
                  backgroundColor: theme.panel,
                  borderColor: theme.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Gerenciamento de Documentos
              </Text>

              {Platform.OS === "web" ? (
                <View style={styles.webMessageContainer}>
                  <FontAwesome
                    name="info-circle"
                    size={40}
                    color="#007bff"
                    style={{ marginBottom: 15 }}
                  />
                  <Text style={styles.webMessageTitle}>
                    Funcionalidade Limitada no Navegador
                  </Text>
                  <Text style={styles.webMessageText}>
                    O gerenciamento de documentos requer acesso ao sistema de
                    arquivos do dispositivo, o que não é possível no navegador
                    web.
                  </Text>
                  <Text style={styles.webMessageText}>
                    Para utilizar esta funcionalidade, por favor, execute o
                    aplicativo em um dispositivo móvel.
                  </Text>
                </View>
              ) : isUploading ? (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="large" color="#007bff" />
                  <Text style={styles.uploadingText}>
                    Enviando... {uploadProgress}%
                  </Text>
                </View>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.button, { marginBottom: 15 }]}
                    onPress={selecionarDocumentos}
                  >
                    <Text style={styles.buttonText}>Enviar Documentos</Text>
                  </TouchableOpacity>

                  {documentos.length > 0 ? (
                    <FlatList
                      data={documentos}
                      keyExtractor={(item) => item.id.toString()}
                      renderItem={({ item: documento }) => (
                        <View style={styles.documentoItem}>
                          <View style={styles.documentoConteudo}>
                            <View style={styles.documentoInfo}>
                              <Text style={styles.documentoNome}>
                                {documento.nome}
                              </Text>
                              <Text style={styles.documentoData}>
                                {new Date(
                                  documento.dataUpload
                                ).toLocaleDateString()}
                              </Text>
                            </View>

                            <View style={styles.documentoAcoes}>
                              {/* Botão para abrir */}
                              <TouchableOpacity
                                style={styles.documentoBotao}
                                onPress={() => abrirDocumento(documento)}
                              >
                                <FontAwesome
                                  name="eye"
                                  size={20}
                                  color="#007bff"
                                />
                              </TouchableOpacity>

                              {/* Botão para compartilhar */}
                              <TouchableOpacity
                                style={styles.documentoBotao}
                                onPress={() => compartilharDocumento(documento)}
                              >
                                <FontAwesome
                                  name="share-alt"
                                  size={20}
                                  color="#28a745"
                                />
                              </TouchableOpacity>

                              {/* Botão para excluir */}
                              <TouchableOpacity
                                style={styles.documentoBotao}
                                onPress={() => excluirDocumento(documento)}
                              >
                                <FontAwesome
                                  name="trash"
                                  size={20}
                                  color="#dc3545"
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      )}
                    />
                  ) : (
                    <Text style={styles.emptyText}>
                      Nenhum documento encontrado. Clique em "Enviar Documentos"
                      para adicionar.
                    </Text>
                  )}
                </>
              )}

              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: "#dc3545", // Cor vermelha fixa para o botão de fechar
                    marginTop: 15,
                  },
                ]}
                onPress={() => setIsDocumentosModalVisible(false)}
              >
                <Text style={styles.buttonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Seção: Gerenciar Tarefas */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.panel,
              borderColor: theme.border,
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            📋 Gerenciar Tarefas
          </Text>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.accent || "#007bff" },
            ]}
            onPress={() => setIsGerenciarTarefasVisible(true)}
          >
            <Text style={styles.buttonText}>Gerenciar Tarefas</Text>
          </TouchableOpacity>
        </View>

        {/* Seção: Gerenciar Pessoas */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.panel,
              borderColor: theme.border,
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            👥 Gerenciar Pessoas
          </Text>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.accent || "#007bff" },
            ]}
            onPress={() => setIsGerenciarPessoasVisible(true)}
          >
            <Text style={styles.buttonText}>Gerenciar Pessoas</Text>
          </TouchableOpacity>
        </View>

        {/* Lista de usuários */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.panel,
              borderColor: theme.border,
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Usuários Cadastrados
          </Text>
          <View>
            {users.map((item) => (
              <TouchableOpacity
                key={item.id.toString()}
                onPress={() => handleUserOptions(item)}
                style={[styles.userItem, { borderColor: theme.border }]}
              >
                <Text style={[styles.userText, { color: theme.text }]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Modal para opções do usuário */}
        {selectedUser && (
          <Modal visible={isModalVisible} animationType="slide">
            <View
              style={[
                styles.modalContainer,
                { backgroundColor: "rgba(0,0,0,0.5)" },
              ]}
            >
              <View
                style={[
                  styles.modalContent,
                  {
                    backgroundColor: theme.panel,
                    borderColor: theme.border,
                    borderWidth: 1,
                  },
                ]}
              >
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  Opções para {selectedUser.name}
                </Text>

                <View style={[styles.inputRow, styles.inputAniversario]}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.flexInput,
                      { backgroundColor: "#FFFFFF", color: "#000000" },
                    ]}
                    placeholder="Data de Aniversário (DD-MM-YYYY)"
                    placeholderTextColor="#666666"
                    value={birthdayInput}
                    onChangeText={handleDateChange}
                    keyboardType="numeric"
                    maxLength={10}
                  />
                  <TouchableOpacity
                    style={[styles.smallButton, { marginBottom: 10 }]}
                    onPress={() => handleSetBirthday(birthdayInput)}
                  >
                    <Text style={styles.buttonText}>Enviar</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputRow}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.flexInput,
                      { backgroundColor: "#FFFFFF", color: "#000000" },
                    ]}
                    placeholder="Departamento"
                    placeholderTextColor="#666666"
                    value={departmentInput}
                    onChangeText={setDepartmentInput}
                  />
                  <TouchableOpacity
                    style={[styles.smallButton, { marginBottom: 11 }]}
                    onPress={() => handleSetDepartment(departmentInput)}
                  >
                    <Text style={styles.buttonText}>Enviar</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.pickerContainer, styles.flexInput]}>
                    <Picker
                      selectedValue={laundryDayInput}
                      onValueChange={(itemValue) =>
                        setLaundryDayInput(itemValue)
                      }
                      style={[
                        styles.picker,
                        {
                          backgroundColor: "#FFFFFF",
                          color: "#000000",
                        },
                      ]}
                      dropdownIconColor="#000000"
                    >
                      <Picker.Item
                        label="Dia lavar roupa"
                        value=""
                        color="#000000"
                      />
                      <Picker.Item
                        label="Segunda-feira"
                        value="Segunda-feira"
                        color="#000000"
                      />
                      <Picker.Item
                        label="Terça-feira"
                        value="Terça-feira"
                        color="#000000"
                      />
                      <Picker.Item
                        label="Quarta-feira"
                        value="Quarta-feira"
                        color="#000000"
                      />
                      <Picker.Item
                        label="Quinta-feira"
                        value="Quinta-feira"
                        color="#000000"
                      />
                      <Picker.Item
                        label="Sexta-feira"
                        value="Sexta-feira"
                        color="#000000"
                      />
                      <Picker.Item
                        label="Sábado"
                        value="Sábado"
                        color="#000000"
                      />
                      <Picker.Item
                        label="Domingo"
                        value="Domingo"
                        color="#000000"
                      />
                    </Picker>
                  </View>
                  <TouchableOpacity
                    style={[styles.smallButton, { marginBottom: 12 }]}
                    onPress={() => handleSetLaundryDay(laundryDayInput)}
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
                  style={[
                    styles.button,
                    { backgroundColor: "#007bff" }, // Cor azul para o botão de fechar
                  ]}
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
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.panel,
              borderColor: theme.border,
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            👥 Lista de Pessoas
          </Text>

          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: theme.text }]}>
              Pessoas Cadastradas
            </Text>
            <TouchableOpacity
              style={[
                styles.smallButton,
                isOrdenacaoAtiva && styles.activeButton,
                { backgroundColor: theme.accent || "#007bff" },
              ]}
              onPress={() => setIsOrdenacaoAtiva(!isOrdenacaoAtiva)}
            >
              <Text style={styles.buttonText}>
                {isOrdenacaoAtiva ? "Salvar Ordem" : "Reordenar"}
              </Text>
            </TouchableOpacity>
          </View>

          <View>
            {(isOrdenacaoAtiva ? pessoasOrdenadas : pessoas).map(
              (item, index) => (
                <View
                  key={item.id.toString()}
                  style={[
                    styles.pessoaItem,
                    {
                      borderColor: theme.border,
                      borderWidth: 1,
                      backgroundColor: theme.panel,
                    },
                  ]}
                >
                  <View style={styles.pessoaInfo}>
                    <Text style={[styles.pessoaNome, { color: "#F5F5F5" }]}>
                      {item.name}
                    </Text>
                    {item.departamento && (
                      <Text
                        style={[
                          styles.pessoaDepartamento,
                          { color: "#F5F5F5" },
                        ]}
                      >
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
                          color={
                            index === 0
                              ? theme.textSecondary
                              : theme.accent || "#007bff"
                          }
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
                              ? theme.textSecondary
                              : theme.accent || "#007bff"
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )
            )}
          </View>
        </View>

        {/* Modal de Gerenciamento de Tarefas */}
        <Modal
          visible={isGerenciarTarefasVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsGerenciarTarefasVisible(false)}
        >
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: "rgba(0,0,0,0.5)" },
            ]}
          >
            <View
              style={[
                styles.modalContent,
                {
                  maxHeight: "90%",
                  backgroundColor: theme.panel,
                  borderColor: theme.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Gerenciamento de Tarefas
              </Text>

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
                style={[
                  styles.button,
                  {
                    backgroundColor: "#dc3545", // Cor vermelha para o botão de fechar
                    marginTop: 15,
                  },
                ]}
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
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: "rgba(0,0,0,0.5)" },
            ]}
          >
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: theme.panel,
                  borderColor: theme.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Nova Tarefa
              </Text>

              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: "#FFFFFF", color: "#000000" },
                ]}
                placeholder="Nome da tarefa"
                placeholderTextColor="#666666"
                value={novaTarefaNome}
                onChangeText={setNovaTarefaNome}
              />

              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: "#FFFFFF", color: "#000000" },
                ]}
                placeholder="Intervalo em dias"
                placeholderTextColor="#666666"
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
                  style={[
                    styles.modalButton,
                    { backgroundColor: "#dc3545" }, // Cor vermelha fixa para o botão de cancelar
                  ]}
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
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: "rgba(0,0,0,0.5)" },
            ]}
          >
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: theme.panel,
                  borderColor: theme.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Editar Intervalo - {tarefaSelecionada?.nome}
              </Text>

              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: "#FFFFFF", color: "#000000" },
                ]}
                value={intervaloTemp}
                onChangeText={setIntervaloTemp}
                keyboardType="numeric"
                placeholder="Novo intervalo em dias"
                placeholderTextColor="#666666"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={atualizarIntervalo}
                >
                  <Text style={styles.buttonText}>Salvar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    { backgroundColor: "#dc3545" }, // Cor vermelha fixa para o botão de cancelar
                  ]}
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
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: "rgba(0,0,0,0.5)" },
            ]}
          >
            <View
              style={[
                styles.modalContent,
                {
                  maxHeight: "90%",
                  backgroundColor: theme.panel,
                  borderColor: theme.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Gerenciamento de Pessoas
              </Text>

              <ScrollView>
                {pessoas.map((pessoa) => (
                  <View
                    key={pessoa.id}
                    style={[
                      styles.pessoaItem,
                      {
                        borderColor: theme.border,
                        borderWidth: 1,
                        backgroundColor: theme.panel,
                      },
                    ]}
                  >
                    <View style={styles.pessoaInfo}>
                      <Text style={[styles.pessoaNome, { color: "#F5F5F5" }]}>
                        {pessoa.name}
                      </Text>
                      {pessoa.departamento && (
                        <Text
                          style={[
                            styles.pessoaDepartamento,
                            { color: "#F5F5F5" },
                          ]}
                        >
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
                style={[
                  styles.button,
                  {
                    backgroundColor: "#007bff", // Cor azul para o botão de fechar
                    marginTop: 15,
                  },
                ]}
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
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: "rgba(0,0,0,0.5)" },
            ]}
          >
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: theme.panel,
                  borderColor: theme.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Registrar Retorno - {pessoaSelecionada?.name}
              </Text>

              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: "#FFFFFF", color: "#000000" },
                ]}
                placeholder="Data de Retorno (DD-MM-YYYY)"
                placeholderTextColor="#666666"
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
                  style={[
                    styles.modalButton,
                    { backgroundColor: "#dc3545" }, // Cor vermelha fixa para o botão de cancelar
                  ]}
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
          <View
            style={[
              styles.modalContainer,
              { backgroundColor: "rgba(0,0,0,0.5)" },
            ]}
          >
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: theme.panel,
                  borderColor: theme.border,
                  borderWidth: 1,
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Reatribuir Tarefa: {tarefaParaReatribuir?.nome}
              </Text>

              <Text style={[styles.label, { color: theme.text }]}>
                Selecione o novo responsável:
              </Text>
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
                        { color: theme.text },
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
                  style={[
                    styles.modalButton,
                    { backgroundColor: "#dc3545" }, // Cor vermelha fixa para o botão de cancelar
                  ]}
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
  inputAniversario: {
    marginTop: 10,
    marginBottom: -1,
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
    borderWidth: 1,
    width: 50,
    height: 55,
    padding: 0,
    borderColor: "#777",
    borderRadius: 4,
    marginTop: -10,
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
    marginBottom: 2,
    marginTop: -10,
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
    padding: 10,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
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
  documentoItem: {
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
  documentoConteudo: {
    width: "100%",
  },
  documentoInfo: {
    marginBottom: 10,
  },
  documentoNome: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  documentoData: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  documentoAcoes: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  documentoBotao: {
    padding: 5,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
  },
  documentoBotaoTexto: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
    color: "#666",
  },
  uploadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  uploadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    padding: 20,
  },
  webMessageContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 10,
    marginVertical: 20,
  },
  webMessageTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    textAlign: "center",
  },
  webMessageText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 10,
  },
  flatListContainer: {
    height: 200,
    marginBottom: 10,
  },
});

export default Admin;
