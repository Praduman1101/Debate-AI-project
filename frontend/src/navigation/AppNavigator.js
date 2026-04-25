import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { STORAGE_KEYS } from '../utils/constants';

// Screens
import AuthScreen           from '../screens/AuthScreen';
import OnboardingScreen     from '../screens/OnboardingScreen';
import HomeScreen           from '../screens/HomeScreen';
import TopicScreen          from '../screens/TopicScreen';
import ModeScreen           from '../screens/ModeScreen';
import MatchmakingScreen    from '../screens/MatchmakingScreen';
import DebateScreen         from '../screens/DebateScreen';
import ResultsScreen        from '../screens/ResultsScreen';
import DebateReviewScreen   from '../screens/DebateReviewScreen';
import HistoryScreen        from '../screens/HistoryScreen';
import LeaderboardScreen    from '../screens/LeaderboardScreen';
import ProfileScreen        from '../screens/ProfileScreen';
import SettingsScreen       from '../screens/SettingsScreen';
import GenerateTopicsScreen from '../screens/GenerateTopicsScreen';

import { COLORS } from '../utils/theme';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_CONFIG = {
  Home:        { icon: '⚡', label: 'Debate' },
  History:     { icon: '📋', label: 'History' },
  Leaderboard: { icon: '🏆', label: 'Ranks' },
  Profile:     { icon: '👤', label: 'Profile' },
};

const MainTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarIcon: ({ focused }) => (
        <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>
          {TAB_CONFIG[route.name]?.icon}
        </Text>
      ),
      tabBarLabel: ({ color }) => (
        <Text style={[styles.tabLabel, { color }]}>
          {TAB_CONFIG[route.name]?.label}
        </Text>
      ),
      tabBarActiveTintColor:   COLORS.primary,
      tabBarInactiveTintColor: COLORS.textMuted,
    })}
  >
    <Tab.Screen name="Home"        component={HomeScreen} />
    <Tab.Screen name="History"     component={HistoryScreen} />
    <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
    <Tab.Screen name="Profile"     component={ProfileScreen} />
  </Tab.Navigator>
);

const SplashScreen = () => (
  <View style={styles.splash}>
    <Text style={styles.splashIcon}>⚡</Text>
    <Text style={styles.splashTitle}>DebateAI</Text>
    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 32 }} />
  </View>
);

// Determines the first screen for authenticated users
const useInitialRoute = (isNewUser) => {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const check = async () => {
      if (isNewUser) {
        // Fresh registration — always show onboarding
        setInitialRoute('Onboarding');
        return;
      }
      // Check if existing user has already completed onboarding
      const done = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE);
      setInitialRoute(done === 'true' ? 'Main' : 'Onboarding');
    };
    check();
  }, [isNewUser]);

  return initialRoute;
};

export default function AppNavigator() {
  const { user, loading, isNewUser } = useAuth();
  const initialRoute = useInitialRoute(isNewUser);

  if (loading) return <SplashScreen />;

  // For authenticated users, wait until we know the initial route
  if (user && !initialRoute) return <SplashScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={user ? initialRoute : 'Auth'}
        screenOptions={{
          headerShown:  false,
          contentStyle: { backgroundColor: COLORS.bg },
          animation:    'slide_from_right',
        }}
      >
        {!user ? (
          /* ── Unauthenticated ─────────────────────────── */
          <Stack.Screen name="Auth" component={AuthScreen} options={{ animation: 'fade' }} />
        ) : (
          /* ── Authenticated ───────────────────────────── */
          <>
            {/* Main tab navigator — listed first so initialRouteName="Main" works for returning users */}
            <Stack.Screen name="Main" component={MainTabs} options={{ animation: 'fade' }} />

            {/* Onboarding — shown to new users via initialRouteName="Onboarding" */}
            <Stack.Screen
              name="Onboarding"
              component={OnboardingScreen}
              options={{ animation: 'fade', gestureEnabled: false }}
            />

            {/* Debate flow */}
            <Stack.Screen name="Topics"         component={TopicScreen}          options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Mode"           component={ModeScreen}           options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Matchmaking"    component={MatchmakingScreen}    options={{ animation: 'fade', gestureEnabled: false }} />
            <Stack.Screen name="Debate"         component={DebateScreen}         options={{ animation: 'fade', gestureEnabled: false }} />
            <Stack.Screen name="Results"        component={ResultsScreen}        options={{ animation: 'slide_from_bottom', gestureEnabled: false }} />
            <Stack.Screen name="DebateReview"   component={DebateReviewScreen}   options={{ animation: 'slide_from_right' }} />

            {/* Settings & Tools */}
            <Stack.Screen name="Settings"       component={SettingsScreen}       options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="GenerateTopics" component={GenerateTopicsScreen} options={{ animation: 'slide_from_right' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash:      { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' },
  splashIcon:  { fontSize: 56, marginBottom: 8 },
  splashTitle: { fontSize: 32, fontWeight: '700', color: COLORS.primary, letterSpacing: 2 },
  tabBar: {
    backgroundColor: COLORS.bgCard,
    borderTopColor:  COLORS.border,
    borderTopWidth:  1,
    paddingBottom:   8,
    paddingTop:      6,
    height:          62,
    elevation:       0,
    shadowOpacity:   0,
  },
  tabLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },
});
