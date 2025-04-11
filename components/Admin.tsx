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
  Image,
} from "react-native";
import axios from "axios";
import { ScrollView } from "react-native-gesture-handler";
import React from "react";
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Admin = ({ navigation }: { navigation: any }) => {
  const [taskFrequency, setTaskFrequency] = useState(0);
  const [tasksPaused, setTasksPaused] = useState(false);
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
    departamento: ""
  });
  const [profileImage, setProfileImage] = useState(null);

  // Função para buscar usuários do banco de dados
  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:3001/users"); // Ajuste o endpoint conforme necessário
      setUsers(response.data);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      Alert.alert("Erro", "Não foi possível carregar os usuários.");
    }
  };

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
          setProfileImage(response.data.user.profile_picture);
        }
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

  const handleTogglePauseTasks = () => {
    setTasksPaused(!tasksPaused);
    const status = !tasksPaused ? "pausadas" : "retomadas";
    Alert.alert("Tarefas Atualizadas", `As tarefas foram ${status}.`);
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
      await axios.post("http://localhost:3001/transfer-admin", {
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
    // Converte dd-mm-yyyy para yyyy-mm-dd
    const [day, month, year] = date.split("-");
    return `${year}-${month}-${day}`;
  };

  const handleSetBirthday = async (date) => {
    try {
      const formattedDate = convertDateToDatabaseFormat(date);
      await axios.post("http://localhost:3001/aniversarios", {
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
      await axios.post("http://localhost:3001/departamentos", {
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
      const response = await axios.post("http://localhost:3001/remove-user", {
        name: selectedUser.name,
      });
      
      if (response.data.success) {
        console.log("Usuário removido com sucesso:", selectedUser.name);
        Alert.alert("Sucesso", `${selectedUser.name} foi removido.`);
        setUsers(users.filter((user) => user.name !== selectedUser.name));
        setIsModalVisible(false);
      } else {
        console.error("Erro na resposta do servidor:", response.data);
        Alert.alert("Erro", response.data.message || "Não foi possível remover o usuário.");
      }
    } catch (error) {
      console.error("Erro ao remover usuário:", error);
      console.error("Detalhes do erro:", error.response?.data);
      Alert.alert(
        "Erro",
        error.response?.data?.message || error.response?.data?.error || "Não foi possível remover o usuário."
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
    fetchUsers();
  }, []);

  useEffect(() => {
    if (userData.email) {
      fetchUserData();
    }
  }, [userData.email]);

  useEffect(() => {
    // Solicitar permissão para acessar a galeria
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar sua galeria de fotos.');
      }
    })();
  }, []);

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

        {/* Botão para pausar tarefas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pausar/Retomar Tarefas</Text>
          <Button
            title={tasksPaused ? "Retomar Tarefas" : "Pausar Tarefas"}
            onPress={handleTogglePauseTasks}
          />
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
                  <Text style={styles.roleButtonText}>Definir como Admin</Text>
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
          </Modal>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 10,
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
    padding: 20,
    backgroundColor: "#f8f9fa",
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
});

export default Admin;
