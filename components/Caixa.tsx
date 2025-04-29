import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL, API_CONFIG } from "../config";
import { Picker } from "@react-native-picker/picker";

interface Transacao {
  id: number;
  tipo: "entrada" | "saida";
  mes: string;
  ano: number;
  valor: number;
  descricao: string;
  data_registro: string;
}

interface TotalMensal {
  mes: string;
  ano: number;
  total_entradas: number;
  total_saidas: number;
  saldo_mes: number;
}

interface SaldoCaixa {
  saldo_total: number;
}

const Caixa = ({ navigation }: { navigation: any }) => {
  // Estados para os dados
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [totaisMensais, setTotaisMensais] = useState<TotalMensal[]>([]);
  const [saldoCaixa, setSaldoCaixa] = useState<SaldoCaixa>({
    saldo_total: 0,
  });
  const [userDepartamento, setUserDepartamento] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mostrarBotaoNovaTransacao, setMostrarBotaoNovaTransacao] =
    useState(false);

  // Estados para o formulário de nova transação
  const [novaTransacao, setNovaTransacao] = useState<{
    tipo: "entrada" | "saida";
    mes: string;
    ano: number;
    valor: string;
    descricao: string;
  }>({
    tipo: "entrada",
    mes: "",
    ano: new Date().getFullYear(),
    valor: "",
    descricao: "",
  });

  // Estados para controle de UI
  const [carregando, setCarregando] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalDetalhesVisible, setModalDetalhesVisible] = useState(false);
  const [mesSelecionado, setMesSelecionado] = useState("");
  const [anoSelecionado, setAnoSelecionado] = useState(0);
  const [tipoSelecionado, setTipoSelecionado] = useState<"entrada" | "saida">(
    "entrada"
  );
  const [transacoesFiltradas, setTransacoesFiltradas] = useState<Transacao[]>(
    []
  );

  // Lista de meses para o Picker
  const meses = [
    { label: "Janeiro", value: "Janeiro" },
    { label: "Fevereiro", value: "Fevereiro" },
    { label: "Março", value: "Março" },
    { label: "Abril", value: "Abril" },
    { label: "Maio", value: "Maio" },
    { label: "Junho", value: "Junho" },
    { label: "Julho", value: "Julho" },
    { label: "Agosto", value: "Agosto" },
    { label: "Setembro", value: "Setembro" },
    { label: "Outubro", value: "Outubro" },
    { label: "Novembro", value: "Novembro" },
    { label: "Dezembro", value: "Dezembro" },
  ];

  // Lista de anos para o Picker (últimos 5 anos até o próximo ano)
  const anoAtual = new Date().getFullYear();
  const anos = Array.from({ length: 6 }, (_, i) => anoAtual - 4 + i);

  // Verificar o departamento do usuário ao montar o componente
  useEffect(() => {
    const verificarDepartamento = async () => {
      try {
        const departamento = await AsyncStorage.getItem("departamento");
        const role = await AsyncStorage.getItem("role");

        console.log("Departamento do usuário:", departamento);
        console.log("Role do usuário:", role);

        setUserDepartamento(departamento);
        setIsAdmin(role === "admin");

        // Mostrar o botão "Nova Transação" apenas para usuários do departamento "Caixa" ou para administradores
        setMostrarBotaoNovaTransacao(
          departamento === "Caixa" || role === "admin"
        );
      } catch (error) {
        console.error("Erro ao verificar departamento do usuário:", error);
      }
    };

    verificarDepartamento();
    carregarDados();
  }, []);

  // Função para carregar todos os dados do caixa
  const carregarDados = async () => {
    setCarregando(true);
    try {
      // Carregar saldo do caixa
      const responseSaldo = await axios.get(
        `${API_URL}/caixa/saldo`,
        API_CONFIG
      );
      if (responseSaldo.data.success) {
        setSaldoCaixa(responseSaldo.data.saldo);
      }

      // Carregar totais mensais
      const responseTotais = await axios.get(
        `${API_URL}/caixa/totais`,
        API_CONFIG
      );
      if (responseTotais.data.success) {
        setTotaisMensais(responseTotais.data.totais);
      }

      // Carregar transações
      const responseTransacoes = await axios.get(
        `${API_URL}/caixa/transacoes`,
        API_CONFIG
      );
      if (responseTransacoes.data.success) {
        setTransacoes(responseTransacoes.data.transacoes);
      }
    } catch (error) {
      console.error("Erro ao carregar dados do caixa:", error);
      Alert.alert("Erro", "Não foi possível carregar os dados do caixa.");
    } finally {
      setCarregando(false);
    }
  };

  // Função para registrar nova transação
  const registrarTransacao = async () => {
    // Validar campos
    if (
      !novaTransacao.mes ||
      !novaTransacao.valor ||
      !novaTransacao.descricao
    ) {
      Alert.alert("Erro", "Por favor, preencha todos os campos.");
      return;
    }

    // Validar valor
    const valor = parseFloat(novaTransacao.valor.replace(",", "."));
    if (isNaN(valor) || valor <= 0) {
      Alert.alert("Erro", "Por favor, informe um valor válido.");
      return;
    }

    try {
      setCarregando(true);

      // Obter ID do usuário logado
      const userId = await AsyncStorage.getItem("userId");

      // Enviar transação para o servidor
      const response = await axios.post(
        `${API_URL}/caixa/transacoes`,
        {
          ...novaTransacao,
          valor: valor,
          userId: userId,
        },
        API_CONFIG
      );

      if (response.data.success) {
        Alert.alert("Sucesso", "Transação registrada com sucesso!");

        // Limpar formulário
        setNovaTransacao({
          tipo: "entrada",
          mes: "",
          ano: new Date().getFullYear(),
          valor: "",
          descricao: "",
        });

        // Fechar modal e recarregar dados
        setModalVisible(false);
        await carregarDados();
      } else {
        Alert.alert(
          "Erro",
          response.data.message || "Não foi possível registrar a transação."
        );
      }
    } catch (error) {
      console.error("Erro ao registrar transação:", error);
      Alert.alert("Erro", "Não foi possível registrar a transação.");
    } finally {
      setCarregando(false);
    }
  };

  // Função para abrir modal de detalhes
  const abrirDetalhes = (
    tipo: "entrada" | "saida",
    mes: string,
    ano: number
  ) => {
    // Filtrar transações pelo mês, ano e tipo
    const filtradas = transacoes.filter(
      (t) => t.mes === mes && t.ano === ano && t.tipo === tipo
    );

    setTransacoesFiltradas(filtradas);
    setMesSelecionado(mes);
    setAnoSelecionado(ano);
    setTipoSelecionado(tipo);
    setModalDetalhesVisible(true);
  };

  // Função para formatar valor em reais
  const formatarValor = (valor: number): string => {
    return `R$ ${valor.toFixed(2).replace(".", ",")}`;
  };

  // Renderizar o componente
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📊 Gerenciamento do Caixa</Text>

      {carregando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Carregando dados...</Text>
        </View>
      ) : (
        <>
          {/* Painel de Saldo */}
          <View style={styles.saldoContainer}>
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>💰 Saldo Total</Text>
              <Text style={styles.panelValue}>
                {formatarValor(saldoCaixa.saldo_total)}
              </Text>
            </View>
          </View>

          {/* Botão para adicionar nova transação - visível apenas para usuários do departamento Caixa ou administradores */}
          {mostrarBotaoNovaTransacao && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <FontAwesome name="plus" size={20} color="#fff" />
              <Text style={styles.addButtonText}>Nova Transação</Text>
            </TouchableOpacity>
          )}

          {/* Seção de Entradas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📈 Entradas</Text>

            {totaisMensais.length > 0 ? (
              totaisMensais.map((total, index) => (
                <TouchableOpacity
                  key={`entrada-${total.mes}-${total.ano}-${index}`}
                  style={styles.panel}
                  onPress={() => abrirDetalhes("entrada", total.mes, total.ano)}
                >
                  <Text style={styles.panelTitle}>
                    {total.mes}/{total.ano}
                  </Text>
                  <Text style={[styles.panelValue, styles.entradaText]}>
                    {formatarValor(total.total_entradas)}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>Nenhuma entrada registrada</Text>
            )}
          </View>

          {/* Seção de Saídas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📉 Saídas</Text>

            {totaisMensais.length > 0 ? (
              totaisMensais.map((total, index) => (
                <TouchableOpacity
                  key={`saida-${total.mes}-${total.ano}-${index}`}
                  style={styles.panel}
                  onPress={() => abrirDetalhes("saida", total.mes, total.ano)}
                >
                  <Text style={styles.panelTitle}>
                    {total.mes}/{total.ano}
                  </Text>
                  <Text style={[styles.panelValue, styles.saidaText]}>
                    {formatarValor(total.total_saidas)}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>Nenhuma saída registrada</Text>
            )}
          </View>

          {/* Modal para adicionar nova transação */}
          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalVisible(false)}
            statusBarTranslucent={true}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <ScrollView style={{ marginBottom: 10 }}>
                  <Text style={styles.modalTitle}>Nova Transação</Text>

                  {/* Tipo de Transação */}
                  <Text style={styles.label}>Tipo:</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={novaTransacao.tipo}
                      onValueChange={(itemValue) =>
                        setNovaTransacao({ ...novaTransacao, tipo: itemValue })
                      }
                      style={styles.picker}
                    >
                      <Picker.Item label="Entrada" value="entrada" />
                      <Picker.Item label="Saída" value="saida" />
                    </Picker>
                  </View>

                  {/* Mês */}
                  <Text style={styles.label}>Mês:</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={novaTransacao.mes}
                      onValueChange={(itemValue) =>
                        setNovaTransacao({ ...novaTransacao, mes: itemValue })
                      }
                      style={styles.picker}
                    >
                      <Picker.Item label="Selecione o mês" value="" />
                      {meses.map((mes) => (
                        <Picker.Item
                          key={mes.value}
                          label={mes.label}
                          value={mes.value}
                        />
                      ))}
                    </Picker>
                  </View>

                  {/* Ano */}
                  <Text style={styles.label}>Ano:</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={novaTransacao.ano}
                      onValueChange={(itemValue) =>
                        setNovaTransacao({ ...novaTransacao, ano: itemValue })
                      }
                      style={styles.picker}
                    >
                      {anos.map((ano) => (
                        <Picker.Item
                          key={ano}
                          label={ano.toString()}
                          value={ano}
                        />
                      ))}
                    </Picker>
                  </View>

                  {/* Valor */}
                  <Text style={styles.label}>Valor (R$):</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0,00"
                    keyboardType="numeric"
                    value={novaTransacao.valor}
                    onChangeText={(text) =>
                      setNovaTransacao({ ...novaTransacao, valor: text })
                    }
                  />

                  {/* Descrição */}
                  <Text style={styles.label}>Descrição:</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Descreva a transação"
                    multiline
                    numberOfLines={3}
                    value={novaTransacao.descricao}
                    onChangeText={(text) =>
                      setNovaTransacao({ ...novaTransacao, descricao: text })
                    }
                  />
                </ScrollView>

                {/* Botões de ação */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.buttonText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={registrarTransacao}
                  >
                    <Text style={styles.buttonText}>Salvar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

          {/* Modal de detalhes das transações */}
          <Modal
            visible={modalDetalhesVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalDetalhesVisible(false)}
            statusBarTranslucent={true}
          >
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {tipoSelecionado === "entrada" ? "Entradas" : "Saídas"} -{" "}
                  {mesSelecionado}/{anoSelecionado}
                </Text>

                {transacoesFiltradas.length > 0 ? (
                  <ScrollView
                    style={[styles.transacoesLista, { marginBottom: 10 }]}
                  >
                    {transacoesFiltradas.map((transacao) => (
                      <View key={transacao.id} style={styles.transacaoItem}>
                        <View style={styles.transacaoHeader}>
                          <Text style={styles.transacaoValor}>
                            {formatarValor(transacao.valor)}
                          </Text>
                          <Text style={styles.transacaoData}>
                            {new Date(
                              transacao.data_registro
                            ).toLocaleDateString("pt-BR")}
                          </Text>
                        </View>
                        <Text style={styles.transacaoDescricao}>
                          {transacao.descricao}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                ) : (
                  <Text style={styles.emptyText}>
                    Nenhuma transação encontrada para este período
                  </Text>
                )}

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.closeButton, { flex: 1 }]}
                    onPress={() => setModalDetalhesVisible(false)}
                  >
                    <Text style={styles.buttonText}>Fechar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
  saldoContainer: {
    marginBottom: 20,
  },
  panel: {
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
  panelTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 5,
  },
  panelValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    flexDirection: "row",
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  entradaText: {
    color: "#28a745",
  },
  saidaText: {
    color: "#dc3545",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    fontStyle: "italic",
    padding: 15,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    width: "90%",
    maxHeight: "90%",
    flexDirection: "column",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    marginBottom: 5,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  saveButton: {
    backgroundColor: "#28a745",
  },
  closeButton: {
    backgroundColor: "#007bff",
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  transacoesLista: {
    maxHeight: 400,
    minHeight: 100,
  },
  transacaoItem: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#007bff",
  },
  transacaoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  transacaoValor: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  transacaoData: {
    fontSize: 14,
    color: "#666",
  },
  transacaoDescricao: {
    fontSize: 15,
    color: "#555",
  },
});

export default Caixa;
