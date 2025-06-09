// Input Component
import React, { useState, useEffect, useCallback } from 'react';

// Mock utility function (basic implementation)
const cn = (...args) => args.filter(Boolean).join(' ');

// Define forwardRef if it's not already available (for compatibility)
const forwardRef = React.forwardRef || ((render) => {
    const Component = (props, ref) => {
        return render(props, ref);
    };
    Component.displayName = 'ForwardRef'; // Add this line
    return Component;
});

const Input = forwardRef(({ className, type = 'text', ...props }, ref) => {
    const combinedClasses = cn("w-full rounded-md border border-gray-200 px-3 py-2 shadow-sm", className);
    return (
        <input
            ref={ref}
            type={type}
            className={combinedClasses}
            {...props}
        />
    );
});
Input.displayName = 'Input';

export { Input };