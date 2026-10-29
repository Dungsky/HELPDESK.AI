import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING, SHADOWS } from '../../styles/theme';
import { ArrowLeft, Sparkles, Send, Image as ImageIcon, X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useNotification } from '../../components/NotificationProvider';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

const DRAFT_STORAGE_KEY = '@support_ticket_draft';

const CreateTicketScreen = () => {
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const navigation = useNavigation();
  const { success, error: notifyError } = useNotification();

  useEffect(() => {
    checkForSavedDraft();
  }, []);

  useEffect(() => {
    if (description || image) {
      saveDraft(description, image);
    }
  }, [description, image]);

  const saveDraft = async (desc, imgUri) => {
    try {
      const draftData = JSON.stringify({ description: desc, image: imgUri, updatedAt: new Date().toISOString() });
      await AsyncStorage.setItem(DRAFT_STORAGE_KEY, draftData);
    } catch (e) {
      console.error('Failed to save draft to storage', e);
    }
  };

  const checkForSavedDraft = async () => {
    try {
      const savedDraft = await AsyncStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed.description || parsed.image) {
          Alert.alert(
            'Restore Draft?',
            'We found an unsaved ticket draft from your previous session. Would you like to restore it?',
            [
              {
                text: 'Discard',
                style: 'cancel',
                onPress: async () => {
                  await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
                },
              },
              {
                text: 'Restore',
                onPress: () => {
                  if (parsed.description) setDescription(parsed.description);
                  if (parsed.image) setImage(parsed.image);
                },
              },
            ],
            { cancelable: true }
          );
        }
      }
    } catch (e) {
      console.error('Failed to load draft from storage', e);
    }
  };

  const clearDraft = async () => {
    try {
      await AsyncStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear draft storage', e);
    }
  };

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions?.Images || 'images',
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      notifyError('Empty Request', 'Please describe your issue first.');
      return;
    }
    
    setLoading(true);
    try {
      let base64 = null;
      if (image) {
        const response = await fetch(image);
        const blob = await response.blob();
        base64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }

      await clearDraft();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      navigation.navigate('AIProcessing', {
        text: description,
        image_base64: base64,
        image_text: ""
      });
    } catch (e) {
      notifyError('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={COLORS.text || '#0F172A'} />
          </TouchableOpacity>
          <Text style={styles.title}>New Request</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.aiBanner}>
            <Sparkles size={20} color={COLORS.primary || '#2563EB'} />
            <Text style={styles.aiBannerText}>
              Describe your issue naturally. Our service will analyze and route it to the right team.
            </Text>
          </View>

          <View style={styles.inputCard}>
            <View style={styles.inputHeader}>
              <Text style={styles.inputLabel}>Issue Details</Text>
              <Text style={styles.charCount}>{description.length}/1000</Text>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Describe what's wrong in detail..."
              placeholderTextColor={COLORS.textMuted || '#64748B'}
              multiline
              value={description}
              onChangeText={setDescription}
              numberOfLines={8}
              textAlignVertical="top"
            />

            {image && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: image }} style={styles.imagePreview} />
                <TouchableOpacity onPress={() => setImage(null)} style={styles.removeImageBtn}>
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.attachmentBtn} onPress={pickImage}>
                <ImageIcon size={20} color={COLORS.primary || '#2563EB'} />
                <Text style={styles.attachmentText}>{image ? 'Change Screenshot' : 'Attach Screenshot'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.btn, !description.trim() && styles.btnDisabled]} 
            onPress={handleSubmit} 
            disabled={loading || !description.trim()}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white || '#FFFFFF'} />
            ) : (
              <>
                <Text style={styles.btnText}>Analyze & Submit</Text>
                <Send size={18} color={COLORS.white || '#FFFFFF'} />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md || 16,
    paddingVertical: SPACING.sm || 12,
  },
  backBtn: {
    padding: SPACING.xs || 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text || '#0F172A',
  },
  scrollContent: {
    padding: SPACING.md || 16,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight || '#EFF6FF',
    padding: SPACING.md || 16,
    borderRadius: 12,
    marginBottom: SPACING.md || 16,
    gap: SPACING.sm || 8,
  },
  aiBannerText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.primary || '#2563EB',
    lineHeight: 20,
  },
  inputCard: {
    backgroundColor: COLORS.card || '#FFFFFF',
    borderRadius: 16,
    padding: SPACING.md || 16,
    marginBottom: SPACING.md || 16,
    ...(SHADOWS.small || {}),
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs || 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text || '#0F172A',
  },
  charCount: {
    fontSize: 12,
    color: COLORS.textMuted || '#64748B',
  },
  input: {
    fontSize: 15,
    color: COLORS.text || '#0F172A',
    minHeight: 120,
  },
  imagePreviewContainer: {
    position: 'relative',
    marginTop: SPACING.md || 16,
  },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: 8,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  actionRow: {
    marginTop: SPACING.md || 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border || '#E2E8F0',
    paddingTop: SPACING.sm || 12,
  },
  attachmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs || 8,
  },
  attachmentText: {
    fontSize: 14,
    color: COLORS.primary || '#2563EB',
    fontWeight: '500',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary || '#2563EB',
    paddingVertical: SPACING.md || 16,
    borderRadius: 12,
    gap: SPACING.xs || 8,
    ...(SHADOWS.medium || {}),
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    color: COLORS.white || '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CreateTicketScreen;
