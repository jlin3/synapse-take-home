import { useEffect, useState } from 'react';
import { View, Text, YStack } from 'tamagui';
import { SafeAreaView } from 'react-native-safe-area-context';

import { apiGet } from '../api/client';

export default function WelcomeScreen() {
  const [apiStatus, setApiStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const checkApi = async () => {
      try {
        await apiGet<{ unread_count: number }>('/messages/unread-count');
        setApiStatus('connected');
      } catch (e: unknown) {
        setApiStatus('error');
        setErrorMessage(e instanceof Error ? e.message : 'Unknown error');
      }
    };
    checkApi();
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <YStack flex={1} padding="$4" justifyContent="center" alignItems="center" gap="$4">
        <Text fontSize="$8" fontWeight="700">
          Synapse Take-Home
        </Text>

        <View
          padding="$4"
          borderRadius="$4"
          backgroundColor={
            apiStatus === 'connected'
              ? '$green2'
              : apiStatus === 'error'
                ? '$red2'
                : '$gray2'
          }
          width="100%"
        >
          <Text fontSize="$4" fontWeight="600">
            {apiStatus === 'checking' && 'Checking API connection...'}
            {apiStatus === 'connected' && 'API connected — you are ready to build.'}
            {apiStatus === 'error' && 'API connection failed'}
          </Text>
          {errorMessage && (
            <Text fontSize="$2" color="$red11" marginTop="$2">
              {errorMessage}
            </Text>
          )}
        </View>

        <Text fontSize="$3" color="$gray11" textAlign="center" lineHeight="$3">
          Replace this screen with your messaging UI.{'\n'}
          See ASSESSMENT.md for full instructions.
        </Text>
      </YStack>
    </SafeAreaView>
  );
}
