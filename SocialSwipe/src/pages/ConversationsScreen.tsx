// src/screens/ConversationsScreen.tsx (Using RPC, No Avatars - Corrected)

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  // Image, // Removed Image import
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatDistanceToNowStrict } from 'date-fns';

import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../../App'; // Adjust path if needed

// --- Types ---
interface ParticipantProfile {
  user_id: string;
  first_name: string | null;
  // avatar_url: string | null; // Removed avatar
}
interface LastMessage {
  content: string | null;
  created_at: string | null;
  sender_user_id: string | null;
}
interface Conversation {
  room_id: string;
  room_created_at: string;
  other_participant: ParticipantProfile;
  last_message: LastMessage;
}
type ConversationsNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ConversationsScreen'
>;
// --- End Types ---

// --- Hardcoded Colors/Values ---
const colors = {
  primary: '#FF6347', secondary: '#4682B4', background: '#FFFFFF', surface: '#F8F9FA',
  textPrimary: '#212529', textSecondary: '#6C757D', textLight: '#FFFFFF', border: '#DEE2E6',
};
const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
const fonts = {
  body1: { fontSize: 16 }, body2: { fontSize: 14 }, caption: { fontSize: 12 },
  h3: { fontSize: 20, fontWeight: '600' }, button: { fontSize: 16, fontWeight: 'bold' },
};
const borderRadius = { small: 4, medium: 8, large: 12, xlarge: 20 };
// --- End Hardcoded Values ---


// --- Component ---
const ConversationsScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<ConversationsNavigationProp>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // --- Data Fetching (CORRECTED to use RPC) ---
   const fetchConversations = useCallback(async () => {
     if (!user) {
      setError('User not authenticated.');
      setLoading(false);
      return;
    }
    console.log('[ConversationsScreen] Fetching conversations via RPC for user:', user.id);
    setError(null);
    if (!refreshing) setLoading(true);

    try {
      // *** THIS IS THE CORRECTED PART: Use supabase.rpc() ***
      const { data, error: rpcError } = await supabase
        .rpc('get_user_conversations'); // Call the function by its name

      if (rpcError) {
        console.error('[ConversationsScreen] RPC Error:', rpcError);
        if (rpcError.code === '42883') {
             throw new Error(`Database function 'get_user_conversations' not found. Please ensure it's created/updated in the Supabase SQL Editor.`);
        } else {
            throw new Error(`Database error: ${rpcError.message}`);
        }
      }

      console.log('[ConversationsScreen] Data from RPC:', data);

      if (!data) {
        setConversations([]);
        return;
      }

      // Process the data returned by the function
      const processedConversations: Conversation[] = data.map((item: any) => ({
        room_id: item.room_id,
        room_created_at: item.room_created_at,
        other_participant: {
          user_id: item.other_participant_user_id,
          first_name: item.other_participant_first_name ?? 'User',
          // avatar_url: item.other_participant_avatar_url, // Removed
        },
        last_message: {
          content: item.last_message_content,
          created_at: item.last_message_created_at,
          sender_user_id: item.last_message_sender_user_id,
        },
      }));

       console.log('[ConversationsScreen] Processed conversations from RPC:', processedConversations);
      setConversations(processedConversations);

    } catch (err: any) {
      console.error('[ConversationsScreen] Error fetching conversations:', err);
      setError(err.message || 'Failed to fetch conversations.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
   }, [user, refreshing]);

  // --- Effects ---
   useFocusEffect(
    useCallback(() => {
      fetchConversations();
    }, [fetchConversations])
  );

  // --- Handlers ---
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);

  const handlePressConversation = (item: Conversation) => {
     console.log('Navigating to ChatRoomScreen for room:', item.room_id);
    navigation.navigate('ChatRoomScreen', {
      roomId: item.room_id,
      recipientName: item.other_participant.first_name ?? 'Chat',
      // recipientAvatarUrl: item.other_participant.avatar_url, // Removed
      recipientId: item.other_participant.user_id,
    });
  };

  // --- Render Item for FlatList ---
  const renderConversationItem = ({ item }: { item: Conversation }) => {
     const lastMessageText = item.last_message.content
      ? (item.last_message.sender_user_id === user?.id ? 'You: ' : '') +
        (item.last_message.content.length > 35
          ? item.last_message.content.substring(0, 35) + '...'
          : item.last_message.content)
      : 'No messages yet';
    const lastMessageTime = item.last_message.created_at
      ? formatDistanceToNowStrict(new Date(item.last_message.created_at), { addSuffix: false })
      : '';
    return (
      <Pressable
        style={({ pressed }) => [styles.itemContainer, pressed && styles.itemPressed]}
        onPress={() => handlePressConversation(item)}
      >
         {/* Avatar Image Removed */}
        <View style={styles.textContainer}>
          <Text style={styles.participantName}>{item.other_participant.first_name ?? 'User'}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>{lastMessageText}</Text>
        </View>
        <Text style={styles.timestamp}>{lastMessageTime}</Text>
      </Pressable>
    );
  };

  // --- Render Component ---
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Conversations...</Text>
      </SafeAreaView>
    );
  }
  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
         <Pressable onPress={fetchConversations} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
         </Pressable>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.room_id}
        style={styles.list}
        contentContainerStyle={styles.listContentContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={ <View style={styles.centered}> <Text style={styles.emptyText}>No conversations yet.</Text> <Text style={styles.emptySubText}>Start matching to chat!</Text> </View> }
        refreshControl={ <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} /> }
      />
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.background },
    loadingText: { marginTop: spacing.md, fontSize: fonts.body1.fontSize, color: colors.textSecondary },
    errorText: { fontSize: fonts.body1.fontSize, color: colors.primary, textAlign: 'center', marginBottom: spacing.md },
    retryButton: { backgroundColor: colors.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: borderRadius.xlarge },
    retryButtonText: { color: colors.textLight, fontSize: fonts.button.fontSize, fontWeight: fonts.button.fontWeight },
    emptyText: { fontSize: fonts.h3.fontSize, fontWeight: fonts.h3.fontWeight, color: colors.textSecondary, marginBottom: spacing.sm },
    emptySubText: { fontSize: fonts.body1.fontSize, color: colors.textSecondary, textAlign: 'center' },
    list: { flex: 1 },
    listContentContainer: { paddingVertical: spacing.sm, flexGrow: 1 },
    itemContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.background },
    itemPressed: { backgroundColor: colors.surface },
    // avatar style removed
    textContainer: { flex: 1, justifyContent: 'center', marginRight: spacing.sm },
    participantName: { fontSize: fonts.body1.fontSize, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs },
    lastMessage: { fontSize: fonts.body2.fontSize, color: colors.textSecondary },
    timestamp: { fontSize: fonts.caption.fontSize, color: colors.textSecondary, alignSelf: 'flex-start', marginTop: spacing.xs },
    separator: { height: 1, backgroundColor: colors.border, marginLeft: spacing.md },
});

export default ConversationsScreen;

