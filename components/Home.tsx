import React from "react";
import { useState, useEffect, useContext } from "react";
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
import LaundryGas from "./LaundryGas";
import { ThemeContext } from "../ThemeContext";

interface Notification {
  id: number;
  mensagem: string;
  departamento: string;
  remetente_id?: number;
  remetente_nome?: string;
  data_envio: string;
  lida: boolean;
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

const Home = ({ route }: { route: any }) => {
  // Usar o contexto de tema global
  const { theme, isDarkMode } = useContext(ThemeContext);

  // Verificar se há parâmetros de rota para atualizar notificações
  const refreshNotifications = route?.params?.refreshNotifications;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>("");
  const [userDepartamento, setUserDepartamento] = useState<string | null>(null);
  const [tarefasHoje, setTarefasHoje] = useState<Tarefa[]>([]);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [emViagem, setEmViagem] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [tarefaExecutando, setTarefaExecutando] = useState<number | null>(null);
  const [buscandoTarefas, setBuscandoTarefas] = useState(false);
  const [aniversarios, setAniversarios] = useState<
    {
      id: number;
      name: string;
      aniversario: string;
      aniversario_original: string;
    }[]
  >([]);
  const [diasLavanderia, setDiasLavanderia] = useState<
    {
      id: number;
      name: string;
      dia_lavanderia: string;
    }[]
  >([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);
  const navigation = useNavigation();

  // Função para formatar data no padrão dd-mm-yyyy
  const formatarData = (dataString: string): string => {
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

  // Função para formatar data no padrão dd-mm (apenas dia e mês)
  const formatarDataDiaMes = (dataString: string): string => {
    if (!dataString) return "";

    try {
      const data = new Date(dataString);
      const dia = data.getDate().toString().padStart(2, "0");
      const mes = (data.getMonth() + 1).toString().padStart(2, "0");

      return `${dia}-${mes}`;
    } catch (error) {
      console.error("Erro ao formatar data (dia-mês):", error);
      return dataString;
    }
  };

  // Função para agrupar usuários por dia da semana
  const agruparUsuariosPorDia = () => {
    // Ordem dos dias da semana começando por domingo
    const diasDaSemana = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];

    // Objeto para armazenar os usuários agrupados por dia
    const usuariosPorDia: { [key: string]: string[] } = {};

    // Inicializar todos os dias da semana com arrays vazios
    diasDaSemana.forEach((dia) => {
      usuariosPorDia[dia] = [];
    });

    // Agrupar os usuários por dia
    diasLavanderia.forEach((usuario) => {
      if (
        usuario.dia_lavanderia &&
        diasDaSemana.includes(usuario.dia_lavanderia)
      ) {
        usuariosPorDia[usuario.dia_lavanderia].push(usuario.name);
      }
    });

    return diasDaSemana.map((dia) => ({
      dia,
      usuarios: usuariosPorDia[dia],
    }));
  };

  // Função para verificar o status do aniversário (hoje, passado ou futuro)
  const verificarStatusAniversario = (
    dataAniversario: string
  ): "hoje" | "passado" | "futuro" => {
    if (!dataAniversario) return "futuro";

    try {
      // Obter a data atual
      const hoje = new Date();
      const diaAtual = hoje.getDate();
      const mesAtual = hoje.getMonth() + 1; // Janeiro é 0

      // Converter a data do aniversário para um objeto Date
      const data = new Date(dataAniversario);
      const diaAniversario = data.getDate();
      const mesAniversario = data.getMonth() + 1; // Janeiro é 0

      // Verificar se é 1º de janeiro (reinício do ano)
      // Exceção: se alguém faz aniversário em 1º de janeiro, mantém verde
      if (diaAtual === 1 && mesAtual === 1) {
        console.log(
          `Verificando aniversário em 1º de janeiro: ${diaAniversario}-${mesAniversario}`
        );

        // Se a pessoa faz aniversário em 1º de janeiro, mantém verde
        if (diaAniversario === 1 && mesAniversario === 1) {
          console.log(`Aniversário em 1º de janeiro - mantendo VERDE`);
          return "hoje";
        }

        // Para todos os outros, reinicia para futuro (azul)
        console.log(`Reiniciando status para AZUL (futuro) no início do ano`);
        return "futuro";
      }

      // Verificar se é hoje (dia atual = dia do aniversário)
      if (diaAtual === diaAniversario && mesAtual === mesAniversario) {
        console.log(
          `Aniversário é HOJE (${diaAniversario}-${mesAniversario}) - VERDE`
        );
        return "hoje";
      }

      // Verificar se já passou no ano atual
      if (
        mesAtual > mesAniversario ||
        (mesAtual === mesAniversario && diaAtual > diaAniversario)
      ) {
        console.log(
          `Aniversário já passou (${diaAniversario}-${mesAniversario}) - VERMELHO`
        );
        return "passado";
      }

      // Se não é hoje e não passou no ano atual, então é futuro
      console.log(
        `Aniversário ainda não chegou (${diaAniversario}-${mesAniversario}) - AZUL`
      );
      return "futuro";
    } catch (error) {
      console.error("Erro ao verificar status do aniversário:", error);
      return "futuro"; // Em caso de erro, assume futuro
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
          .filter((user: any) => user.aniversario)
          .map((user: any) => ({
            id: user.id,
            name: user.name,
            aniversario: formatarDataDiaMes(user.aniversario), // Usando a nova função para mostrar apenas dia e mês
            aniversario_original: user.aniversario, // Guardar a data original para comparação
          }));

        console.log(`Encontrados ${aniversariosUsuarios.length} aniversários`);

        // Verificar se houve mudança na lista de aniversários
        const aniversariosAnteriores = JSON.stringify(
          aniversarios.map((a: any) => a.id)
        );
        const aniversariosNovos = JSON.stringify(
          aniversariosUsuarios.map((a: any) => a.id)
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

  // Função para buscar dias de lavanderia
  const buscarDiasLavanderia = async () => {
    try {
      console.log("Buscando dias de lavanderia...");

      // Usar o endpoint /users que já está funcionando
      const response = await axios.get(`${API_URL}/users`, API_CONFIG);

      if (response.data) {
        // Filtrar apenas usuários que têm dia_lavanderia definido
        const usuariosComDia = response.data
          .filter((user: any) => user.dia_lavanderia)
          .map((user: any) => ({
            id: user.id,
            name: user.name,
            dia_lavanderia: user.dia_lavanderia,
          }));

        console.log(
          `Encontrados ${usuariosComDia.length} usuários com dias de lavanderia definidos`
        );
        setDiasLavanderia(usuariosComDia);
      }
    } catch (error) {
      console.error("Erro ao buscar dias de lavanderia:", error);
    }
  };

  // Variável para controlar se já está buscando notificações
  const [buscandoNotificacoes, setBuscandoNotificacoes] = useState(false);

  // Função para buscar notificações
  const buscarNotificacoes = async () => {
    // Evita múltiplas chamadas simultâneas
    if (buscandoNotificacoes) {
      console.log("Já está buscando notificações. Aguarde...");
      return;
    }

    try {
      setBuscandoNotificacoes(true);
      console.log("Buscando notificações...");

      if (!userDepartamento) {
        console.log("Usuário sem departamento definido");
      } else {
        console.log(`Departamento do usuário: ${userDepartamento}`);
      }

      // Buscar notificações do servidor com o ID do usuário
      const response = await axios.get(
        `${API_URL}/notificacoes?usuario_id=${userId}`,
        API_CONFIG
      );

      if (response.data) {
        // Formatar as notificações
        const notificacoesFormatadas = response.data.map((notif: any) => ({
          ...notif,
          data_envio: formatarData(notif.data_envio),
        }));

        // Adicionar logs para depuração
        console.log("Departamento do usuário:", userDepartamento);
        console.log(
          "Notificações antes da filtragem:",
          notificacoesFormatadas.map((n: any) => ({
            id: n.id,
            departamento: n.departamento,
            mensagem: n.mensagem.substring(0, 20) + "...",
          }))
        );

        // Filtrar notificações para mostrar apenas as do departamento do usuário ou para todos
        const notificacoesFiltradas = notificacoesFormatadas.filter(
          (notif: any) => {
            // Se a notificação for para "Todos", mostrar para todos os usuários
            if (notif.departamento === "Todos") {
              console.log(`Notificação ${notif.id} é para todos - incluída`);
              return true;
            }

            // Se o usuário tiver um departamento definido, mostrar apenas as notificações para esse departamento
            if (userDepartamento) {
              const match = notif.departamento === userDepartamento;
              console.log(
                `Notificação ${notif.id} para ${
                  notif.departamento
                }, usuário é ${userDepartamento} - ${
                  match ? "incluída" : "excluída"
                }`
              );
              return match;
            }

            // Se o usuário não tiver departamento, não mostrar notificações específicas de departamento
            console.log(
              `Notificação ${notif.id} excluída porque usuário não tem departamento`
            );
            return false;
          }
        );

        console.log(
          `Total de notificações: ${notificacoesFormatadas.length}, Filtradas: ${notificacoesFiltradas.length}`
        );

        setNotifications(notificacoesFiltradas);

        // Contar notificações não lidas
        const naoLidas = notificacoesFiltradas.filter(
          (n: any) => !n.lida
        ).length;
        setNotificacoesNaoLidas(naoLidas);

        console.log(
          `Encontradas ${notificacoesFormatadas.length} notificações (${naoLidas} não lidas)`
        );
      }
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
    } finally {
      setBuscandoNotificacoes(false);
    }
  };

  // Função para marcar notificação como lida
  const marcarComoLida = async (id: number) => {
    try {
      if (!userId) {
        console.error("ID do usuário não disponível");
        return;
      }

      await axios.put(
        `${API_URL}/notificacoes/${id}`,
        {
          lida: true,
          usuario_id: userId,
        },
        API_CONFIG
      );

      // Atualizar estado local
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === id ? { ...notif, lida: true } : notif
        )
      );

      // Atualizar contador de não lidas
      setNotificacoesNaoLidas((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      Alert.alert(
        "Erro",
        "Não foi possível marcar a notificação como lida. Tente novamente."
      );
    }
  };

  // Efeito para atualizar os dados quando a tela recebe foco
  useEffect(() => {
    // Função para atualizar todos os dados
    const atualizarDados = async () => {
      if (userId) {
        console.log("Atualizando dados ao receber foco...");

        // Buscar notificações primeiro para garantir que a bolinha apareça rapidamente
        await buscarNotificacoes();

        // Depois buscar o resto dos dados
        await Promise.all([
          buscarTarefasUsuario(userId),
          buscarAniversarios(),
          buscarDiasLavanderia(),
        ]);
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
        const departamento = await AsyncStorage.getItem("departamento");

        console.log("Dados do usuário carregados:", {
          userId: storedUserId,
          userName: storedUserName,
          role: role,
          departamento: departamento,
        });

        // Definir o departamento do usuário
        setUserDepartamento(departamento);

        if (storedUserId && storedUserName) {
          setUserId(parseInt(storedUserId));
          setUserName(storedUserName);
          setIsAdmin(role === "admin");
          await buscarTarefasUsuario(parseInt(storedUserId));
          await buscarAniversarios(); // Buscar aniversários
          await buscarDiasLavanderia(); // Buscar dias de lavanderia
          await buscarNotificacoes(); // Buscar notificações
        }
      } catch (error) {
        console.error("Erro ao carregar dados do usuário:", error);
      } finally {
        setCarregando(false);
      }
    };

    carregarDadosUsuario();

    // Atualiza as tarefas, aniversários e dias de lavanderia a cada 10 segundos
    const tarefasInterval = setInterval(() => {
      if (userId) {
        buscarTarefasUsuario(userId);
        buscarAniversarios(); // Também atualiza os aniversários periodicamente
        buscarDiasLavanderia(); // Também atualiza os dias de lavanderia periodicamente
      }
    }, 10000);

    // Atualiza as notificações a cada 10 segundos
    const notificacoesInterval = setInterval(() => {
      if (userId) {
        buscarNotificacoes(); // Atualiza as notificações com maior frequência
        console.log("Verificando novas notificações...");
      }
    }, 10000);

    return () => {
      clearInterval(tarefasInterval);
      clearInterval(notificacoesInterval);
    };
  }, []);

  // Adicionar um useEffect para debug do estado isAdmin
  useEffect(() => {
    console.log("Estado isAdmin atualizado:", isAdmin);
  }, [isAdmin]);

  // Adicionar um useEffect para atualizar as notificações quando o userId ou userDepartamento mudar
  useEffect(() => {
    if (userId) {
      console.log(
        "userId ou userDepartamento mudou, atualizando notificações..."
      );
      buscarNotificacoes();
    }
  }, [userId, userDepartamento]);

  // Adicionar um useEffect para buscar notificações imediatamente quando o componente for montado
  useEffect(() => {
    // Esta função será executada apenas uma vez quando o componente for montado
    const buscarNotificacoesImediatas = async () => {
      // Pequeno atraso para garantir que os dados do usuário já foram carregados
      setTimeout(async () => {
        if (userId) {
          console.log(
            "Buscando notificações imediatamente após a montagem do componente..."
          );
          await buscarNotificacoes();
        }
      }, 500);
    };

    buscarNotificacoesImediatas();
  }, []); // Array de dependências vazio significa que será executado apenas uma vez

  // Adicionar um useEffect para buscar notificações quando o parâmetro refreshNotifications for true
  useEffect(() => {
    if (refreshNotifications && userId) {
      console.log(
        "Parâmetro refreshNotifications detectado, atualizando notificações..."
      );
      // Pequeno atraso para garantir que os dados do usuário já foram carregados
      setTimeout(() => {
        buscarNotificacoes();
      }, 1000);
    }
  }, [refreshNotifications, userId]);

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
    // Se estiver abrindo o modal
    if (!isModalVisible) {
      setIsModalVisible(true);
      // Não marca as notificações como lidas ao abrir o modal
    }
    // Se estiver fechando o modal
    else {
      setIsModalVisible(false);
      // Opcional: marcar notificações como lidas ao fechar o modal
      // Descomente as linhas abaixo se quiser marcar como lidas ao fechar
      /*
      notifications.forEach((notif) => {
        if (!notif.lida) {
          marcarComoLida(notif.id);
        }
      });
      */
    }
  };

  // Função para obter o ícone do departamento
  const getDepartmentIcon = (departamento: string): string => {
    switch (departamento) {
      case "Todos":
        return "📢";
      case "Presidente":
      case "Vice-Presidente":
        return "👨‍💼";
      case "Secretário":
      case "Vice-Secretário":
        return "✍️";
      case "Manutenção":
        return "🔧";
      case "Compras":
        return "🛒";
      case "Fiscalização":
        return "👀";
      case "Caixa":
        return "💰";
      default:
        return "📝";
    }
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
            response.data.novoResponsavelNome ||
            response.data.novoResponsavelId ||
            "Não definido"
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
      <SafeAreaView
        style={[
          styles.safeContainer,
          styles.centerContent,
          { backgroundColor: theme.background },
        ]}
      >
        <ActivityIndicator size="large" color={theme.accent || "#007bff"} />
        <Text
          style={[styles.loadingText, { color: theme.accent || "#007bff" }]}
        >
          Carregando...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeContainer, { backgroundColor: theme.background }]}
    >
      {/* Cabeçalho */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.panel, borderBottomColor: theme.border },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            {
              color: theme.text,
              borderLeftColor: theme.accent || "#1382AB",
              borderTopColor: theme.accent || "#1382AB",
            },
          ]}
        >
          CEW
        </Text>
        <TouchableOpacity
          onPress={toggleModal}
          style={{ padding: 10, cursor: "pointer" }}
        >
          <View style={styles.notificationIconContainer}>
            <FontAwesome
              name="bell"
              size={24}
              color={theme.accent || "#1382AB"}
              style={{
                textShadowColor: "#FFFFFF",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 4,
              }}
            />
            {notificacoesNaoLidas > 0 && (
              <View
                style={[
                  styles.notificationBadge,
                  { backgroundColor: theme.danger || "red" },
                ]}
              >
                <Text style={styles.notificationBadgeText}>
                  {notificacoesNaoLidas > 9 ? "9+" : notificacoesNaoLidas}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Painéis da Página Inicial */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={true}
        style={[styles.scrollView, { backgroundColor: theme.background }]}
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
            <View
              style={[
                styles.panel,
                { backgroundColor: theme.panel, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.panelTitle, { color: theme.text }]}>
                📋 Minhas Tarefas
              </Text>
              {emViagem ? (
                <Text
                  style={[styles.emViagemText, { color: theme.textSecondary }]}
                >
                  Você está em viagem. Bom descanso! 🌴
                </Text>
              ) : tarefasHoje.length > 0 ? (
                <>
                  {tarefasHoje.map((tarefa) => (
                    <View key={tarefa.id} style={styles.tarefaItem}>
                      <View style={styles.tarefaInfo}>
                        <Text
                          style={[styles.tarefaNome, { color: theme.text }]}
                        >
                          {tarefa.nome}
                        </Text>
                        {tarefa.proxima_execucao && (
                          <>
                            <Text
                              style={[
                                styles.separador,
                                { color: theme.textSecondary },
                              ]}
                            >
                              -
                            </Text>
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
                <Text
                  style={[
                    styles.semTarefasText,
                    { color: theme.success || "#28a745" },
                  ]}
                >
                  Nenhuma tarefa pendente para hoje! 🎉
                </Text>
              )}

              {/* Histórico de Tarefas */}
              {historico.length > 0 && (
                <>
                  <Text
                    style={[
                      styles.subTitle,
                      styles.historicoTitle,
                      { color: theme.text, borderTopColor: theme.border },
                    ]}
                  >
                    Histórico dos Últimos 7 Dias:
                  </Text>
                  {historico.map((item, index) => (
                    <View key={index} style={styles.historicoItem}>
                      <Text
                        style={[
                          styles.historicoData,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {item.data}
                      </Text>
                      <Text
                        style={[styles.historicoTarefas, { color: theme.text }]}
                      >
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
            <View
              style={[
                styles.panel,
                { backgroundColor: theme.panel, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.panelTitle, { color: theme.text }]}>
                🧺 Roupas
              </Text>
              {agruparUsuariosPorDia().map((item) => (
                <View key={item.dia} style={styles.diaLavanderiaItem}>
                  <Text
                    style={[styles.diaLavanderiaNome, { color: theme.text }]}
                  >
                    {item.dia}:
                  </Text>
                  {item.usuarios.length > 0 ? (
                    <View style={styles.usuariosContainer}>
                      {item.usuarios.map((usuario, index) => (
                        <Text
                          key={index}
                          style={[
                            styles.usuarioItem,
                            index === 0 && [
                              styles.usuarioPrimeiro,
                              { backgroundColor: theme.accent || "#1382AB" },
                            ],
                            index === 1 && [
                              styles.usuarioSegundo,
                              { backgroundColor: theme.success || "#28a745" },
                            ],
                            index === 2 && [
                              styles.usuarioTerceiro,
                              { backgroundColor: theme.danger || "#dc3545" },
                            ],
                          ]}
                        >
                          {usuario}
                        </Text>
                      ))}
                    </View>
                  ) : (
                    <Text
                      style={[
                        styles.semUsuariosText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Nenhum usuário
                    </Text>
                  )}
                </View>
              ))}
            </View>

            {/* Painel de Aniversários */}
            <View
              style={[
                styles.panel,
                { backgroundColor: theme.panel, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.panelTitle, { color: theme.text }]}>
                🎉 Aniversários
              </Text>
              {aniversarios.length > 0 ? (
                aniversarios.map((aniversario) => (
                  <View key={aniversario.id} style={styles.aniversarioItem}>
                    <Text
                      style={[styles.aniversarioNome, { color: theme.text }]}
                    >
                      - {aniversario.name}:
                    </Text>
                    <Text
                      style={[
                        styles.aniversarioData,
                        { color: theme.accent || "#1382AB" }, // Cor padrão para aniversários futuros
                        verificarStatusAniversario(
                          aniversario.aniversario_original
                        ) === "hoje" && [
                          styles.aniversarioHoje,
                          { color: theme.success || "#28a745" },
                        ],
                        verificarStatusAniversario(
                          aniversario.aniversario_original
                        ) === "passado" && [
                          styles.aniversarioPassado,
                          { color: theme.danger || "#dc3545" },
                        ],
                      ]}
                    >
                      {aniversario.aniversario}
                    </Text>
                  </View>
                ))
              ) : (
                <Text
                  style={[
                    styles.semAniversariosText,
                    { color: theme.textSecondary },
                  ]}
                >
                  Nenhum aniversário cadastrado.
                </Text>
              )}
            </View>

            {/* Painel de Controle de Gás */}
            <View
              style={[
                styles.panel,
                { backgroundColor: theme.panel, borderColor: theme.border },
              ]}
            >
              <Text style={[styles.panelTitle, { color: theme.text }]}>
                ⛽ Controle de Gás
              </Text>
              <LaundryGas />
            </View>
          </>
        )}
      </ScrollView>

      {/* Menu Inferior */}
      <View
        style={[
          styles.menu,
          { backgroundColor: theme.panel, borderTopColor: "#007bff" },
        ]}
      >
        <Text
          style={[styles.menuItem, { color: theme.text }]}
          onPress={() => navigation.navigate("Home")}
        >
          📋
        </Text>
        <Text
          style={[styles.menuItem, { color: theme.text }]}
          onPress={() => navigation.navigate("Departaments")}
        >
          🛠️
        </Text>
        <Text
          style={[styles.menuItem, { color: theme.text }]}
          onPress={() => navigation.navigate("Budget")}
        >
          💰
        </Text>
        <Text
          style={[styles.menuItem, { color: theme.text }]}
          onPress={() => navigation.navigate(isAdmin ? "Admin" : "Configs")}
        >
          ⚙️
        </Text>
      </View>

      {/* Modal de Notificações */}
      <Modal visible={isModalVisible} animationType="slide" transparent={false}>
        <View
          style={[styles.modalContainer, { backgroundColor: theme.background }]}
        >
          <Text style={[styles.modalTitle, { color: theme.text }]}>
            📨 Notificações
          </Text>
          {notifications.length === 0 ? (
            <View
              style={[
                styles.emptyNotifications,
                { backgroundColor: theme.background },
              ]}
            >
              <Text
                style={[
                  styles.emptyNotificationsText,
                  { color: theme.textSecondary },
                ]}
              >
                Nenhuma notificação disponível
              </Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id.toString()}
              style={{ backgroundColor: theme.background }}
              renderItem={({ item }: { item: Notification }) => (
                <TouchableOpacity
                  style={[
                    styles.notificationItem,
                    { backgroundColor: theme.panel, borderColor: theme.border },
                    !item.lida && [
                      styles.notificationUnread,
                      {
                        borderLeftColor: theme.accent || "#1382AB",
                        backgroundColor: isDarkMode ? theme.panel : "#f0f9ff",
                      },
                    ],
                  ]}
                  onPress={() => marcarComoLida(item.id)}
                >
                  <View style={styles.notificationHeader}>
                    <Text
                      style={[
                        styles.notificationDepartment,
                        { color: theme.accent || "#1382AB" },
                      ]}
                    >
                      {getDepartmentIcon(item.departamento)} {item.departamento}
                    </Text>
                    <Text
                      style={[
                        styles.notificationDate,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {item.data_envio}
                    </Text>
                  </View>
                  <Text
                    style={[styles.notificationText, { color: theme.text }]}
                  >
                    {item.mensagem}
                  </Text>
                  {item.remetente_nome && (
                    <Text
                      style={[
                        styles.notificationSender,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Enviado por: {item.remetente_nome}
                    </Text>
                  )}
                  {!item.lida && (
                    <Text
                      style={[
                        styles.notificationStatus,
                        { color: theme.accent || "#1382AB" },
                      ]}
                    >
                      Não lida • Toque para marcar como lida
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            />
          )}
          <TouchableOpacity
            style={[
              styles.closeButton,
              { backgroundColor: theme.accent || "#007bff" },
            ]}
            onPress={toggleModal}
          >
            <Text style={[styles.closeButtonText, { color: "#fff" }]}>
              Fechar
            </Text>
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
    paddingTop: 0,
    backgroundColor: "#f8f9fa",
    height: "100%", // Garante que ocupe toda a altura da tela
  },
  scrollView: {
    flex: 1, // Ocupa todo o espaço disponível
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
    paddingBottom: 80, // Aumentado para dar espaço ao menu inferior
    flexGrow: 1, // Permite que o conteúdo cresça conforme necessário
  },
  panel: {
    backgroundColor: "#fff",
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    borderWidth: 0.3,
    borderColor: "#ddd",
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
    backgroundColor: "#fff",
    padding: 13,
    borderTopWidth: 1, // Aumentando a espessura da borda
    borderTopColor: "#007bff", // Cor azul padrão para a borda
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
    width: 300,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
    paddingRight: 5,
  },
  aniversarioNome: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    marginRight: 10, // Adiciona um espaço entre o nome e a data
  },
  aniversarioData: {
    fontWeight: "bold",
    color: "#1382AB", // Azul para aniversários futuros
    fontSize: 16,
    textAlign: "right",
    minWidth: 50, // Garante um espaço mínimo para a data
  },
  aniversarioHoje: {
    color: "#28a745", // Verde para aniversário de hoje
  },
  aniversarioPassado: {
    color: "#dc3545", // Vermelho para aniversários que já passaram
  },
  semAniversariosText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 10,
  },
  notificationIconContainer: {
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    right: -6,
    top: -6,
    backgroundColor: "red",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationBadgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  emptyNotifications: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyNotificationsText: {
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  notificationDepartment: {
    fontWeight: "bold",
    color: "#1382AB",
    fontSize: 16,
  },
  notificationDate: {
    color: "#666",
    fontSize: 14,
  },
  notificationSender: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    fontStyle: "italic",
  },
  notificationStatus: {
    fontSize: 12,
    color: "#1382AB",
    marginTop: 5,
    fontStyle: "italic",
  },
  notificationUnread: {
    backgroundColor: "#f0f9ff",
    borderLeftWidth: 3,
    borderLeftColor: "#1382AB",
  },
  diaLavanderiaItem: {
    marginVertical: 4,
    paddingVertical: 4,
  },
  diaLavanderiaNome: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 2,
  },
  diaLavanderiaUsuarios: {
    fontSize: 14,
    color: "#555",
    marginLeft: 10,
  },
  semUsuariosText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    marginLeft: 10,
  },
  usuariosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginLeft: 10,
    marginTop: 5,
  },
  usuarioItem: {
    fontSize: 14,
    color: "#333",
    marginRight: 10,
    marginBottom: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  usuarioPrimeiro: {
    backgroundColor: "#1382AB", // Azul (mesmo do aniversário futuro)
    color: "#fff",
  },
  usuarioSegundo: {
    backgroundColor: "#28a745", // Verde (mesmo do aniversário hoje)
    color: "#fff",
  },
  usuarioTerceiro: {
    backgroundColor: "#dc3545", // Vermelho (mesmo do aniversário passado)
    color: "#fff",
  },
});

export default Home;
