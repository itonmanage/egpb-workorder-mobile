/**
 * App Navigator - Tab + Stack navigation
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { TicketType } from '../types';
import { Colors, FontSize, FontWeight } from '../constants/theme';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import TicketDetailScreen from '../screens/TicketDetailScreen';
import CreateTicketScreen from '../screens/CreateTicketScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { LoadingSpinner } from '../components/LoadingAndEmpty';

// Type definitions for navigation
export type RootStackParamList = {
    Auth: undefined;
    Main: undefined;
    TicketDetail: { ticketId: string; ticketType: TicketType };
};

export type MainTabParamList = {
    Home: undefined;
    Create: undefined;
    Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.textTertiary,
                tabBarStyle: {
                    backgroundColor: Colors.white,
                    borderTopColor: Colors.border,
                    height: 60,
                    paddingBottom: 8,
                    paddingTop: 4,
                },
                tabBarLabelStyle: {
                    fontSize: FontSize.xs,
                    fontWeight: FontWeight.medium,
                },
                headerStyle: {
                    backgroundColor: Colors.white,
                },
                headerTitleStyle: {
                    fontWeight: FontWeight.bold,
                    color: Colors.text,
                    fontSize: FontSize.lg,
                },
                headerShadowVisible: false,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    headerShown: false,
                    tabBarLabel: 'Dashboard',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="grid" size={size} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Create"
                component={CreateTicketScreen}
                options={{
                    title: 'Create Ticket',
                    tabBarLabel: 'Create',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="add-circle" size={size + 4} color={color} />
                    ),
                    headerTintColor: Colors.primary,
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    headerShown: false,
                    tabBarLabel: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-circle" size={size} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export default function AppNavigator() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingSpinner fullScreen message="Loading..." />;
    }

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!isAuthenticated ? (
                <Stack.Screen name="Auth" component={LoginScreen} />
            ) : (
                <>
                    <Stack.Screen name="Main" component={MainTabs} />
                    <Stack.Screen
                        name="TicketDetail"
                        component={TicketDetailScreen}
                        options={{
                            headerShown: true,
                            title: 'Ticket Details',
                            headerStyle: { backgroundColor: Colors.white },
                            headerTintColor: Colors.primary,
                            headerTitleStyle: { fontWeight: FontWeight.bold, color: Colors.text },
                            headerShadowVisible: false,
                            headerBackTitleVisible: false,
                        }}
                    />
                </>
            )}
        </Stack.Navigator>
    );
}
