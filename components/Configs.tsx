import React from "react";
import { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  Switch,
  Alert,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  FlatList,
} from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import { API_URL, API_CONFIG } from "../config";
import * as DocumentPicker from "expo-document-picker";
// Importar bibliotecas para visualização de documentos
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import Calculadora from "./Calculadora";
import { ThemeContext } from "../ThemeContext";

const Configs = ({ navigation }: { navigation: any }) => {
  // Usar o contexto de tema global
  const { isDarkMode, toggleTheme, theme } = useContext(ThemeContext);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    departamento: "",
  });
  const [isDocumentosModalVisible, setIsDocumentosModalVisible] =
    useState(false);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isCalculadoraVisible, setIsCalculadoraVisible] = useState(false);
  const [isCalculadoraModalVisible, setIsCalculadoraModalVisible] =
    useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      const email = await AsyncStorage.getItem("userEmail");
      const name = await AsyncStorage.getItem("userName");
      const department = await AsyncStorage.getItem("userDepartment");
      const departamento = await AsyncStorage.getItem("departamento");

      // Verificar se o usuário é do departamento "Caixa"
      if (departamento === "Caixa") {
        setIsCalculadoraVisible(true);
      }

      if (email && name) {
        setUserData({
          email,
          name,
          departamento: department || "",
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
      const response = await axios.get(`${API_URL}/user-data`, {
        params: {
          email: userData.email,
        },
        ...API_CONFIG,
      });

      if (response.data.success) {
        setUserData(response.data.user);
      }
    } catch (error) {
      console.error("Erro ao buscar dados do usuário:", error);
    }
  };

  // Função para alternar o tema usando o contexto global
  const handleToggleTheme = () => {
    toggleTheme();
    Alert.alert(
      "Tema Alterado",
      isDarkMode ? "Tema Claro Ativado!" : "Tema Escuro Ativado!"
    );
  };

  // Carregar documentos quando o componente montar
  useEffect(() => {
    carregarDocumentos();
  }, []);

  // Recarregar documentos quando abrir o modal
  useEffect(() => {
    if (isDocumentosModalVisible) {
      carregarDocumentos();
    }
  }, [isDocumentosModalVisible]);

  // Função para selecionar documentos
  const selecionarDocumentos = async () => {
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

  // Função para fazer upload de documentos
  const uploadDocumentos = async (arquivos) => {
    if (Platform.OS === "web") {
      Alert.alert(
        "Funcionalidade limitada",
        "O upload de documentos só está disponível em dispositivos móveis."
      );
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const userId = await AsyncStorage.getItem("userId");
      const userName = await AsyncStorage.getItem("userName");

      if (!userId || !userName) {
        Alert.alert("Erro", "Não foi possível identificar o usuário.");
        return;
      }

      const novosDocumentos = arquivos.map((arquivo, index) => ({
        id: Date.now() + index,
        nome: arquivo.name,
        tipo: arquivo.mimeType,
        tamanho: arquivo.size,
        uri: arquivo.uri, // Usar uri em vez de caminho
        caminho: arquivo.uri, // Manter caminho para compatibilidade
        dataUpload: new Date().toISOString(),
      }));

      const todosDocumentos = [...documentos, ...novosDocumentos];
      setDocumentos(todosDocumentos);

      // Salvar na chave do usuário
      await AsyncStorage.setItem(
        `documentos_${userId}`,
        JSON.stringify(todosDocumentos)
      );

      // Também salvar na chave global
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
        // Salvar na chave do usuário
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
      // Verificar se o documento tem uma URI ou caminho
      const documentoUri = documento.uri || documento.caminho;
      if (!documentoUri) {
        Alert.alert("Erro", "O documento não possui uma URI válida.");
        return;
      }

      // Usar a URI encontrada
      documento.uri = documentoUri;

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
      // Verificar se o documento tem uma URI ou caminho
      const documentoUri = documento.uri || documento.caminho;
      if (!documentoUri) {
        Alert.alert("Erro", "O documento não possui uma URI válida.");
        return;
      }

      // Usar a URI encontrada
      documento.uri = documentoUri;

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
      // Verificar se o documento tem uma URI ou caminho
      const documentoUri = documento.uri || documento.caminho;
      if (!documentoUri) {
        Alert.alert("Erro", "O documento não possui uma URI válida.");
        return;
      }

      // Usar a URI encontrada
      documento.uri = documentoUri;

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
      <Text style={[styles.title, { color: theme.text }]}>Configurações</Text>

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
              Dados Pessoais
            </Text>

            {/* Informações do Usuário */}
            <View style={styles.infoContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Nome:</Text>
              <Text style={[styles.value, { color: theme.text }]}>
                {userData.name}
              </Text>

              <Text style={[styles.label, { color: theme.text }]}>Email:</Text>
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
                style={[
                  styles.actionButton,
                  { backgroundColor: theme.accent || "#007bff" },
                ]}
                onPress={() => {
                  setIsModalVisible(false);
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
                onPress={() => setIsModalVisible(false)}
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

      {/* Seção: Calculadora - Visível apenas para usuários do departamento Caixa */}
      {isCalculadoraVisible && (
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
            🧮 Calculadora de Despesas
          </Text>
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: theme.accent || "#007bff" },
            ]}
            onPress={() => setIsCalculadoraModalVisible(true)}
          >
            <Text style={styles.buttonText}>Abrir Calculadora</Text>
          </TouchableOpacity>
        </View>
      )}

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
                  <ScrollView
                    style={styles.documentosContainer}
                    nestedScrollEnabled={true}
                  >
                    {documentos.map((documento) => (
                      <View
                        key={documento.id.toString()}
                        style={styles.documentoItem}
                      >
                        <View style={styles.documentoInfo}>
                          <Text style={styles.documentoNome}>
                            {documento.nome}
                          </Text>
                          <Text style={styles.documentoData}>
                            {new Date(
                              documento.dataUpload
                            ).toLocaleDateString()}
                          </Text>

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
                    ))}
                  </ScrollView>
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

      {/* Modal da Calculadora */}
      <Modal
        visible={isCalculadoraModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsCalculadoraModalVisible(false)}
      >
        <View
          style={{ flex: 1, backgroundColor: theme.background, padding: 16 }}
        >
      
          {/* Renderizar o componente Calculadora diretamente */}
          <Calculadora />

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: "#dc3545", // Cor vermelha fixa para o botão de fechar
                marginTop: 15,
                margin: 'auto',
                width: 270,
              },
            ]}
            onPress={() => setIsCalculadoraModalVisible(false)}
          >
            <Text style={styles.buttonText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
  documentoInfo: {
    flex: 1,
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
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  documentoBotao: {
    padding: 5,
    marginHorizontal: 10,
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
  documentosContainer: {
    maxHeight: 300,
    marginBottom: 10,
  },
});

export default Configs;
