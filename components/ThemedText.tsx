import { Text as RNText, type TextProps } from 'react-native';
import { useSettings } from '@/utils/settings';

export function Text({ style, ...props }: TextProps) {
  const { colors } = useSettings();
  return <RNText style={[{ color: colors.textPrimary }, style]} {...props} />;
}
