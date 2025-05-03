// src/lib/chatUtils.ts
import { supabase } from './supabaseClient'; // Adjust path to YOUR supabaseClient file if needed
import { Alert } from 'react-native';

/**
 * Finds an existing 1-on-1 conversation room between two users or creates a new one.
 * Uses 'rooms' and 'room_participants' tables via an RPC call.
 *
 * @param userId1 - ID of the first user (e.g., current user)
 * @param userId2 - ID of the second user (e.g., target user)
 * @returns The ID of the found or created room, or null on error.
 */
export const findOrCreateConversation = async (
    userId1: string | null,
    userId2: string | null
): Promise<string | null> => {
    if (!userId1 || !userId2 || userId1 === userId2) {
        console.error("Invalid user IDs provided for conversation.");
        return null;
    }

    try {
        // --- Ensure you have created the 'find_or_create_direct_room' function
        // --- in your Supabase SQL Editor first!

        console.log(`Calling RPC find_or_create_direct_room for users: ${userId1}, ${userId2}`);
        const { data: roomId, error: rpcError } = await supabase.rpc('find_or_create_direct_room', {
            user1_id_in: userId1,
            user2_id_in: userId2,
        });

        if (rpcError) {
            console.error("Error calling find_or_create_direct_room RPC:", rpcError);
            throw rpcError;
        }

        if (roomId) {
             console.log(`Found or created room ID via RPC: ${roomId}`);
             return roomId as string;
        } else {
             throw new Error("Failed to find or create room (RPC returned null).");
        }

    } catch (error: any) {
        console.error("Error in findOrCreateConversation:", error.message);
        Alert.alert("Error", "Could not start conversation. Please try again.");
        return null;
    }
};

// You could add other chat-related utility functions here in the future