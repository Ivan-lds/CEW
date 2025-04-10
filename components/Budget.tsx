import React from "react";
import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

interface BudgetItem {
  id: string;
  month: string;
  value: string;
}

interface Transaction {
  id: string;
  description: string;
  value: string;
}

const Budget = () => {
  // Dados simulados: Entradas e saídas detalhadas por mês
  const monthlyEntries: BudgetItem[] = [
    { id: "1", month: "Janeiro/2025", value: "R$ 1.200,00" },
    { id: "2", month: "Fevereiro/2025", value: "R$ 1.000,00" },
    { id: "3", month: "Março/2025", value: "R$ 1.500,00" },
    { id: "4", month: "Abril/2025", value: "R$ 1.800,00" },
  ];

  const monthlyExits: BudgetItem[] = [
    { id: "1", month: "Janeiro/2025", value: "R$ 800,00" },
    { id: "2", month: "Fevereiro/2025", value: "R$ 1.100,00" },
    { id: "3", month: "Março/2025", value: "R$ 900,00" },
    { id: "4", month: "Abril/2025", value: "R$ 600,00" },
  ];

  // Transações detalhadas por mês
  const transactionsByMonth: { [key: string]: Transaction[] } = {
    "Janeiro/2025": [
      { id: "1", description: " - Material de limpeza", value: "R$ 50,00" },
      { id: "2", description: " - Compra de alimentos", value: "R$ 200,00" },
    ],
    "Fevereiro/2025": [
      { id: "3", description: " - Manutenção elétrica", value: "R$ 150,00" },
      { id: "4", description: " - Doações", value: "R$ 500,00" },
    ],
    "Março/2025": [
      { id: "5", description: " - Reembolso de despesas", value: "R$ 300,00" },
      { id: "6", description: " - Venda de recicláveis", value: "R$ 100,00" },
    ],
    "Abril/2025": [
      { id: "7", description: " - Taxas diversas", value: "R$ 80,00" },
      { id: "8", description: " - Compra de equipamentos", value: "R$ 400,00" },
    ],
  };

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedPanel, setSelectedPanel] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);

  const openDetails = (panel: string, month: string) => {
    setSelectedPanel(panel);
    setSelectedMonth(month);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPanel(null);
    setSelectedMonth(null);
  };

  const renderTransactions = (transactions: Transaction[]) => (
    <FlatList
      data={transactions}
      keyExtractor={(item) => item.id}
      renderItem={({ item }: { item: Transaction }) => (
        <View style={styles.listItem}>
          <Text style={styles.listText}>{item.value}</Text>
          <Text style={styles.listText}>{item.description}</Text>
        </View>
      )}
    />
  );

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <Text style={styles.title}>📊 Status do Caixa</Text>
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Painel de Total */}
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>💰 Total</Text>
            <Text style={styles.panelValue}>R$ 5.000,00</Text>
          </View>

          {/* Painel de Total Atual */}
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>💵 Total Atual</Text>
            <Text style={styles.panelValue}>R$ 3.200,00</Text>
          </View>

          {/* Painel de Entradas por Mês */}
          <View>
            <Text style={styles.subtitle}>Entradas</Text>
          </View>
          <FlatList
            data={monthlyEntries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }: { item: BudgetItem }) => (
              <TouchableOpacity
                onPress={() => openDetails("entradas", item.month)}
              >
                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>{item.month}</Text>
                  <Text style={styles.panelValue}>{item.value}</Text>
                </View>
              </TouchableOpacity>
            )}
          />

          {/* Painel de Saídas por Mês */}
          <View>
            <Text style={styles.subtitle}>Saídas</Text>
          </View>
          <FlatList
            data={monthlyExits}
            keyExtractor={(item) => item.id}
            renderItem={({ item }: { item: BudgetItem }) => (
              <TouchableOpacity
                onPress={() => openDetails("saídas", item.month)}
              >
                <View style={styles.panel}>
                  <Text style={styles.panelTitle}>{item.month}</Text>
                  <Text style={styles.panelValue}>{item.value}</Text>
                </View>
              </TouchableOpacity>
            )}
          />

          {/* Modal de Detalhes */}
          <Modal
            visible={isModalVisible}
            animationType="slide"
            transparent={false}
          >
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>
                Detalhes de{" "}
                {selectedPanel === "entradas" ? "Entradas" : "Saídas"} -{" "}
                {selectedMonth}
              </Text>
              {selectedMonth && transactionsByMonth[selectedMonth]
                ? renderTransactions(transactionsByMonth[selectedMonth])
                : null}
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <Text style={styles.closeButtonText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </Modal>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  content: {
    height: 650,
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
  listItem: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 8,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listText: {
    fontSize: 16,
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

export default Budget;
