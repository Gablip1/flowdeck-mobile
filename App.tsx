import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useN8nStore } from './src/store/useN8nStore';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export default function App() {
  const [isInitializing, setIsInitializing] = useState(true);
  const loadInstances = useN8nStore(state => state.loadInstances);
  const fetchWorkflows = useN8nStore(state => state.fetchWorkflows);

  useEffect(() => {
    const init = async () => {
      await loadInstances();
      const { activeInstanceId } = useN8nStore.getState();
      if (activeInstanceId) {
        await fetchWorkflows();
      }
      setIsInitializing(false);
    };
    init();
  }, []);

  if (isInitializing) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FF6C37" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
            <BottomSheetModalProvider>
                <AppNavigator />
            </BottomSheetModalProvider>
        </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F111A',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
