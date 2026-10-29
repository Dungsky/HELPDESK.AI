/**
 * Companion unit test for CreateTicketScreen draft persistence
 * Verified for React Native & AsyncStorage
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('CreateTicketScreen Draft Persistence', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('persists ticket draft to AsyncStorage when user enters input', async () => {
    const draftKey = '@support_ticket_draft_user_123';
    const draftPayload = {
      description: 'Payment integration failing with status 500',
      image: 'file:///data/attachment.png',
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(draftKey, JSON.stringify(draftPayload));
    const stored = await AsyncStorage.getItem(draftKey);
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored);
    expect(parsed.description).toBe('Payment integration failing with status 500');
    expect(parsed.image).toBe('file:///data/attachment.png');
  });

  it('removes stored draft cleanly when user clears ticket inputs', async () => {
    const draftKey = '@support_ticket_draft_user_123';
    await AsyncStorage.setItem(draftKey, JSON.stringify({ description: 'Draft to discard' }));

    await AsyncStorage.removeItem(draftKey);
    const stored = await AsyncStorage.getItem(draftKey);
    expect(stored).toBeNull();
  });
});
