import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, useClickOutside } from '../lib/utils'; 

// Context
const PopoverContext = createContext({
    open: false,
    onOpenChange: () => {},
    triggerRef: null, 
  });

function usePopover() {
    const context = useContext(PopoverContext);
    if (!context) {
        throw new Error('Popover components must be used within <Popover />');
    }
    return context;
}

// Root
const Popover = ({
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    children,
    modal = false,
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const isControlled = typeof openProp !== 'undefined';
    const open = isControlled ? openProp : isOpen;
    const triggerRef = useRef(null); 

    const setOpen = useCallback(
        (newOpen) => {
            if (!isControlled) {
                setIsOpen(newOpen);
            }
            if (onOpenChange) {
                onOpenChange(newOpen);
            }
        },
        [isControlled, onOpenChange, setIsOpen]
    );

    const contextValue = {
        open,
        onOpenChange: setOpen,
        triggerRef,
    };

    return (
        <PopoverContext.Provider value={contextValue}>
            <div className="relative inline-block">{children}</div>
        </PopoverContext.Provider>
    );
};
Popover.displayName = 'Popover';

// Trigger
const PopoverTrigger = ({ children, asChild }) => {
    const { open, onOpenChange, triggerRef } = usePopover();

    const handleClick = useCallback((e) => {
        e.stopPropagation();
        onOpenChange(!open);
    }, [open, onOpenChange]);

    // Find the actual button element within the children
    let triggerButton = null;
    const findButton = (children) => {
        if (React.isValidElement(children)) {
            if (children.type === 'button') {
                triggerButton = children;
            } else if (children.props && children.props.children) {
                if (Array.isArray(children.props.children)) {
                    for (const child of children.props.children) {
                        findButton(child);
                    }
                }
                else {
                    findButton(children.props.children);
                }

            }
        }
    }

    findButton(children);

    const child = React.isValidElement(children)
        ? React.cloneElement(children, {
            onClick: handleClick,
            ref: triggerRef,
            ...(typeof children.type === 'string' &&
                !children.props.role && { role: 'button' }),
            ...(typeof children.type === 'string' &&
                children.props.tabIndex === undefined && { tabIndex: 0 }),
        })
        : children;

    return (
        <div className="contents" ref={triggerRef}>
            {child}
        </div>
    );
};

PopoverTrigger.displayName = 'PopoverTrigger';

// Content
const PopoverContent = React.forwardRef(
    (
        {
            align = 'center',
            side = 'bottom',
            sideOffset = 0,
            alignOffset = 0,
            collisionPadding = 8,
            onCloseAutoFocus,
            onPointerDownOutside,
            onInteractOutside,
            trapFocus,
            className,
            children,
            onDateRangeSelect, 
            setTriggerText,
            ...props
        },
        ref
    ) => {
        const { open, onOpenChange, triggerRef } = usePopover();
        const contentRef = useRef(null);
        const [position, setPosition] = useState({ x: 0, y: 0 });
        const [mounted, setMounted] = useState(false);
        const [selectedDateRange, setSelectedDateRange] = useState(null); // State for selected date range


        useClickOutside(contentRef, () => onOpenChange(false));

        // Update mounted state
        useEffect(() => {
            setMounted(true);
            return () => setMounted(false);
        }, []);

        // Position the popover
        useEffect(() => {
            if (open && contentRef.current && triggerRef.current) {
                const triggerRect = triggerRef.current.getBoundingClientRect();
                const contentRect = contentRef.current.getBoundingClientRect();

                let x = 0;
                let y = 0;

                // Calculate side position
                switch (side) {
                    case 'top':
                        y = triggerRect.top - contentRect.height - sideOffset;
                        break;
                    case 'bottom':
                        y = triggerRect.bottom + sideOffset;
                        break;
                    case 'left':
                        x = triggerRect.left - contentRect.width - sideOffset;
                        break;
                    case 'right':
                        x = triggerRect.right + sideOffset;
                        break;
                }

                // Calculate alignment position
                switch (align) {
                    case 'start':
                        if (side === 'top' || side === 'bottom') {
                            x = triggerRect.left + alignOffset;
                        } else {
                            y = triggerRect.top + alignOffset;
                        }
                        break;
                    case 'center':
                        if (side === 'top' || side === 'bottom') {
                            x = triggerRect.left + (triggerRect.width - contentRect.width) / 2 + alignOffset;
                        } else {
                            y = triggerRect.top + (triggerRect.height - contentRect.height) / 2 + alignOffset;
                        }
                        break;
                    case 'end':
                        if (side === 'top' || side === 'bottom') {
                            x = triggerRect.right - contentRect.width - alignOffset;
                        } else {
                            y = triggerRect.bottom - contentRect.height - alignOffset;
                        }
                        break;
                }

                // Collision detection and adjustment (simplified)
                if (x < 0) x = collisionPadding;
                if (y < 0) y = collisionPadding;
                if (x + contentRect.width > window.innerWidth)
                    x = window.innerWidth - contentRect.width - collisionPadding;
                if (y + contentRect.height > window.innerHeight)
                    y = window.innerHeight - contentRect.height - collisionPadding;

                setPosition({ x, y });
            }
        }, [open, align, side, sideOffset, alignOffset, collisionPadding]);

        // Trap focus
        useEffect(() => {
            if (open && contentRef.current && trapFocus) {
                const focusableElements = contentRef.current.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );

                if (focusableElements.length > 0) {
                    const firstFocusableElement = focusableElements[0];
                    firstFocusableElement.focus();

                    const handleKeyDown = (e) => {
                        if (e.key === 'Tab') {
                            if (e.shiftKey) {
                                // Shift + Tab: Move focus to the last element
                                if (document.activeElement === focusableElements[0]) {
                                    e.preventDefault();
                                    const lastFocusableElement = focusableElements[
                                        focusableElements.length - 1
                                    ];
                                    lastFocusableElement.focus();
                                }
                            } else {
                                // Tab: Move focus to the first element
                                if (
                                    document.activeElement ===
                                    focusableElements[focusableElements.length - 1]
                                ) {
                                    e.preventDefault();
                                    const firstFocusableElement = focusableElements[0];
                                    firstFocusableElement.focus();
                                }
                            }
                        }
                    };

                    contentRef.current.addEventListener('keydown', handleKeyDown);

                    return () => {
                        if (contentRef.current)
                            contentRef.current.removeEventListener('keydown', handleKeyDown);
                    };
                }
            }
        }, [open, trapFocus]);

        const handleDateSelect = (dateRange) => {
            setSelectedDateRange(dateRange);
            onDateRangeSelect(dateRange);
            setTriggerText(dateRange); // Update the trigger text.
            onOpenChange(false);
        };

        const combinedClasses = cn(
            'bg-white rounded-md shadow-lg border border-gray-200',
            className
        );

        return (
            <AnimatePresence>
                {open && mounted && (
                    <motion.div
                        ref={contentRef}
                        style={{
                            position: 'absolute',
                            top: position.y,
                            left: position.x,
                            zIndex: 20,
                        }}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeInOut' }}
                        className={combinedClasses}
                        {...props}
                    >
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        );
    }
);
PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent };






