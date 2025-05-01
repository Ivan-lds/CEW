import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL, API_CONFIG } from "../config";
import { ThemeContext } from "../ThemeContext";

const Calculadora = () => {
  const { isDarkMode, theme } = useContext(ThemeContext);

  // Estados para os campos de entrada
  const [internet, setInternet] = useState("");
  const [gas1, setGas1] = useState("");
  const [gas2, setGas2] = useState("");
  const [taxa, setTaxa] = useState("");
  const [quantidadePessoas, setQuantidadePessoas] = useState("");

  const [resultado, setResultado] = useState<number | null>(null);

  const [totalPessoasCadastradas, setTotalPessoasCadastradas] = useState(0);

  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    buscarTotalPessoas();
  }, []);

  const buscarTotalPessoas = async () => {
    try {
      setCarregando(true);

      const totalPessoasString = await AsyncStorage.getItem("totalPessoas");
      if (totalPessoasString) {
        const totalPessoas = parseInt(totalPessoasString);
        if (!isNaN(totalPessoas) && totalPessoas > 0) {
          setTotalPessoasCadastradas(totalPessoas);
          console.log(
            `Total de pessoas cadastradas (do AsyncStorage): ${totalPessoas}`
          );
          setCarregando(false);
          return;
        }
      }

      try {
        const response = await axios.get(`${API_URL}/users`, API_CONFIG);

        if (response.data && Array.isArray(response.data)) {
          const total = response.data.length;
          setTotalPessoasCadastradas(total);

          await AsyncStorage.setItem("totalPessoas", total.toString());

          console.log(`Total de pessoas cadastradas (da API): ${total}`);
        }
      } catch (apiError) {
        console.error("Erro ao buscar total de pessoas da API:", apiError);

        setTotalPessoasCadastradas(16); 
        console.log("Usando valor padrão para total de pessoas: 16");
      }
    } catch (error) {
      console.error("Erro ao buscar total de pessoas:", error);

    } finally {
      setCarregando(false);
    }
  };

  const calcular = () => {
    try {
      if (!internet || !taxa) {
        Alert.alert("Erro", "Os campos Internet e Taxa são obrigatórios.");
        return;
      }

      if (!quantidadePessoas || parseInt(quantidadePessoas) <= 0) {
        Alert.alert("Erro", "A quantidade de pessoas deve ser maior que zero.");
        return;
      }

      // Converte valores para números
      const internetValor = parseFloat(internet.replace(",", "."));
      const gas1Valor = gas1 ? parseFloat(gas1.replace(",", ".")) : 0;
      const gas2Valor = gas2 ? parseFloat(gas2.replace(",", ".")) : 0;
      const taxaValor = parseFloat(taxa.replace(",", "."));
      const qtdPessoas = parseInt(quantidadePessoas);

      // Valida se os valores são números válidos
      if (isNaN(internetValor) || isNaN(taxaValor) || isNaN(qtdPessoas)) {
        Alert.alert("Erro", "Por favor, insira valores numéricos válidos.");
        return;
      }

      if ((gas1 && isNaN(gas1Valor)) || (gas2 && isNaN(gas2Valor))) {
        Alert.alert(
          "Erro",
          "Por favor, insira valores numéricos válidos para os campos de gás."
        );
        return;
      }

      // Calcula o valor da internet dividido pelo total de pessoas cadastradas
      const internetPorPessoa = internetValor / totalPessoasCadastradas;

      // Calcula o valor do gás dividido pela quantidade de pessoas informada
      const gasPorPessoa = (gas1Valor + gas2Valor) / qtdPessoas;

      // Calcula o resultado final
      const resultadoFinal = internetPorPessoa + gasPorPessoa + taxaValor;

      setResultado(resultadoFinal);

      console.log(
        `Cálculo realizado: Internet por pessoa: ${internetPorPessoa}, Gás por pessoa: ${gasPorPessoa}, Taxa: ${taxaValor}, Resultado: ${resultadoFinal}`
      );
    } catch (error) {
      console.error("Erro ao calcular:", error);
      Alert.alert("Erro", "Ocorreu um erro ao realizar o cálculo.");
    }
  };

  const limpar = () => {
    setInternet("");
    setGas1("");
    setGas2("");
    setTaxa("");
    setQuantidadePessoas("");
    setResultado(null);
  };

  const formatarValor = (valor: number): string => {
    return `R$ ${valor.toFixed(2).replace(".", ",")}`;
  };

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#121212" : "#f8f9fa" },
      ]}
    >
      <Text style={[styles.title, { color: isDarkMode ? "#F5F5F5" : "#333" }]}>
        🧮 Calculadora de Despesas
      </Text>

      {carregando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Carregando dados...</Text>
        </View>
      ) : (
        <>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Total de pessoas cadastradas: {totalPessoasCadastradas}
            </Text>
          </View>

          <View
            style={[
              styles.formContainer,
              {
                backgroundColor: isDarkMode ? "#1f1f1f" : "#fff",
                borderColor: isDarkMode ? "#F5F5F5" : "#ddd",
              },
            ]}
          >
            {/* Campo Internet */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: isDarkMode ? "#F5F5F5" : "#555" },
                ]}
              >
                Internet (R$):
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: "#FFFFFF", color: "#000000" },
                ]}
                placeholder="0,00"
                placeholderTextColor="#666666"
                keyboardType="numeric"
                value={internet}
                onChangeText={setInternet}
              />
            </View>

            {/* Campo Gás 1 */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: isDarkMode ? "#F5F5F5" : "#555" },
                ]}
              >
                Gás 1 (R$):
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: "#FFFFFF", color: "#000000" },
                ]}
                placeholder="0,00"
                placeholderTextColor="#666666"
                keyboardType="numeric"
                value={gas1}
                onChangeText={setGas1}
              />
            </View>

            {/* Campo Gás 2 */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: isDarkMode ? "#F5F5F5" : "#555" },
                ]}
              >
                Gás 2 (R$):
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: "#FFFFFF", color: "#000000" },
                ]}
                placeholder="0,00"
                placeholderTextColor="#666666"
                keyboardType="numeric"
                value={gas2}
                onChangeText={setGas2}
              />
            </View>

            {/* Campo Taxa */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: isDarkMode ? "#F5F5F5" : "#555" },
                ]}
              >
                Taxa (R$):
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: "#FFFFFF", color: "#000000" },
                ]}
                placeholder="0,00"
                placeholderTextColor="#666666"
                keyboardType="numeric"
                value={taxa}
                onChangeText={setTaxa}
              />
            </View>

            {/* Campo Quantidade de Pessoas */}
            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.label,
                  { color: isDarkMode ? "#F5F5F5" : "#555" },
                ]}
              >
                Quantidade de Pessoas:
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: "#FFFFFF", color: "#000000" },
                ]}
                placeholder="0"
                placeholderTextColor="#666666"
                keyboardType="numeric"
                value={quantidadePessoas}
                onChangeText={setQuantidadePessoas}
              />
            </View>

            {/* Botões de ação */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.calcularButton]}
                onPress={calcular}
              >
                <FontAwesome name="calculator" size={20} color="#fff" />
                <Text style={styles.buttonText}>Calcular</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.limparButton]}
                onPress={limpar}
              >
                <FontAwesome name="trash" size={20} color="#fff" />
                <Text style={styles.buttonText}>Limpar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Exibição do resultado */}
          {resultado !== null && (
            <View style={styles.resultadoContainer}>
              <Text style={styles.resultadoTitle}>Resultado:</Text>
              <Text style={styles.resultadoValor}>
                {formatarValor(resultado)}
              </Text>
              <Text style={styles.resultadoDescricao}>
                Este é o valor que cada pessoa deve pagar.
              </Text>
            </View>
          )}

          {/* Explicação do cálculo */}
          <View
            style={[
              styles.explicacaoContainer,
              {
                backgroundColor: isDarkMode ? "#1f1f1f" : "#fff",
                borderColor: isDarkMode ? "#F5F5F5" : "#ddd",
                borderWidth: isDarkMode ? 1 : 0,
              },
            ]}
          >
            <Text
              style={[
                styles.explicacaoTitle,
                { color: isDarkMode ? "#F5F5F5" : "#333" },
              ]}
            >
              Como o cálculo é feito:
            </Text>
            <Text
              style={[
                styles.explicacaoText,
                { color: isDarkMode ? "#F5F5F5" : "#555" },
              ]}
            >
              1. O valor da Internet é dividido pelo total de pessoas
              cadastradas no app ({totalPessoasCadastradas}).
            </Text>
            <Text
              style={[
                styles.explicacaoText,
                { color: isDarkMode ? "#F5F5F5" : "#555" },
              ]}
            >
              2. Os valores de Gás 1 e Gás 2 são somados e divididos pela
              quantidade de pessoas informada.
            </Text>
            <Text
              style={[
                styles.explicacaoText,
                { color: isDarkMode ? "#F5F5F5" : "#555" },
              ]}
            >
              3. O valor da Taxa é adicionado integralmente.
            </Text>
            <Text
              style={[
                styles.explicacaoText,
                { color: isDarkMode ? "#F5F5F5" : "#555" },
              ]}
            >
              4. O resultado final é a soma desses valores.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
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
  infoContainer: {
    backgroundColor: "#e9f5ff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: "#007bff",
  },
  infoText: {
    fontSize: 16,
    color: "#333",
  },
  formContainer: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  calcularButton: {
    backgroundColor: "#28a745",
  },
  limparButton: {
    backgroundColor: "#dc3545",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  resultadoContainer: {
    backgroundColor: "#d4edda",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
    borderLeftWidth: 4,
    borderLeftColor: "#28a745",
  },
  resultadoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  resultadoValor: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#28a745",
    marginBottom: 10,
  },
  resultadoDescricao: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  explicacaoContainer: {
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  explicacaoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  explicacaoText: {
    fontSize: 14,
    marginBottom: 8,
  },
});

export default Calculadora;
