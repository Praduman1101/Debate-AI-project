import 'react-native-reanimated';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider }   from './src/context/AuthContext';
import { DebateProvider } from './src/context/DebateContext';
import { ToastProvider }  from './src/context/ToastContext';
import AppNavigator       from './src/navigation/AppNavigator';
import ErrorBoundary      from './src/components/ErrorBoundary';

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <ToastProvider>
          <AuthProvider>
            <DebateProvider>
              <StatusBar style="light" />
              <AppNavigator />
            </DebateProvider>
          </AuthProvider>
        </ToastProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
