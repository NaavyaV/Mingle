import OnboardingShell from './OnboardingShell';
import NameStep from './steps/NameStep';
import InterestsStep from './steps/InterestsStep';
import ScheduleStep from './steps/ScheduleStep';
import LocationStep from './steps/LocationStep';
import AvatarStep from './steps/AvatarStep';
import { DEFAULT_AVATAR } from '../../components/Avatar/options';
import { useUser } from '../../context/UserContext';

const STEPS = [
  {
    id: 'name',
    title: "What's your name?",
    subtitle: "We'll use this on your profile.",
    component: NameStep,
    canContinue: NameStep.canContinue,
  },
  {
    id: 'interests',
    title: 'Pick a few interests',
    subtitle: 'Helps us suggest people you might click with.',
    component: InterestsStep,
    canContinue: InterestsStep.canContinue,
  },
  {
    id: 'schedule',
    title: 'Bring in your schedule',
    subtitle: 'Import it later, or grab a demo for now.',
    component: ScheduleStep,
    canContinue: ScheduleStep.canContinue,
  },
  {
    id: 'location',
    title: 'Share your location',
    subtitle: 'You can change this anytime in settings.',
    component: LocationStep,
    canContinue: LocationStep.canContinue,
  },
  {
    id: 'avatar',
    title: 'Build your avatar',
    subtitle: 'Make it feel like you.',
    component: AvatarStep,
    canContinue: AvatarStep.canContinue,
  },
];

const INITIAL = {
  name: '',
  school: '',
  interests: [],
  schedule: null,
  scheduleSource: null,
  scheduleVisibility: 'friends',
  locationStatus: 'pending',
  avatar: DEFAULT_AVATAR,
  status: 'studying rn',
};

export default function OnboardingScreen({ navigation }) {
  const { signUp } = useUser();

  const handleFinish = async (value) => {
    await signUp({
      name: value.name.trim(),
      school: value.school?.trim() || null,
      interests: value.interests,
      schedule: value.schedule,
      scheduleSource: value.scheduleSource,
      scheduleVisibility: value.scheduleVisibility,
      locationStatus: value.locationStatus,
      avatar: value.avatar,
      status: value.status,
    });
    // RootNavigator switches to Home automatically once `user` is set.
  };

  return (
    <OnboardingShell
      steps={STEPS}
      initialValue={INITIAL}
      onFinish={handleFinish}
      finishLabel="Create my account"
      onClose={() => navigation.goBack()}
    />
  );
}
