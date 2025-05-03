// src/screens/ConversationsScreen.tsx (Using RPC with Argument, No Avatars - Corrected & Styled)

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
  // Removed Alert import as it wasn't used
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
  primary: '#FF6347', secondary: '#4682B4', background: '#FFFFFF', surface: '#F8F9FA', // Surface is good for card background
  textPrimary: '#212529', textSecondary: '#6C757D', textLight: '#FFFFFF', border: '#DEE2E6',
  pressedHighlight: '#E9ECEF', // Added a color for pressed state
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

  // --- Data Fetching (CORRECTED to use RPC with argument) ---
  const fetchConversations = useCallback(async () => {
    // ... (Keep the existing fetchConversations logic exactly as it was) ...
     if (!user) {
      setError('User not authenticated. Cannot fetch conversations.');
      setLoading(false);
      setRefreshing(false); // Ensure refreshing is stopped if user becomes null
      return;
    }
    // Check specifically for user.id existence as well
    if (!user.id) {
       setError('User authenticated but ID is missing. Cannot fetch conversations.');
       setLoading(false);
       setRefreshing(false);
       return;
    }

    console.log('[ConversationsScreen] Fetching conversations via RPC for user:', user.id);
    setError(null); // Clear previous errors
    if (!refreshing) {
        setLoading(true); // Only show full loading indicator if not refreshing
    }

    try {
      // *** MODIFIED PART: Pass user ID as an argument to the RPC function ***
      const { data, error: rpcError } = await supabase
        .rpc('get_user_conversations', {
           // --- IMPORTANT ---
           // Verify that 'p_user_id' is the EXACT name of the argument
           // your SQL function `get_user_conversations` expects.
           // If your function expects a different name (e.g., `user_id_input`, `current_user_id`),
           // update the key below accordingly.
           p_user_id: user.id
           // --- END IMPORTANT ---
        });

      // Handle potential RPC errors
      if (rpcError) {
        console.error('[ConversationsScreen] RPC Error:', rpcError);
        if (rpcError.code === '42883') {
             // Function not found or signature mismatch (wrong/missing arguments)
             throw new Error(`Database function 'get_user_conversations' not found or requires different arguments. Please ensure it's created/updated in the Supabase SQL Editor and accepts the parameter 'p_user_id'.`);
        } else if (rpcError.code === '42703') {
             // Undefined column/parameter - often means the argument name ('p_user_id') is wrong
             throw new Error(`Database function 'get_user_conversations' might be expecting a differently named parameter than 'p_user_id'. Check the SQL definition. Error: ${rpcError.message}`);
         } else {
            // Other database errors
            throw new Error(`Database error: ${rpcError.message} (Code: ${rpcError.code})`);
        }
      }

      // Log the raw data received from Supabase for debugging
      console.log('[ConversationsScreen] Raw Data from RPC:', data);

      // Validate the structure of the received data
      if (!data || !Array.isArray(data)) {
         console.warn('[ConversationsScreen] RPC returned null or non-array data. Setting conversations to empty.');
         setConversations([]);
         // Optional: Set a specific state or log if data is expected but structure is wrong
         // setError("Received invalid data structure from the server.");
      } else if (data.length === 0) {
         console.log('[ConversationsScreen] RPC returned an empty array. No conversations found.');
         setConversations([]); // Ensure state is empty array
      } else {
           // Process the valid data returned by the function
           const processedConversations: Conversation[] = data.map((item: any) => {
                // Add checks for potentially missing properties in the raw data item if necessary
                if (!item || typeof item !== 'object') {
                    console.warn('[ConversationsScreen] Skipping invalid item in RPC data:', item);
                    return null; // Skip this item if it's not a valid object
                }
                return {
                    room_id: item.room_id, // Ensure item.room_id exists
                    room_created_at: item.room_created_at,
                    other_participant: {
                    user_id: item.other_participant_user_id, // Ensure item.other_participant_user_id exists
                    first_name: item.other_participant_first_name ?? 'User',
                    },
                    last_message: {
                    content: item.last_message_content,
                    created_at: item.last_message_created_at,
                    sender_user_id: item.last_message_sender_user_id,
                    },
                };
            }).filter((conv): conv is Conversation => conv !== null); // Filter out any null items skipped due to errors

            console.log('[ConversationsScreen] Processed conversations from RPC:', processedConversations);
            setConversations(processedConversations);
      }

    } catch (err: any) {
      // Catch errors from the try block (including thrown RPC errors)
      console.error('[ConversationsScreen] Error during fetchConversations execution:', err);
      setError(err.message || 'An unexpected error occurred while fetching conversations.');
    } finally {
      // Ensure loading/refreshing indicators are turned off
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, refreshing]);

  // --- Effects ---
  useFocusEffect(
    useCallback(() => {
      // ... (Keep the existing useFocusEffect logic exactly as it was) ...
       if (user?.id) {
          fetchConversations();
      } else if(!user) {
          console.log("[ConversationsScreen] useFocusEffect: No user, skipping fetch.");
          setError('User not authenticated.'); // Set error if user is missing on focus
          setLoading(false); // Ensure loading is off
          setConversations([]); // Clear any stale conversations
      } else if (!user.id) {
           console.log("[ConversationsScreen] useFocusEffect: User exists but no ID, skipping fetch.");
           setError('User authenticated but ID is missing.');
           setLoading(false);
           setConversations([]);
      }
    }, [user, fetchConversations])
  );

  // --- Handlers ---
  const onRefresh = useCallback(() => {
    // ... (Keep the existing onRefresh logic exactly as it was) ...
    setRefreshing(true);
    fetchConversations();
  }, [fetchConversations]);

  // --- MODIFIED handlePressConversation ---
  const handlePressConversation = (item: Conversation) => {
     if (!item.other_participant?.user_id) {
        console.error("Cannot navigate: Other participant ID is missing for room", item.room_id);
        return;
     }
     console.log('Navigating to ChatRoomScreen for room:', item.room_id, 'with recipient:', item.other_participant.user_id);

     // *** --- Use parameter names expected by ChatRoomScreen --- ***
     navigation.navigate('ChatRoomScreen', {
       conversationId: item.room_id,                   // Changed from roomId
       targetUserName: item.other_participant.first_name ?? 'Chat', // Changed from recipientName
       targetUserId: item.other_participant.user_id,   // Changed from recipientId
     });
     // *** --- End Changes --- ***
  };
  // --- End MODIFIED handlePressConversation ---

  // --- Render Item for FlatList ---
  const renderConversationItem = ({ item }: { item: Conversation }) => {
    // ... (Keep the existing logic within renderConversationItem exactly as it was) ...
    const lastMessageContent = item.last_message?.content;
    const lastMessageSender = item.last_message?.sender_user_id;
    const lastMessageTimestamp = item.last_message?.created_at;

    const lastMessageText = lastMessageContent
     ? (lastMessageSender === user?.id ? 'You: ' : '') +
       (lastMessageContent.length > 35
         ? lastMessageContent.substring(0, 35) + '...'
         : lastMessageContent)
     : 'No messages yet';

    let lastMessageTime = '';
    if (lastMessageTimestamp) {
        try {
            lastMessageTime = formatDistanceToNowStrict(new Date(lastMessageTimestamp), { addSuffix: false });
        } catch (dateError) {
            console.error("Error formatting date:", lastMessageTimestamp, dateError);
            lastMessageTime = 'Invalid date';
        }
    }

    const participantName = item.other_participant?.first_name ?? 'User';

    return (
      <Pressable
        // *** MODIFIED STYLE PROP ***
        style={({ pressed }) => [
            styles.itemContainer, // Apply base card styles
            pressed && styles.itemPressed // Apply different style when pressed
        ]}
        onPress={() => handlePressConversation(item)} // Calls the modified handler
        // disabled={!item.other_participant?.user_id} // Optional: keep disabled logic if needed
      >
        {/* Avatar Image Removed */}
        <View style={styles.textContainer}>
          <Text style={styles.participantName}>{participantName}</Text>
          <Text style={styles.lastMessage} numberOfLines={1}>{lastMessageText}</Text>
        </View>
        <Text style={styles.timestamp}>{lastMessageTime}</Text>
      </Pressable>
    );
  };

  // --- Render Component ---
  // ... (Keep the existing loading/error/empty states rendering logic exactly as it was) ...
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Conversations...</Text>
      </SafeAreaView>
    );
  }

  if (error && conversations.length === 0) {
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
      {/* Display non-blocking error above list if needed */}
      {error && conversations.length > 0 && (
          <View style={styles.inlineErrorContainer}>
              <Text style={styles.inlineErrorText}>Warning: {error}</Text>
          </View>
      )}
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.room_id}
        style={styles.list}
        contentContainerStyle={conversations.length === 0 ? styles.listContentContainerEmpty : styles.listContentContainer}
        // *** REMOVED ItemSeparatorComponent ***
        // ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
            !loading && !error ? (
                <View style={styles.centered}>
                    <Text style={styles.emptyText}>No conversations yet.</Text>
                    <Text style={styles.emptySubText}>Start matching to chat!</Text>
                </View>
            ) : null
        }
        refreshControl={
            <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
            />
        }
      />
    </SafeAreaView>
  );
};

