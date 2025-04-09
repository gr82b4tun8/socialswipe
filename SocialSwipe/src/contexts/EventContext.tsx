// src/context/EventsContext.tsx
import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    ReactNode,
  } from 'react';
  // Assuming you have a way to show toasts/notifications in React Native
  // You might use a library like 'react-native-toast-message' or a custom component.
  // Import your specific toast hook or function here. For placeholder:
  // import { useToast } from '@/components/ui/use-toast'; // Adjust this import
  
  // --- Define Core Types ---
  // You might want to move these to a central 'types' file (e.g., src/types/index.ts)
  export interface Event {
    id: string;
    title: string;
    description: string;
    date: string; // Consider using Date objects if needed, but strings are often easier for APIs/storage
    location: string;
    imageUrl?: string; // Optional image URL
    // Add any other relevant event properties
  }
  
  export interface User {
    id: string;
    name: string;
    // Store saved event IDs for easier lookup and synchronization
    savedEvents: string[];
    // Add any other relevant user properties
  }
  
  // --- Define Context Shape ---
  interface EventContextType {
    allEvents: Event[]; // Renamed from 'events' for clarity - holds all fetched events
    currentEvent: Event | null; // The event currently being displayed/swiped
    savedEvents: Event[]; // List of full event objects saved by the user
    user: User | null; // User can be null if not logged in or data not loaded yet
    isLoading: boolean; // To indicate loading states (e.g., fetching, saving)
    loadInitialData: (fetchedEvents: Event[], userData: User) => void; // Function to initialize state
    saveEvent: (eventId: string) => Promise<void>; // Async for potential API calls
    skipEvent: () => void;
    removeEvent: (eventId: string) => Promise<void>; // Async for potential API calls
    getNextEvent: () => void; // Gets the next event to display
    clearEventState: () => void; // Function to reset state on logout etc.
  }
  
  // --- Create Context ---
  // Provide a default undefined value initially
  const EventContext = createContext<EventContextType | undefined>(undefined);
  
  // --- Create Provider Component ---
  export const EventProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [allEvents, setAllEvents] = useState<Event[]>([]);
    const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
    const [savedEvents, setSavedEvents] = useState<Event[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
  
    // Placeholder for your toast notification hook/function
    const showToast = (options: { title?: string; description: string; type?: 'success' | 'error' | 'info' }) => {
        console.log(`Toast: ${options.title ? options.title + ': ' : ''}${options.description} (${options.type || 'info'})`);
        // Replace console.log with your actual toast implementation, e.g.:
        // toast({ title: options.title, description: options.description, variant: options.type === 'error' ? 'destructive' : undefined });
        // Or for react-native-toast-message:
        // import Toast from 'react-native-toast-message';
        // Toast.show({ type: options.type || 'info', text1: options.title, text2: options.description });
    };
  
  
    // --- Core Logic ---
  
    // Function to find the next available event (not saved, not current)
    const findNextEvent = useCallback((currentUserId: string | null, currentSavedIds: string[], eventsList: Event[], excludingEventId: string | null): Event | null => {
      if (!currentUserId) return null; // Need a user
  
      const availableEvents = eventsList.filter(
        event =>
          !currentSavedIds.includes(event.id) && // Not already saved
          event.id !== excludingEventId          // Not the one we just swiped/viewed
      );
  
      if (availableEvents.length > 0) {
        // Get a random event from the available ones
        const randomIndex = Math.floor(Math.random() * availableEvents.length);
        return availableEvents[randomIndex];
      } else {
          // Maybe the only available event *was* the one excluded? Check again without exclusion.
          const lastChanceEvents = eventsList.filter(event => !currentSavedIds.includes(event.id));
          if (lastChanceEvents.length > 0) {
               // If there is only one left and it's the one we excluded, return null. Otherwise, return the first (or random) of these.
               if (lastChanceEvents.length === 1 && lastChanceEvents[0].id === excludingEventId) {
                  return null;
               }
               // Return a random one from the remaining few
              const randomIndex = Math.floor(Math.random() * lastChanceEvents.length);
               return lastChanceEvents[randomIndex];
  
          }
      }
  
      return null; // No available events left
    }, []); // No dependencies, it's a pure utility based on inputs
  
    // Action: Get the next event to display
    const getNextEvent = useCallback(() => {
        if (!user) return; // Can't get next event without user context
  
        const nextEvent = findNextEvent(user.id, user.savedEvents, allEvents, currentEvent?.id ?? null);
        setCurrentEvent(nextEvent);
  
        if (!nextEvent && allEvents.length > 0) {
            // Only show "no more events" if we actually had events to begin with
            showToast({
                title: "No More Events",
                description: "You've viewed all available events.",
                type: 'info',
            });
        }
    }, [user, allEvents, currentEvent, findNextEvent]); // Dependencies
  
  
    // --- State Initialization and Reset ---
  
    // Call this after fetching data (e.g., on login or app start)
    const loadInitialData = useCallback((fetchedEvents: Event[], userData: User) => {
      setIsLoading(true);
      setAllEvents(fetchedEvents);
      setUser(userData);
  
      // Populate savedEvents based on user's savedEvent IDs
      const userSavedFullEvents = fetchedEvents.filter(event =>
        userData.savedEvents.includes(event.id)
      );
      setSavedEvents(userSavedFullEvents);
  
      // Set the initial current event
      const initialNextEvent = findNextEvent(userData.id, userData.savedEvents, fetchedEvents, null);
      setCurrentEvent(initialNextEvent);
  
      setIsLoading(false);
    }, [findNextEvent]); // Dependency needed
  
    // Call this on logout or when resetting state
    const clearEventState = useCallback(() => {
        setAllEvents([]);
        setCurrentEvent(null);
        setSavedEvents([]);
        setUser(null);
        setIsLoading(false);
    }, []);
  
  
    // --- Event Actions ---
  
    const saveEvent = useCallback(async (eventId: string) => {
      if (!user) {
        showToast({ title: "Error", description: "Please log in to save events.", type: 'error' });
        return;
      }
  
      const eventToSave = allEvents.find(event => event.id === eventId);
      if (!eventToSave) {
          showToast({ title: "Error", description: "Event not found.", type: 'error' });
          return; // Should not happen if eventId comes from currentEvent
      }
  
      if (user.savedEvents.includes(eventId)) {
          showToast({ title: "Already Saved", description: `${eventToSave.title} is already in your list.`, type: 'info' });
          getNextEvent(); // Move to next even if already saved
          return; // Already saved
      }
  
  
      // **Simulate API Call**
      setIsLoading(true);
      try {
        // Placeholder: Replace with your actual API call
        // await apiClient.post(`/users/${user.id}/saved-events`, { eventId });
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  
        // --- Update State Optimistically or After Success ---
        const updatedSavedEventIds = [...user.savedEvents, eventId];
        const updatedUser = { ...user, savedEvents: updatedSavedEventIds };
        setUser(updatedUser); // Update user state
        setSavedEvents(prev => [...prev, eventToSave]); // Add to the list of saved event objects
  
         showToast({
           title: "Event Saved!",
           description: `${eventToSave.title} added to your events.`,
           type: 'success',
         });
  
        // Get the next event *after* successful save and state update
         getNextEvent();
  
      } catch (error) {
        console.error("Failed to save event:", error);
        showToast({ title: "Error", description: "Could not save event. Please try again.", type: 'error' });
        // Optionally: Revert optimistic updates here if needed
      } finally {
        setIsLoading(false);
      }
    }, [user, allEvents, getNextEvent]); // Dependencies
  
    const skipEvent = useCallback(() => {
      if (currentEvent) {
        // You might not need a toast for skipping, depends on UX
        // showToast({ description: "Event skipped.", type: 'info' });
        getNextEvent();
      }
    }, [currentEvent, getNextEvent]); // Dependencies
  
    const removeEvent = useCallback(async (eventId: string) => {
      if (!user) {
        showToast({ title: "Error", description: "Please log in.", type: 'error' });
        return;
      }
  
      if (!user.savedEvents.includes(eventId)) {
        console.warn("Attempted to remove event not in saved list:", eventId);
        return; // Not in the list, nothing to do
      }
  
      // **Simulate API Call**
      setIsLoading(true);
      try {
        // Placeholder: Replace with your actual API call
        // await apiClient.delete(`/users/${user.id}/saved-events/${eventId}`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  
        // --- Update State Optimistically or After Success ---
        const updatedSavedEventIds = user.savedEvents.filter(id => id !== eventId);
        const updatedUser = { ...user, savedEvents: updatedSavedEventIds };
        setUser(updatedUser); // Update user state
        setSavedEvents(prev => prev.filter(event => event.id !== eventId)); // Remove from saved list
  
        showToast({
          description: "Event removed from your list.",
          type: 'success', // Or 'info'
        });
  
        // Note: We usually don't call getNextEvent() here,
        // because removal typically happens from a "Saved Events" screen,
        // not the main swiping/discovery view.
  
      } catch (error) {
        console.error("Failed to remove event:", error);
        showToast({ title: "Error", description: "Could not remove event. Please try again.", type: 'error' });
        // Optionally: Revert optimistic updates here
      } finally {
        setIsLoading(false);
      }
    }, [user]); // Dependencies
  
  
    // --- Context Value ---
    // Memoize the context value to prevent unnecessary re-renders
    const value = React.useMemo(() => ({
      allEvents,
      currentEvent,
      savedEvents,
      user,
      isLoading,
      loadInitialData,
      saveEvent,
      skipEvent,
      removeEvent,
      getNextEvent,
      clearEventState,
    }), [
        allEvents,
        currentEvent,
        savedEvents,
        user,
        isLoading,
        loadInitialData,
        saveEvent,
        skipEvent,
        removeEvent,
        getNextEvent,
        clearEventState
    ]);
  
    // --- Render Provider ---
    return (
      <EventContext.Provider value={value}>
        {children}
      </EventContext.Provider>
    );
  };
  
  // --- Custom Hook for Consuming Context ---
  export const useEvents = (): EventContextType => {
    const context = useContext(EventContext);
    if (context === undefined) {
      throw new Error('useEvents must be used within an EventProvider');
    }
    return context;
  };
  
  // --- Export Context (Optional, hook is usually sufficient) ---
  // export { EventContext };