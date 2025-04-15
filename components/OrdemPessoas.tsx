import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import axios from 'axios';

interface Pessoa {
  id: number;
  name: string;
  email: string;
  departamento: string;
  posicao: number;
}

const OrdemPessoas = () => {
  const [pessoas, setPessoas] = useState<Pessoa[]>([]);
  const [carregando, setCarregando] = useState(false);

  // Buscar lista de pessoas
  const buscarPessoas = async () => {
    setCarregando(true);
    try {
      const response = await axios.get('http://192.168.1.55:3001/pessoas/ordem');
      if (response.data.success) {
        setPessoas(response.data.pessoas);
      }
    } catch (error) {
      console.error('Erro ao buscar pessoas:', error);
      Alert.alert('Erro', 'Não foi possível carregar a lista de pessoas.');
    } finally {
      setCarregando(false);
    }
  };

  // Inicializar ordem das pessoas
  const inicializarOrdem = async () => {
    try {
      const response = await axios.post('http://192.168.1.55:3001/pessoas/ordem/inicializar');
      if (response.data.success) {
        Alert.alert('Sucesso', 'Ordem das pessoas inicializada!');
        buscarPessoas();
      }
    } catch (error) {
      console.error('Erro ao inicializar ordem:', error);
      Alert.alert('Erro', 'Não foi possível inicializar a ordem das pessoas.');
    }
  };

  // Mover pessoa para cima ou para baixo
  const moverPessoa = async (id: number, direcao: 'cima' | 'baixo') => {
    try {
      const response = await axios.post(`http://192.168.1.55:3001/pessoas/ordem/${id}/mover`, {
        direcao
      });
      
      if (response.data.success) {
        buscarPessoas();
      }
    } catch (error) {
      console.error('Erro ao mover pessoa:', error);
      Alert.alert('Erro', 'Não foi possível mover a pessoa na lista.');
    }
  };

  useEffect(() => {
    buscarPessoas();
  }, []);

  if (carregando) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Ordem das Pessoas</Text>

      {pessoas.length === 0 ? (
        <TouchableOpacity
          style={styles.initButton}
          onPress={inicializarOrdem}
        >
          <Text style={styles.buttonText}>Inicializar Ordem</Text>
        </TouchableOpacity>
      ) : (
        pessoas.map((pessoa, index) => (
          <View key={pessoa.id} style={styles.pessoaCard}>
            <View style={styles.pessoaInfo}>
              <Text style={styles.pessoaNome}>{pessoa.name}</Text>
              {pessoa.departamento && (
                <Text style={styles.pessoaDepartamento}>{pessoa.departamento}</Text>
              )}
            </View>

            <View style={styles.acoes}>
              <TouchableOpacity
                style={[styles.moveButton, index === 0 && styles.disabledButton]}
                onPress={() => moverPessoa(pessoa.id, 'cima')}
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
                  styles.moveButton,
                  index === pessoas.length - 1 && styles.disabledButton
                ]}
                onPress={() => moverPessoa(pessoa.id, 'baixo')}
                disabled={index === pessoas.length - 1}
              >
                <FontAwesome 
                  name="arrow-down" 
                  size={20} 
                  color={index === pessoas.length - 1 ? "#ccc" : "#007bff"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  initButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pessoaCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pessoaInfo: {
    flex: 1,
  },
  pessoaNome: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  pessoaDepartamento: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  acoes: {
    flexDirection: 'row',
    gap: 10,
  },
  moveButton: {
    padding: 10,
    borderRadius: 4,
    backgroundColor: '#f8f9fa',
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default OrdemPessoas; 