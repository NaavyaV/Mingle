import { View } from 'react-native';
import AvatarBuilder from '../../../components/Avatar/AvatarBuilder';

export default function AvatarStep({ value, setValue }) {
  return (
    <View style={{ flex: 1 }}>
      <AvatarBuilder
        value={value.avatar}
        onChange={(next) => setValue({ avatar: next })}
      />
    </View>
  );
}

AvatarStep.canContinue = (v) => !!v.avatar;
