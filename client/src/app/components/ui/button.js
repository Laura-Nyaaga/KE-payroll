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

// Button Component
const Button = forwardRef(({
    className,
    variant,
    size,
    asChild,
    ...props
}, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md font-semibold transition-colors';
    const variantClasses = {
        default: 'bg-blue-500 text-white hover:bg-blue-600',
        destructive: 'bg-red-500 text-white hover:bg-red-600',
        outline: 'border border-gray-200 hover:bg-gray-100',
        secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
        ghost: 'hover:bg-gray-100',
    };
    const sizeClasses = {
        default: 'px-4 py-2',
        sm: 'px-3 py-1.5 text-sm',
        lg: 'px-6 py-3 text-lg',
    };

    const combinedClasses = cn(
        baseClasses,
        variantClasses[variant] || variantClasses.default,
        sizeClasses[size] || sizeClasses.default,
        className
    );

    if (asChild) {
        return React.Children.only(props.children); // Return the single child element
    }

    return (
        <button
            ref={ref}
            className={combinedClasses}
            {...props}
        >
            {props.children}
        </button>
    );
});
Button.displayName = 'Button';


export { Button };