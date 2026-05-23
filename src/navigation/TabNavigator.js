import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import { colors } from '../theme';
import { useUnread } from '../context/UnreadContext';

// Home / Map
import HomeScreen from '../screens/home/HomeScreen';
import ProfileScreen from '../screens/home/ProfileScreen';

// Messages
import MessagesScreen from '../screens/messages/MessagesScreen';
import DMScreen from '../screens/messages/DMScreen';
import NewMessageScreen from '../screens/messages/NewMessageScreen';

// Calendar
import MyCalendarScreen from '../screens/calendar/MyCalendarScreen';
import AddEventScreen from '../screens/calendar/AddEventScreen';
import RemoveEventScreen from '../screens/calendar/RemoveEventScreen';

// Friends
import FriendsOverlapScreen from '../screens/friends/FriendsOverlapScreen';
import FriendsFilterScreen from '../screens/friends/FriendsFilterScreen';
import MyFriendsScreen from '../screens/friends/MyFriendsScreen';

// Events
import EventsLogScreen from '../screens/events/EventsLogScreen';
import EventDetailScreen from '../screens/events/EventDetailScreen';
import CreateEventScreen from '../screens/events/CreateEventScreen';
import EventInvitePickerScreen from '../screens/events/EventInvitePickerScreen';

const Tab = createBottomTabNavigator();

function stackOptions() {
  return { headerShown: false, contentStyle: { backgroundColor: colors.bg } };
}

function HomeStack() {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={stackOptions()}>
      <Stack.Screen name="HomeMap" component={HomeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}

function MessagesStack() {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={stackOptions()}>
      <Stack.Screen name="MessagesList" component={MessagesScreen} />
      <Stack.Screen name="DM" component={DMScreen} />
      <Stack.Screen name="NewMessage" component={NewMessageScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
    </Stack.Navigator>
  );
}

function CalendarStack() {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={stackOptions()}>
      <Stack.Screen name="MyCalendar" component={MyCalendarScreen} />
      <Stack.Screen name="AddEvent" component={AddEventScreen} />
      <Stack.Screen name="RemoveEvent" component={RemoveEventScreen} />
    </Stack.Navigator>
  );
}

function FriendsStack() {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={stackOptions()}>
      <Stack.Screen name="FriendsOverlap" component={FriendsOverlapScreen} />
      <Stack.Screen name="FriendsFilter" component={FriendsFilterScreen} />
      <Stack.Screen name="MyFriends" component={MyFriendsScreen} />
    </Stack.Navigator>
  );
}

function EventsStack() {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={stackOptions()}>
      <Stack.Screen name="EventsLog" component={EventsLogScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
      <Stack.Screen name="EventInvitePicker" component={EventInvitePickerScreen} />
    </Stack.Navigator>
  );
}

const tabIcons = {
  HomeTab: { focused: 'map', unfocused: 'map-outline' },
  MessagesTab: { focused: 'chatbubble', unfocused: 'chatbubble-outline' },
  CalendarTab: { focused: 'calendar', unfocused: 'calendar-outline' },
  FriendsTab: { focused: 'people', unfocused: 'people-outline' },
  EventsTab: { focused: 'megaphone', unfocused: 'megaphone-outline' },
};

export default function TabNavigator() {
  const { total: unreadTotal } = useUnread();
  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          // Drop the default 1px hairline border in favor of a soft
          // top-edge shadow that lifts the bar off the content below.
          borderTopWidth: 0,
          borderTopColor: 'transparent',
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 24 : 6,
          // Inset the tab items from the screen edges so they don't
          // sit flush against the rounded-corner safe areas.
          paddingHorizontal: 22,
          shadowColor: '#0B1020',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 12,
        },
        tabBarItemStyle: { paddingHorizontal: 2 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 1 },
        tabBarIconStyle: { marginTop: 0 },
        tabBarIcon: ({ focused, color }) => {
          const set = tabIcons[route.name] || tabIcons.HomeTab;
          return (
            <Ionicons
              name={focused ? set.focused : set.unfocused}
              size={26}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="CalendarTab"
        component={CalendarStack}
        options={{ title: 'Calendar' }}
      />
      <Tab.Screen
        name="FriendsTab"
        component={FriendsStack}
        options={{ title: 'Friends' }}
      />
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ title: 'Map' }} />
      <Tab.Screen
        name="MessagesTab"
        component={MessagesStack}
        options={{
          title: 'Messages',
          tabBarBadge: unreadTotal > 0 ? (unreadTotal > 9 ? '9+' : unreadTotal) : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.danger,
            color: '#fff',
            fontSize: 11,
            fontWeight: '800',
            minWidth: 18,
            height: 18,
            lineHeight: 16,
          },
        }}
      />
      <Tab.Screen
        name="EventsTab"
        component={EventsStack}
        options={{ title: 'Events' }}
      />
    </Tab.Navigator>
  );
}
