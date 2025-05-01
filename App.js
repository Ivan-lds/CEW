import { useState, useEffect, useContext } from "react";
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  StatusBar,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import Home from "./components/Home";
import Tasks from "./components/Tasks";
import Departaments from "./components/Departaments";
import LaundryGas from "./components/LaundryGas";
import Caixa from "./components/Caixa";
import Calculadora from "./components/Calculadora";
import Configs from "./components/Configs";
import Login from "./components/Login";
import Cadastro from "./components/Cadastro";
import Admin from "./components/Admin";
import RedefinirSenha from "./components/RedefinirSenha";
import OrdemPessoas from "./components/OrdemPessoas";
import { ThemeProvider, ThemeContext } from "./ThemeContext";

const SplashScreen = () => {
  const { theme } = useContext(ThemeContext);
  return (
    <View
      style={[styles.splashContainer, { backgroundColor: theme.background }]}
    >
      <Image source={require("./assets/img/logo.jpg")} style={styles.logo} />
    </View>
  );
};

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  const handleLogout = async (navigation) => {
    try {
      const savedEmail = await AsyncStorage.getItem("savedEmail");
      const savedPassword = await AsyncStorage.getItem("savedPassword");
      const rememberMe = await AsyncStorage.getItem("rememberMe");
      const isDarkMode = await AsyncStorage.getItem("isDarkMode");

      await AsyncStorage.clear();

      if (rememberMe === "true" && savedEmail && savedPassword) {
        await AsyncStorage.setItem("savedEmail", savedEmail);
        await AsyncStorage.setItem("savedPassword", savedPassword);
        await AsyncStorage.setItem("rememberMe", "true");
        console.log("Credenciais preservadas após logout");
      }

      if (isDarkMode) {
        await AsyncStorage.setItem("isDarkMode", isDarkMode);
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

  const AppContent = () => {
    const { theme, isDarkMode } = useContext(ThemeContext);

    const dynamicButtonStyle = {
      backgroundColor: theme.panel,
      borderColor: theme.border,
    };

    const dynamicTextStyle = {
      color: theme.text,
    };

    return (
      <>
        <StatusBar
          barStyle={isDarkMode ? "light-content" : "dark-content"}
          backgroundColor={theme.background}
        />
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: {
                backgroundColor: theme.panel,
              },
              headerTintColor: theme.text,
              headerTitleStyle: {
                color: theme.text,
              },
              cardStyle: {
                backgroundColor: theme.background,
              },
            }}
          >
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
                  component={Caixa}
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
                        style={[styles.logoutButton, dynamicButtonStyle]}
                        onPress={() => handleLogout(navigation)}
                      >
                        <FontAwesome
                          name="sign-out"
                          size={24}
                          color={theme.text}
                        />
                        <Text style={[styles.logoutText, dynamicTextStyle]}>
                          Sair
                        </Text>
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
                        <FontAwesome
                          name="arrow-left"
                          size={24}
                          color={theme.text}
                        />
                      </TouchableOpacity>
                    ),
                    headerRight: () => (
                      <TouchableOpacity
                        style={[styles.logoutButton, dynamicButtonStyle]}
                        onPress={() => handleLogout(navigation)}
                      >
                        <FontAwesome
                          name="sign-out"
                          size={24}
                          color={theme.text}
                        />
                        <Text style={[styles.logoutText, dynamicTextStyle]}>
                          Sair
                        </Text>
                      </TouchableOpacity>
                    ),
                  })}
                />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </>
    );
  };

  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  logoutText: {
    fontSize: 16,
    marginLeft: 5,
    fontWeight: "bold",
  },
  backButton: {
    marginLeft: 10,
    padding: 5,
  },
});
