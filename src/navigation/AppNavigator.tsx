import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SetupScreen } from '../screens/SetupScreen';
import { WorkflowListScreen } from '../screens/WorkflowListScreen';
import { DashboardAnalyticsScreen } from '../screens/DashboardAnalyticsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { WorkflowCanvas } from '../components/WorkflowCanvas';
import { ExecutionList } from '../components/ExecutionList';
import { JsonViewScreen } from '../screens/JsonViewScreen';
import { DataTablesScreen } from '../screens/DataTablesScreen';
import { TableDetailScreen } from '../screens/TableDetailScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { useN8nStore } from '../store/useN8nStore';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from 'react-native';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const MainTabs = createBottomTabNavigator();

const MyTheme = {
    ...DefaultTheme,
    colors: {
        ...DefaultTheme.colors,
        background: '#0F111A',
        card: '#1A1C26',
        text: '#FFFFFF',
        border: '#2D3748',
    },
};



const WorkflowDetailTabs = ({ route, navigation }: any) => {
    const { workflow } = route.params;
    
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ color, size }) => {
                    let iconName;
                    if (route.name === 'Diagram') iconName = 'git-network-outline';
                    else if (route.name === 'Executions') iconName = 'list-outline';
                    else if (route.name === 'JSON') iconName = 'code-slash-outline';
                    return <Ionicons name={iconName as any} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#FF6C37',
                tabBarInactiveTintColor: '#718096',
                tabBarStyle: {
                    backgroundColor: '#1A1C26',
                    borderTopColor: '#2D3748',
                    paddingBottom: 5,
                    height: 60,
                },
                headerStyle: {
                    backgroundColor: '#1A1C26',
                    elevation: 0,
                    shadowOpacity: 0,
                    borderBottomWidth: 1,
                    borderBottomColor: '#2D3748',
                },
                headerTitleStyle: {
                    color: '#FFFFFF',
                    fontSize: 18,
                    fontWeight: 'bold',
                },
                headerLeft: () => (
                    <TouchableOpacity 
                        style={{ marginLeft: 16 }} 
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="close" size={24} color="#A0AEC0" />
                    </TouchableOpacity>
                )
            })}
        >
            <Tab.Screen 
                name="Diagram" 
                options={{ title: 'Visual' }}
                initialParams={{ workflow }}
                component={WorkflowCanvas as any}
            />
            <Tab.Screen 
                name="Executions" 
                options={{ title: 'Log' }}
                initialParams={{ workflow }}
                component={ExecutionList}
            />
            <Tab.Screen 
                name="JSON" 
                options={{ title: 'Raw' }}
                initialParams={{ workflow }}
                component={JsonViewScreen as any}
            />
        </Tab.Navigator>
    );
};

const MainTabNavigator = () => {
    return (
        <MainTabs.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ color, size }) => {
                    let iconName;
                    if (route.name === 'Dashboard') iconName = 'pie-chart';
                    else if (route.name === 'Workflows') iconName = 'list';
                    else if (route.name === 'Tables') iconName = 'grid';
                    else if (route.name === 'Settings') iconName = 'settings';
                    return <Ionicons name={iconName as any} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#FF6C37',
                tabBarInactiveTintColor: '#718096',
                tabBarStyle: {
                    backgroundColor: '#1A1C26',
                    borderTopColor: '#2D3748',
                    paddingBottom: 5,
                    height: 60,
                },
            })}
        >
            <MainTabs.Screen name="Dashboard" component={DashboardAnalyticsScreen} />
            <MainTabs.Screen name="Workflows" component={WorkflowListScreen} />
            <MainTabs.Screen name="Tables" component={DataTablesScreen} />
            <MainTabs.Screen name="Settings" component={SettingsScreen} />
        </MainTabs.Navigator>
    );
};

export const AppNavigator = () => {
    const activeInstanceId = useN8nStore(state => state.activeInstanceId);
    const loadingCredentials = useN8nStore(state => state.loadingCredentials);

    return (
        <NavigationContainer theme={MyTheme}>
            <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Welcome">
                {!activeInstanceId ? (
                    <>
                        <Stack.Screen name="Welcome" component={WelcomeScreen} />
                        <Stack.Screen name="Setup" component={SetupScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Welcome" component={WelcomeScreen} />
                        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
                        <Stack.Screen 
                            name="WorkflowDetail" 
                            component={WorkflowDetailTabs} 
                            options={{ 
                                presentation: 'modal',
                            }}
                        />
                        <Stack.Screen 
                            name="ExecutionDetail" 
                            component={JsonViewScreen as any} 
                            options={({ route }: any) => ({
                                presentation: 'modal',
                                title: `Exec #${route.params?.detail?.id?.substring(0,5) || ''}`,
                                headerShown: true,
                                headerStyle: {
                                    backgroundColor: '#1A1C26',
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#2D3748',
                                },
                                headerTintColor: '#FFFFFF',
                            })}
                        />
                        <Stack.Screen 
                            name="TableDetail" 
                            component={TableDetailScreen} 
                            options={{ headerShown: false }}
                        />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
};

