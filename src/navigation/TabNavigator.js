import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import { colors } from '../theme';

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
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: Platform.OS === 'ios' ? 96 : 76,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600', marginTop: 2 },
        tabBarIconStyle: { marginTop: 2 },
        tabBarIcon: ({ focused, color }) => {
          const set = tabIcons[route.name] || tabIcons.HomeTab;
          return (
            <Ionicons
              name={focused ? set.focused : set.unfocused}
              size={30}
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
        options={{ title: 'Messages' }}
      />
      <Tab.Screen
        name="EventsTab"
        component={EventsStack}
        options={{ title: 'Events' }}
      />
    </Tab.Navigator>
  );
}
