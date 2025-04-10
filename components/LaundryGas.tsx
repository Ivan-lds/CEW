import React from "react";
import { View, Text, StyleSheet } from "react-native";

const LaundryGas = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gás e Lavagem de Roupa</Text>
      <Text>⛽ Última troca de gás: 15/03/2025</Text>
      <Text>🧺 Próximo dia para lavar roupa: 07/04/2025</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
});

export default LaundryGas;
