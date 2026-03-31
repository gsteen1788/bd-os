import React, { useState, useRef, useId } from "react";
import { createPortal } from "react-dom";

interface FixedTooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
}

export const FixedTooltip: React.FC<FixedTooltipProps> = ({ content, children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const tooltipId = useId();

    const updatePosition = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            // Position tooltip below the trigger
            setCoords({
                top: rect.bottom + 5,
                left: rect.left
            });
            setIsVisible(true);
        }
    };

    const handleMouseEnter = () => {
        updatePosition();
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            setIsVisible(false);
        }
    };

    return (
        <button
            type="button"
            ref={triggerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onFocus={handleMouseEnter}
            onBlur={handleMouseLeave}
            onKeyDown={handleKeyDown}
            aria-describedby={tooltipId}
            className="inline-block outline-none focus-visible:ring-2 focus-visible:ring-primary rounded cursor-help"
        >
            {children}
            {isVisible && createPortal(
                <div
                    id={tooltipId}
                    role="tooltip"
                    style={{
                        position: "fixed",
                        top: coords.top,
                        left: coords.left,
                        zIndex: 9999,
                        maxWidth: "300px",
                        backgroundColor: "hsl(var(--color-bg-surface))",
                        border: "1px solid hsl(var(--color-border))",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                        borderRadius: "8px",
                        padding: "12px",
                        pointerEvents: "none",
                    }}
                    className="text-sm shadow-xl animate-in fade-in zoom-in-95 duration-200"
                >
                    {content}
                </div>,
                document.body
            )}
        </button>
    );
};
