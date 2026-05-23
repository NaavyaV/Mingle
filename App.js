import { SafeAreaProvider } from 'react-native-safe-area-context';
import { UserProvider } from './src/context/UserContext';
import RootNavigator from './src/navigation/RootNavigator';

// Root component: wraps the navigation tree with the user context and
// safe-area providers. All app state is owned further down.
export default function App() {
  return (
    <SafeAreaProvider>
      <UserProvider>
        <RootNavigator />
      </UserProvider>
    </SafeAreaProvider>
  );
}
