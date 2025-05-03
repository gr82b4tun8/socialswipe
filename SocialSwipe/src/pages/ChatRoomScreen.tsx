// src/screens/ChatRoomScreen.tsx

import React, { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns'; // Using format for more control over timestamp display
import { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { RootStackParamList } from '../../App'; // Adjust path if needed

// --- Types ---
interface Message {
  id: string;
  room_id: string; // Corresponds to conversationId/roomId
  sender_id: string;
  content: string;
  created_at: string;
  // Optional: Add sender profile info if you join it in the query
  // sender_first_name?: string;
}

// Get the route prop types from the RootStackParamList
// Ensure RootStackParamList defines ChatRoomScreen params correctly:
// ChatRoomScreen: { conversationId: string; targetUserId: string; targetUserName?: string; /* other potential params */ }
type ChatRoomRouteProp = RouteProp<RootStackParamList, 'ChatRoomScreen'>;
type ChatRoomNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ChatRoomScreen'>;
// --- End Types ---

// --- Hardcoded Colors/Values (reuse from ConversationsScreen or centralize) ---
const colors = {
  primary: '#FF6347', secondary: '#4682B4', background: '#FFFFFF', surface: '#F8F9FA',
  textPrimary: '#212529', textSecondary: '#6C757D', textLight: '#FFFFFF', border: '#DEE2E6',
  sentBubble: '#DCF8C6', receivedBubble: '#FFFFFF', inputBackground: '#F1F0F0',
};
const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
const fonts = {
  body1: { fontSize: 16 }, body2: { fontSize: 14 }, caption: { fontSize: 12 },
  h3: { fontSize: 20, fontWeight: '600' }, button: { fontSize: 16, fontWeight: 'bold' },
};
const borderRadius = { small: 4, medium: 8, large: 12, xlarge: 20 };
// --- End Hardcoded Values ---

// --- Component ---
const ChatRoomScreen: React.FC = () => {
  const { user } = useAuth();
  const route = useRoute<ChatRoomRouteProp>();
  const navigation = useNavigation<ChatRoomNavigationProp>();

  // *** --- MODIFIED PARAMETER DESTRUCTURING --- ***
  // Destructure the actual parameters passed from ProfileDetailScreen
  const { conversationId, targetUserName, targetUserId /*, recipientAvatarUrl */ } = route.params;
  // Assign them to the variable names used within this component's logic
  const roomId = conversationId;
  const recipientName = targetUserName;
  const recipientId = targetUserId; // Store recipientId if needed later
  // *** --- END MODIFICATION --- ***

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Set Header Title Dynamically
  useLayoutEffect(() => {
    // Use the 'recipientName' variable derived from 'targetUserName'
    navigation.setOptions({
      title: recipientName ?? 'Chat',
      // Optional: Add Avatar to header if you pass the URL
      // headerTitle: () => (
      //   <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      //     {recipientAvatarUrl && <Image source={{ uri: recipientAvatarUrl }} style={styles.headerAvatar} />}
      //     <Text style={styles.headerTitle}>{recipientName ?? 'Chat'}</Text>
      //   </View>
      // ),
    });
    // Dependency array uses 'recipientName'
  }, [navigation, recipientName /*, recipientAvatarUrl */]);

  // --- Data Fetching ---
  // useCallback depends on 'roomId' which is now correctly assigned from 'conversationId'
  const fetchMessages = useCallback(async () => {
    // This check now uses the correctly assigned 'roomId'
    if (!roomId || !user) {
        // If conversationId wasn't passed correctly, roomId will be undefined here
        setError('Room ID or User missing. Cannot load messages.');
        setLoading(false);
        return;
    }
    console.log(`[ChatRoomScreen] Fetching messages for room: ${roomId}`);
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('messages')
        .select('*') // Select specific columns if needed: 'id, room_id, sender_user_id, content, created_at'
        .eq('room_id', roomId) // Query uses the 'roomId' variable
        .order('created_at', { ascending: true }); // Fetch oldest first for correct FlatList order

      if (fetchError) {
        throw fetchError;
      }

      console.log(`[ChatRoomScreen] Fetched ${data?.length ?? 0} messages for room ${roomId}.`);
      setMessages(data || []);

    } catch (err: any) {
      console.error(`[ChatRoomScreen] Error fetching messages for room ${roomId}:`, err);
      setError(err.message || 'Failed to fetch messages.');
      Alert.alert("Error", "Could not load messages. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [roomId, user]); // Dependency array correctly includes 'roomId'

  // --- Realtime Subscription ---
  // useEffect depends on 'roomId' which is now correctly assigned
  useEffect(() => {
    // This check uses the correctly assigned 'roomId'
    if (!roomId || !user) {
        console.log('[ChatRoomScreen] Room ID or User missing, skipping fetch and subscription.');
        // Ensure loading is false if we bail early after initial state was true
        if(loading) setLoading(false);
        return;
    }

    fetchMessages(); // Fetch initial messages using the correct roomId

    // --- Setup Realtime Subscription ---
    // Subscription uses the correct 'roomId'
    console.log(`[ChatRoomScreen] Subscribing to messages in room: ${roomId}`);
    const channel = supabase
      .channel(`room_${roomId}`) // Channel name uses roomId
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_id=eq.${roomId}`, // Filter uses roomId
        },
        (payload) => {
          console.log('[ChatRoomScreen] Realtime INSERT received:', payload);
          const newMessagePayload = payload.new as Message;
          // Add the new message if it's not already in the list (prevents duplicates if sender is self)
           setMessages((prevMessages) => {
                // Ensure message has an ID before checking existence
                if (!newMessagePayload.id || prevMessages.some(msg => msg.id === newMessagePayload.id)) {
                    console.log(`[ChatRoomScreen] Duplicate or invalid message received (ID: ${newMessagePayload.id}), skipping.`);
                    return prevMessages; // Already exists or invalid, do nothing
                }
                console.log(`[ChatRoomScreen] Adding new message (ID: ${newMessagePayload.id}) via realtime.`);
                return [...prevMessages, newMessagePayload]; // Add new message
            });
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
            console.log(`[ChatRoomScreen] Realtime subscribed successfully to room: ${roomId}`);
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.error(`[ChatRoomScreen] Realtime subscription error/closed (${status}) for room ${roomId}:`, err);
            // Optionally, try to resubscribe or show an error
            setError(`Realtime connection issue (${status}). New messages might be delayed.`);
        }
      });

      channelRef.current = channel; // Store channel reference

    // --- Cleanup on unmount ---
    return () => {
      if (channelRef.current) {
        console.log(`[ChatRoomScreen] Unsubscribing from room: ${roomId}`);
        supabase.removeChannel(channelRef.current)
            .then(() => console.log(`[ChatRoomScreen] Realtime unsubscribed successfully from room ${roomId}.`))
            .catch(err => console.error(`[ChatRoomScreen] Error unsubscribing from room ${roomId}:`, err));
        channelRef.current = null;
      }
    };
    // Dependency array correctly includes 'roomId', 'user', and 'fetchMessages'
  }, [roomId, user, fetchMessages]);


  // --- Send Message ---
  // useCallback depends on 'roomId' which is now correctly assigned
  const handleSendMessage = useCallback(async () => {
    // This check uses the correctly assigned 'roomId'
    if (!newMessage.trim() || !user || !roomId || sending) {
      return; // Don't send empty messages or if already sending
    }

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    setSending(true);
    setError(null); // Clear previous errors

    const messageData = {
      room_id: roomId, // Use the 'roomId' variable here
      sender_id: user.id,
      content: messageContent,
      // created_at is handled by the database default
    };

    console.log('[ChatRoomScreen] Sending message:', messageData);

    try {
      const { error: insertError } = await supabase
        .from('messages')
        .insert(messageData);

      if (insertError) {
        throw insertError;
      }
      console.log('[ChatRoomScreen] Message sent successfully.');
      // The message will appear via the realtime subscription, so no need to manually add it here
      // flatListRef.current?.scrollToEnd({ animated: true }); // Optional: scroll immediately

    } catch (err: any) {
      console.error('[ChatRoomScreen] Error sending message:', err);
      setError(err.message || 'Failed to send message.');
      Alert.alert("Error", "Could not send message. Please try again.");
      // Restore the typed message if sending failed
      setNewMessage(messageContent);
    } finally {
      setSending(false);
    }
    // Dependency array correctly includes 'roomId'
  }, [newMessage, user, roomId, sending]);

  // --- Render Message Item ---
  const renderMessageItem = ({ item }: { item: Message }) => {
    const isCurrentUser = item.sender_id === user?.id;
    return (
      <View style={[styles.messageRow, isCurrentUser ? styles.messageRowSent : styles.messageRowReceived]}>
        <View style={[styles.messageBubble, isCurrentUser ? styles.messageBubbleSent : styles.messageBubbleReceived]}>
          <Text style={styles.messageText}>{item.content}</Text>
           <Text style={[styles.timestamp, isCurrentUser ? styles.timestampSent : styles.timestampReceived]}>
             {format(new Date(item.created_at), 'p')} {/* Format time e.g., 3:30 PM */}
          </Text>
        </View>
      </View>
    );
  };

  // --- Render Component ---
  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Messages...</Text>
      </SafeAreaView>
    );
  }

  // Note: Error state is handled inline below, showing previous messages if available

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 0} // Adjust as needed
      >
        {/* Message List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessageItem}
          keyExtractor={(item) => item.id}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })} // Scroll down when new messages arrive/load
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })} // Scroll down on initial layout
          ListEmptyComponent={
            !loading && !error ? ( // Only show if not loading and no error occurred
              <View style={styles.centered}>
                <Text style={styles.emptyText}>No messages yet.</Text>
                <Text style={styles.emptySubText}>Be the first to say hello!</Text>
              </View>
            ) : null
          }
        />

        {/* Error Display */}
        {error && <Text style={styles.errorText}>Error: {error}</Text>}


        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type your message..."
            placeholderTextColor={colors.textSecondary}
            multiline
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendButton,
              (sending || !newMessage.trim()) && styles.sendButtonDisabled,
              pressed && !sending && newMessage.trim() && styles.sendButtonPressed,
            ]}
            onPress={handleSendMessage}
            disabled={sending || !newMessage.trim()}
          >
            {sending ? (
              <ActivityIndicator size="small" color={colors.textLight} />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  keyboardAvoidingView: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
  loadingText: { marginTop: spacing.md, fontSize: fonts.body1.fontSize, color: colors.textSecondary },
  errorText: { fontSize: fonts.body2.fontSize, color: colors.primary, textAlign: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, backgroundColor: '#FFEEEE' },
  emptyText: { fontSize: fonts.h3.fontSize, fontWeight: fonts.h3.fontWeight, color: colors.textSecondary, marginBottom: spacing.sm },
  emptySubText: { fontSize: fonts.body1.fontSize, color: colors.textSecondary, textAlign: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.textPrimary },
  // headerAvatar: { width: 30, height: 30, borderRadius: 15, marginRight: spacing.sm },

  messageList: { flex: 1, paddingHorizontal: spacing.sm },
  messageListContent: { paddingVertical: spacing.md, flexGrow: 1, justifyContent: 'flex-end' }, // To keep messages at the bottom

  messageRow: { flexDirection: 'row', marginVertical: spacing.xs },
  messageRowSent: { justifyContent: 'flex-end', marginLeft: spacing.xl }, // Push sent messages right
  messageRowReceived: { justifyContent: 'flex-start', marginRight: spacing.xl }, // Keep received messages left

  messageBubble: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.large,
    maxWidth: '80%',
  },
  messageBubbleSent: {
    backgroundColor: colors.sentBubble,
    borderBottomRightRadius: borderRadius.small, // Flat corner for bubble tail illusion
  },
  messageBubbleReceived: {
    backgroundColor: colors.receivedBubble,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: borderRadius.small, // Flat corner for bubble tail illusion
  },
  messageText: { fontSize: fonts.body1.fontSize, color: colors.textPrimary },
  timestamp: { fontSize: fonts.caption.fontSize, marginTop: spacing.xs, alignSelf: 'flex-end' },
  timestampSent: { color: colors.textSecondary },
  timestampReceived: { color: colors.textSecondary },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background, // Or a slightly different color like surface
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120, // Allow multiline but limit height
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.xlarge,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fonts.body1.fontSize,
    marginRight: spacing.sm,
    color: colors.textPrimary,
  },
  sendButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.xlarge,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
  },
  sendButtonPressed: {
    backgroundColor: '#E55A3F', // Slightly darker primary
  },
  sendButtonDisabled: { backgroundColor: '#FFBFAA' /* Lighter primary */ },
  sendButtonText: {
    color: colors.textLight,
    fontSize: fonts.button.fontSize,
    fontWeight: fonts.button.fontWeight,
  },
});

export default ChatRoomScreen;