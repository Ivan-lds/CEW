import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import { API_URL } from "../config";

interface TrocaGas {
  id: number;
  data: string;
}

const LaundryGas = () => {
  const [ultimaTroca, setUltimaTroca] = useState("");
  const [novaData, setNovaData] = useState("");
  const [todasTrocas, setTodasTrocas] = useState<TrocaGas[]>([]);
  const [carregando, setCarregando] = useState(false);

  // Buscar última data de troca
  const buscarUltimaTroca = async () => {
    try {
      console.log("Buscando última data de troca...");
      const response = await axios.get(`${API_URL}/gas/ultima-troca`);
      console.log("Resposta da busca:", response.data);

      if (response.data.success) {
        const dataDB = response.data.data;

        if (dataDB) {
          console.log("Data recebida do servidor:", dataDB);

          // Garantir que estamos trabalhando apenas com a parte da data (sem horas)
          // Primeiro, converter para objeto Date se for uma string ISO
          let dataObj: Date;
          if (typeof dataDB === "string") {
            // Se for uma string ISO completa ou apenas YYYY-MM-DD
            if (dataDB.includes("T")) {
              // É uma string ISO completa com horas
              dataObj = new Date(dataDB);
            } else {
              // É apenas YYYY-MM-DD
              const [year, month, day] = dataDB.split("-");
              dataObj = new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day)
              );
            }
          } else {
            // Se já for um objeto Date
            dataObj = new Date(dataDB);
          }

          // Formatar para DD-MM-YYYY
          const day = String(dataObj.getDate()).padStart(2, "0");
          const month = String(dataObj.getMonth() + 1).padStart(2, "0");
          const year = dataObj.getFullYear();

          const dataFormatada = `${day}-${month}-${year}`;
          console.log("Data formatada:", dataFormatada);

          setUltimaTroca(dataFormatada);
        } else {
          console.log("Nenhuma data encontrada, limpando o estado");
          setUltimaTroca("");
        }
      } else {
        // Se a resposta não for bem-sucedida, limpar o estado
        console.log("Resposta não foi bem-sucedida, limpando o estado");
        setUltimaTroca("");
      }
    } catch (error) {
      console.error("Erro ao buscar data da última troca:", error);
      // Em caso de erro, também limpar o estado
      setUltimaTroca("");
    }
  };

  // Registrar nova troca
  const registrarTroca = async () => {
    if (!novaData) {
      Alert.alert("Erro", "Por favor, insira uma data válida");
      return;
    }

    // Validar formato da data (DD-MM-YYYY)
    const dateRegex = /^(\d{2})-(\d{2})-(\d{4})$/;
    const match = novaData.match(dateRegex);

    if (!match) {
      Alert.alert("Erro", "Formato de data inválido. Use DD-MM-YYYY");
      return;
    }

    // Converter para formato YYYY-MM-DD para o MySQL
    const [_, day, month, year] = match;
    const formattedDate = `${year}-${month}-${day}`;

    try {
      console.log("Enviando data:", formattedDate);
      const response = await axios.post(`${API_URL}/gas/registrar`, {
        data: formattedDate,
      });

      if (response.data.success) {
        Alert.alert("Sucesso", "Data de troca registrada com sucesso!");
        setNovaData("");
        buscarUltimaTroca();
        buscarTodasTrocas();
      }
    } catch (error) {
      console.error("Erro ao registrar troca:", error);
      Alert.alert(
        "Erro",
        "Não foi possível registrar a troca. Verifique o formato da data (DD-MM-YYYY)"
      );
    }
  };

  // Função deletarRegistro removida, pois não é mais necessária

  // Buscar todas as trocas de gás
  const buscarTodasTrocas = async () => {
    try {
      setCarregando(true);
      console.log("Buscando todas as trocas de gás...");

      const response = await axios.get(`${API_URL}/gas/todas-trocas`);
      console.log("Resposta da busca de todas as trocas:", response.data);

      if (response.data.success) {
        setTodasTrocas(response.data.trocas);
      } else {
        console.error("Erro na resposta:", response.data);
        Alert.alert("Erro", "Não foi possível buscar as trocas de gás");
      }
    } catch (error) {
      console.error("Erro ao buscar todas as trocas:", error);
      Alert.alert("Erro", "Não foi possível buscar as trocas de gás");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    buscarUltimaTroca();
    buscarTodasTrocas();
  }, []);

  // Função deletarDireto removida, pois não é mais necessária

  // Função super simples para deletar registro
  const deletarRegistro = async () => {
    try {
      // Usar fetch diretamente com o método GET
      const response = await fetch(`${API_URL}/gas/deletar-ultimo`);
      const data = await response.json();

      console.log("Resposta do servidor:", data);

      // Atualizar a interface após a exclusão
      buscarUltimaTroca();
      buscarTodasTrocas();
    } catch (error) {
      console.error("Erro ao deletar:", error);
      Alert.alert("Erro", "Não foi possível deletar o registro");
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Formulário para nova troca */}
      <View style={styles.formContainer}>
        {/* Exibição de todas as trocas */}
        <View style={styles.infoContainer}>
          <Text style={styles.sectionTitle}>Histórico de Trocas</Text>

          {carregando ? (
            <ActivityIndicator
              size="large"
              color="#007bff"
              style={styles.loader}
            />
          ) : todasTrocas.length > 0 ? (
            todasTrocas.map((troca) => (
              <View key={troca.id} style={styles.trocaItem}>
                <Text style={styles.trocaData}>{troca.data}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhum registro encontrado</Text>
          )}
        </View>

        <Text style={styles.label}>Registrar nova troca:</Text>
        <TextInput
          style={styles.input}
          value={novaData}
          onChangeText={(text) => {
            // Remove caracteres não numéricos e traços
            const numericText = text.replace(/[^0-9-]/g, "");

            // Lógica para adicionar traços automaticamente
            let formattedText = numericText;

            // Se tiver 2 dígitos e o próximo caractere não for um traço, adiciona um traço
            if (numericText.length === 2 && !numericText.includes("-")) {
              formattedText = numericText + "-";
            }
            // Se tiver 5 caracteres (DD-MM) e o próximo caractere não for um traço, adiciona um traço
            else if (
              numericText.length === 5 &&
              numericText.indexOf("-", 3) === -1
            ) {
              formattedText = numericText + "-";
            }
            // Limita o tamanho para 10 caracteres (DD-MM-YYYY)
            else if (numericText.length > 10) {
              formattedText = numericText.substring(0, 10);
            }

            setNovaData(formattedText);
          }}
          placeholder="Data de troca..."
          placeholderTextColor="#999"
          maxLength={10}
          keyboardType="numeric"
        />
        {/* Container para os botões lado a lado */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={registrarTroca}>
            <Text style={styles.buttonText}>Registrar</Text>
          </TouchableOpacity>

          {/* Botão de deletar */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={deletarRegistro}
          >
            <Text style={styles.deleteButtonText}>Deletar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
    textAlign: "center",
  },
  infoContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2,
  },
  dataContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  formContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
    textAlign: "center",
  },
  data: {
    fontSize: 18,
    color: "#007bff",
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  deleteButton: {
    backgroundColor: "#dc3545",
    padding: 12,
    borderRadius: 4,
    alignItems: "center",
    flex: 1,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  trocaItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  trocaData: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginVertical: 20,
  },
  loader: {
    marginVertical: 20,
  },
});

export default LaundryGas;
