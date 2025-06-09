// Select Components
import React, { useState, useEffect, useRef, useCallback } from 'react';


const cn = (...args) => args.filter(Boolean).join(' ');


const forwardRef = React.forwardRef || ((render) => {
    const Component = (props, ref) => {
        return render(props, ref);
    };
    Component.displayName = 'ForwardRef'; 
    return Component;
});

const Select = ({ children, onValueChange }) => {
    const [selectedValue, setSelectedValue] = useState('');

    const handleSelectChange = (value) => {
        setSelectedValue(value);
        if (onValueChange) {
            onValueChange(value);
        }
    };

    const selectChildren = React.Children.toArray(children);
    const trigger = selectChildren.find(child => React.isValidElement(child) && child.type === SelectTrigger);
    const content = selectChildren.find(child => React.isValidElement(child) && child.type === SelectContent);

    return (
        <div className="relative">
            {trigger && React.cloneElement(trigger, {
                onClick: () => {
                },
            })}
            {content && React.cloneElement(content, {
                value: selectedValue,
                onSelect: handleSelectChange,
            })}
        </div>
    );
};

const SelectTrigger = ({ children, className, ...props }) => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerChildren = React.Children.toArray(children);
    const selectValue = triggerChildren.find(child => React.isValidElement(child) && child.type === SelectValue);
    return (
        <button
            className={cn("flex items-center justify-between w-full rounded-md border border-gray-200 px-3 py-2 shadow-sm", className)}
            onClick={() => setIsOpen(!isOpen)}
            {...props}
        >
            {selectValue}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 text-gray-500"
            >
                <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 011.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                />
            </svg>
        </button>
    );
};

const SelectValue = ({ placeholder }) => <span className="text-gray-500">{placeholder}</span>;

const SelectContent = ({ children, value, onSelect, className }) => {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setIsOpen(true); // Open when content is rendered
    }, []);

    const handleOptionClick = (optionValue) => {
        setSelectedValue(optionValue);
        if (onSelect) {
            onSelect(optionValue);
        }
        setIsOpen(false);
    };

    const [position, setPosition] = useState({ top: 0, left: 0 });
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom,
                left: rect.left,
            });
        }
    }, []);


    return (
        <div
            ref={containerRef}
            className={cn("absolute z-10 mt-1 w-auto bg-white rounded-md shadow-lg border border-gray-200", className)}
            style={{
                display: isOpen ? 'block' : 'none',
                top: position.top,
                left: position.left,
            }}

        >
            {React.Children.map(children, (child) => {
                if (React.isValidElement(child) && child.type === SelectItem) {
                    return React.cloneElement(child, {
                        onClick: () => {
                            handleOptionClick(child.props.value);
                        },
                        isSelected: value === child.props.value, // Add isSelected prop
                    });
                }
                return child;
            })}
        </div>
    );
};

const SelectItem = ({ children, value, onClick, isSelected }) => {
    return (
        <div
            className={cn(
                "px-3 py-2 cursor-pointer hover:bg-gray-100",
                isSelected && 'bg-blue-100 text-blue-800'
            )}
            onClick={(e) => {
                e.stopPropagation();
                if (typeof onClick === 'function') {
                    onClick();
                }
            }}
            data-value={value}
        >
            {children}
        </div>
    );
};



