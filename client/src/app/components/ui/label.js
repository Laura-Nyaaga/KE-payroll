// Label Component
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

const Label = forwardRef(({ className, ...props }, ref) => {
    const combinedClasses = cn("text-sm font-medium", className);
    return (
        <label
            ref={ref}
            className={combinedClasses}
            {...props}
        />
    );
});
Label.displayName = 'Label';

export { Label };
