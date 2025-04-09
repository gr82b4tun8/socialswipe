// src/lib/utils.ts (React Native Version)

// The 'cn' function using 'clsx' and 'tailwind-merge' is specific to web CSS class management
// (primarily Tailwind CSS) and is not typically used in standard React Native StyleSheet-based styling.
// Therefore, it's omitted here.

/**
 * Formats a date string into a short, readable format (e.g., "Wed, Apr 7").
 * @param dateString - An ISO 8601 or otherwise Date-parsable string.
 * @returns Formatted date string or an empty string if parsing fails.
 */
export function formatDate(dateString: string): string {
    try {
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'short', // e.g., 'Wed'
            month: 'short',   // e.g., 'Apr'
            day: 'numeric'    // e.g., '7'
        };

        const date = new Date(dateString);

        // Basic validation after parsing
        if (isNaN(date.getTime())) {
            console.warn(`formatDate: Invalid dateString received: ${dateString}`);
            return ''; // Return empty string for invalid dates
        }

        return date.toLocaleDateString('en-US', options);

    } catch (error) {
        console.error(`formatDate Error: Failed to format dateString "${dateString}"`, error);
        return ''; // Return empty string on error
    }
}

// Add any other React Native-compatible utility functions here...