// --- Styles ---
// *** MODIFIED STYLES ***
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background // Main background remains white
    },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg, backgroundColor: colors.background },
    loadingText: { marginTop: spacing.md, fontSize: fonts.body1.fontSize, color: colors.textSecondary },
    errorText: { fontSize: fonts.body1.fontSize, color: colors.primary, textAlign: 'center', marginBottom: spacing.md },
    retryButton: { backgroundColor: colors.primary, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: borderRadius.xlarge, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41 },
    retryButtonText: { color: colors.textLight, fontSize: fonts.button.fontSize, fontWeight: fonts.button.fontWeight },
    emptyText: { fontSize: fonts.h3.fontSize, fontWeight: fonts.h3.fontWeight, color: colors.textSecondary, marginBottom: spacing.sm },
    emptySubText: { fontSize: fonts.body1.fontSize, color: colors.textSecondary, textAlign: 'center' },
    list: { flex: 1 },
    listContentContainer: {
        paddingVertical: spacing.sm, // Add some padding at the top/bottom of the list
        paddingHorizontal: spacing.sm, // Add horizontal padding so cards aren't edge-to-edge
        flexGrow: 1
    },
    listContentContainerEmpty: { flexGrow: 1, justifyContent: 'center' },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface, // Use surface color for the card background
        borderRadius: borderRadius.medium, // Add rounded corners
        padding: spacing.md, // Internal padding for content within the card
        marginVertical: spacing.xs, // Add vertical space between cards
        // Add shadows for depth
        elevation: 3, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 1.00,
    },
    itemPressed: {
        backgroundColor: colors.pressedHighlight, // Slightly darker background when pressed
        // You could also slightly change elevation or add a scale transform here if desired
    },
    // avatar style removed
    textContainer: {
        flex: 1, // Takes remaining space
        justifyContent: 'center',
        marginLeft: spacing.xs, // Add small left margin if no avatar
        marginRight: spacing.sm // Keep space before timestamp
    },
    participantName: {
        fontSize: fonts.body1.fontSize,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: spacing.xs
    },
    lastMessage: {
        fontSize: fonts.body2.fontSize,
        color: colors.textSecondary
    },
    timestamp: {
        fontSize: fonts.caption.fontSize,
        color: colors.textSecondary,
        alignSelf: 'flex-start', // Keep timestamp aligned to the top of its container
        marginTop: spacing.xs / 2 // Adjust vertical position slightly if needed
    },
    // *** REMOVED separator style as it's no longer used ***
    // separator: { height: 1, backgroundColor: colors.border, marginLeft: spacing.md },
    inlineErrorContainer: {
        marginHorizontal: spacing.sm, // Align with list padding
        marginBottom: spacing.sm, // Space before the first item
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: '#FFF3CD',
        borderRadius: borderRadius.small,
        borderLeftWidth: 4,
        borderLeftColor: '#FFC107' // Example warning accent color
    },
    inlineErrorText: {
        color: '#856404',
        fontSize: fonts.body2.fontSize
    },
});

export default ConversationsScreen;