import React from "react";
import { useState, useEffect } from "react";
import { View, Text, StyleSheet, Button, Switch, Alert, Modal, TextInput, TouchableOpacity, Image } from "react-native";
import axios from "axios";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Configs = ({ navigation }: { navigation: any }) => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    departamento: ""
  });
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    // Buscar dados do usuário ao carregar o componente
    fetchUserData();
    // Solicitar permissão para acessar a galeria
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar sua galeria de fotos.');
      }
    })();
  }, []);

  useEffect(() => {
    const loadUserData = async () => {
      const email = await AsyncStorage.getItem('userEmail');
      const name = await AsyncStorage.getItem('userName');
      const department = await AsyncStorage.getItem('userDepartment');
      
      if (email && name) {
        setUserData({
          email,
          name,
          departamento: department || ''
        });
      }
    };
    loadUserData();
  }, []);

  useEffect(() => {
    if (userData.email) {
      fetchUserData();
    }
  }, [userData.email]);

  const fetchUserData = async () => {
    try {
      const response = await axios.get("http://localhost:3001/user-data", {
        params: {
          email: userData.email
        }
      });
      
      if (response.data.success) {
        setUserData(response.data.user);
        if (response.data.user.profile_picture) {
          // Construir a URL completa da imagem
          setProfileImage(`http://localhost:3001/uploads/${response.data.user.profile_picture}`);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
    }
  };

  const toggleTheme = () => {
    setIsDarkTheme((previousState) => !previousState);
    Alert.alert(
      "Tema Alterado",
      isDarkTheme ? "Tema Claro Ativado!" : "Tema Escuro Ativado!"
    );
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        const selectedImage = result.assets[0];
        setProfileImage(selectedImage.uri);
        
        // Criar um objeto FormData para enviar a imagem
        const formData = new FormData();
        formData.append('profile_picture', {
          uri: selectedImage.uri,
          type: 'image/jpeg',
          name: 'profile.jpg'
        } as any);
        formData.append('name', userData.name);

        // Enviar a imagem para o servidor
        const response = await axios.post('http://localhost:3001/upload-profile-picture', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success) {
          Alert.alert('Sucesso', 'Foto de perfil atualizada com sucesso!');
        } else {
          Alert.alert('Erro', 'Não foi possível atualizar a foto de perfil.');
        }
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao selecionar a imagem.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configurações</Text>

      {/* Seção: Dados Pessoais */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 Dados Pessoais</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => setIsModalVisible(true)}
        >
          <Text style={styles.buttonText}>Editar Perfil</Text>
        </TouchableOpacity>
      </View>

      {/* Modal de Dados Pessoais */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Dados Pessoais</Text>
            
            {/* Foto de Perfil */}
            <View style={styles.profileImageContainer}>
              <Image
                source={profileImage ? { uri: profileImage } : require('../assets/img/default-profile.png')}
                style={styles.profileImage}
              />
              <TouchableOpacity 
                style={styles.changePhotoButton}
                onPress={pickImage}
              >
                <Text style={styles.changePhotoText}>Alterar Foto</Text>
              </TouchableOpacity>
            </View>

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
                  setIsModalVisible(false);
                  navigation.navigate("RedefinirSenha");
                }}
              >
                <Text style={styles.buttonText}>Alterar Senha</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.closeButton]}
                onPress={() => setIsModalVisible(false)}
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
        <Button
          title="Gerenciar Documentos"
          onPress={() => alert("Gerenciar Documentos")}
        />
      </View>
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
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 10,
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
  button: {
    backgroundColor: "#007bff",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
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
    borderRadius: 10,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
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
  closeButton: {
    backgroundColor: "#6c757d",
  },
});

export default Configs;
