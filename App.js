import { useState, useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import Home from "./components/Home";
import Tasks from "./components/Tasks";
import Departaments from "./components/Departaments";
import LaundryGas from "./components/LaundryGas";
import Budget from "./components/Budget";
import Configs from "./components/Configs";
import Login from "./components/Login"; // Importando a tela de Login
import Cadastro from "./components/Cadastro"; // Importando a tela de Cadastro

// Componente SplashScreen
const SplashScreen = () => {
  return (
    <View style={styles.splashContainer}>
      <Image source={require("./assets/img/logo.jpg")} style={styles.logo} />
    </View>
  );
};

// Configurando o React Navigation
const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // Exibe a Splash Screen por 3 segundos
    return () => clearTimeout(timer);
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {isLoading ? (
          // Mostra a SplashScreen como tela inicial durante o carregamento
          <Stack.Screen
            name="Splash"
            component={SplashScreen}
            options={{ headerShown: false }}
          />
        ) : (
          // Define a tela "Login" como inicial após o carregamento
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
              options={{ headerShown: true, title: "Configurações" }}
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
});
