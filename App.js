import { useState, useEffect } from "react";
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import Home from "./components/Home";
import Tasks from "./components/Tasks";
import Departaments from "./components/Departaments";
import LaundryGas from "./components/LaundryGas";
import Budget from "./components/Budget";
import Configs from "./components/Configs";
import Login from "./components/Login";
import Cadastro from "./components/Cadastro";
import Admin from "./components/Admin";
import RedefinirSenha from "./components/RedefinirSenha";
import OrdemPessoas from "./components/OrdemPessoas";

// Componente SplashScreen
const SplashScreen = () => {
  return (
    <View style={styles.splashContainer}>
      <Image source={require("./assets/img/logo.jpg")} style={styles.logo} />
    </View>
  );
};

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLogout = async (navigation) => {
    try {
      // Salvar as credenciais antes de limpar o AsyncStorage
      const savedEmail = await AsyncStorage.getItem("savedEmail");
      const savedPassword = await AsyncStorage.getItem("savedPassword");
      const rememberMe = await AsyncStorage.getItem("rememberMe");

      // Limpar todas as informações do AsyncStorage
      await AsyncStorage.clear();

      // Se o "Lembrar-me" estiver ativado, restaurar as credenciais salvas
      if (rememberMe === "true" && savedEmail && savedPassword) {
        await AsyncStorage.setItem("savedEmail", savedEmail);
        await AsyncStorage.setItem("savedPassword", savedPassword);
        await AsyncStorage.setItem("rememberMe", "true");
        console.log("Credenciais preservadas após logout");
      }

      Alert.alert("Logout", "Você saiu da sua conta com sucesso!");
      navigation.navigate("Login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      Alert.alert("Erro", "Não foi possível fazer logout.");
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isLoading ? (
          <Stack.Screen
            name="Splash"
            component={SplashScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Login"
              component={Login}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Cadastro"
              component={Cadastro}
              options={{ title: "Cadastro de Usuário" }}
            />
            <Stack.Screen
              name="RedefinirSenha"
              component={RedefinirSenha}
              options={{ title: "Redefinir Senha" }}
            />
            <Stack.Screen
              name="OrdemPessoas"
              component={OrdemPessoas}
              options={{ title: "Ordem das Pessoas" }}
            />
            <Stack.Screen
              name="Home"
              component={Home}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Tasks"
              component={Tasks}
              options={{ title: "Gerenciador de Tarefas" }}
            />
            <Stack.Screen
              name="Departaments"
              component={Departaments}
              options={{ headerShown: true, title: "Departamentos" }}
            />
            <Stack.Screen
              name="LaundryGas"
              component={LaundryGas}
              options={{ title: "Gás" }}
            />
            <Stack.Screen
              name="Budget"
              component={Budget}
              options={{ title: "Caixa" }}
            />
            <Stack.Screen
              name="Configs"
              component={Configs}
              options={({ navigation }) => ({
                headerShown: true,
                title: "Configurações",
                headerRight: () => (
                  <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => handleLogout(navigation)}
                  >
                    <FontAwesome name="sign-out" size={24} color="#333" />
                    <Text style={styles.logoutText}>Sair</Text>
                  </TouchableOpacity>
                ),
              })}
            />
            <Stack.Screen
              name="Admin"
              component={Admin}
              options={({ navigation }) => ({
                headerShown: true,
                title: "Administração",
                headerLeft: () => (
                  <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.navigate("Home")}
                  >
                    <FontAwesome name="arrow-left" size={24} color="#333" />
                  </TouchableOpacity>
                ),
                headerRight: () => (
                  <TouchableOpacity
                    style={styles.logoutButton}
                    onPress={() => handleLogout(navigation)}
                  >
                    <FontAwesome name="sign-out" size={24} color="#333" />
                    <Text style={styles.logoutText}>Sair</Text>
                  </TouchableOpacity>
                ),
              })}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  logo: {
    width: 400,
    height: 800,
    resizeMode: "cover",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  logoutText: {
    fontSize: 16,
    marginLeft: 5,
    color: "#333",
    fontWeight: "bold",
  },
  backButton: {
    marginLeft: 10,
    padding: 5,
  },
});
