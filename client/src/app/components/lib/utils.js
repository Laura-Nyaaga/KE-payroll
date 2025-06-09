import { useEffect, useRef } from 'react';

/**
 * Utility function to conditionally join class names.
 * @param args - Any number of arguments, which can be strings or objects.
 * Objects should have class names as keys and boolean values
 * indicating whether the class should be included.
 * @returns A string with the combined class names, or an empty string if no arguments are provided.
 */
function cn(...args) {
    if (!args.length) {
        return '';
    }

    const classes = [];

    for (const arg of args) {
        if (typeof arg === 'string') {
            if (arg) { // Add non-empty strings
                classes.push(arg);
            }
        } else if (typeof arg === 'object' && arg !== null) {
            for (const key in arg) {
                if (arg[key]) { // Add classes where the value is truthy
                    classes.push(key);
                }
            }
        }
        // ignore other types
    }
    return classes.join(' ');
}
/**
 * Custom hook to detect clicks outside of a specified element.
 * @param ref - A React ref pointing to the element to monitor.
 * @param callback - A function to be called when a click outside the element occurs.
 */
function useClickOutside(ref, callback) {
    const callbackRef = useRef(callback);

    // Keep track of the latest callback function
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                callbackRef.current();
            }
        };

        // Add mouse down event listener
        document.addEventListener('mousedown', handleClickOutside);

        // Cleanup function to remove the listener when the component unmounts
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [ref]); 
}

export { useClickOutside, cn };