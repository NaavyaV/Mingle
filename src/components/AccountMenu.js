import { Pressable, ActionSheetIOS, Alert, Platform } from 'react-native';

/**
 * Renders any child as the trigger for an iOS-native action sheet (with an
 * Alert fallback on Android). Pulls account-level actions out of HomeScreen so
 * we can reuse the same menu wherever a user's avatar is tappable.
 */
export default function AccountMenu({ onSignOut, onDelete, children }) {
  const handleDelete = () => {
    Alert.alert(
      'Delete account?',
      'This permanently removes your account and schedule. You can create a new one anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: onDelete,
        },
      ]
    );
  };

  const showMenu = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Sign out', 'Delete account'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
          title: 'Account',
        },
        (idx) => {
          if (idx === 1) onSignOut();
          else if (idx === 2) handleDelete();
        }
      );
      return;
    }
    Alert.alert('Account', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', onPress: onSignOut },
      { text: 'Delete account', style: 'destructive', onPress: handleDelete },
    ]);
  };

  return (
    <Pressable onPress={showMenu} hitSlop={10}>
      {children}
    </Pressable>
  );
}
