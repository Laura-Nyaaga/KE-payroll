// Dialog Components
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

const Dialog = ({ children, open, onOpenChange }) => {
    const [isOpen, setIsOpen] = useState(open || false);

    // Sync internal state with prop
    useEffect(() => {
        setIsOpen(open || false);
    }, [open]);

    const handleOpenChange = (newOpen) => {
        setIsOpen(newOpen);
        if (onOpenChange) {
            onOpenChange(newOpen);
        }
    };

    if (!isOpen) return null;

    const dialogChildren = React.Children.toArray(children);
    const content = dialogChildren.find(child => React.isValidElement(child) && child.type === DialogContent);
    const trigger = dialogChildren.find(child => React.isValidElement(child) && child.type === DialogTrigger);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="fixed inset-0 bg-black/50" onClick={() => handleOpenChange(false)} />
            {content && React.cloneElement(content, {
                onClose: () => handleOpenChange(false), // Pass a close handler
            })}
        </div>
    );
};

const DialogTrigger = ({ children, asChild }) => {
    if (asChild) {
        return React.Children.only(children);
    }
    return <>{children}</>;
};

const DialogContent = ({ children, className, onClose, ...props }) => {
    const close = () => {
        if (onClose) {
            onClose();
        }
    }
    return (
        <div className={cn("bg-white rounded-md shadow-lg p-4", className)} {...props}>
            {children}
            {/* You might want a close button here, depending on your design */}
            {/* <button onClick={close}>Close</button> */}
        </div>
    );
};

const DialogHeader = ({ children }) => <div className="space-y-1.5">{children}</div>;
const DialogTitle = ({ children }) => <h2 className="text-lg font-semibold">{children}</h2>;
const DialogDescription = ({ children }) => <p className="text-sm text-gray-500">{children}</p>;
const DialogFooter = ({ children }) => <div className="flex justify-end gap-2">{children}</div>;


export {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
};