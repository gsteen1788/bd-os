import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface FixedTooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
}

export const FixedTooltip: React.FC<FixedTooltipProps> = ({ content, children }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
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

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    return (
        <div
            ref={triggerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="inline-block"
        >
            {children}
            {isVisible && createPortal(
                <div
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
                    className="text-sm shadow-xl"
                >
                    {content}
                </div>,
                document.body
            )}
        </div>
    );
};
