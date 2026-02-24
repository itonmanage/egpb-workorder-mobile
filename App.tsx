/**
 * EGPB Ticket Mobile - App Entry Point
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { ErrorBoundary } from './src/components/ErrorBoundary';

export default function App() {
    return (
        <ErrorBoundary>
            <SafeAreaProvider>
                <AuthProvider>
                    <NavigationContainer>
                        <AppNavigator />
                        <StatusBar style="auto" />
                    </NavigationContainer>
                </AuthProvider>
            </SafeAreaProvider>
        </ErrorBoundary>
    );
}
