import { useState, useRef, useEffect } from "react";
import { Task } from "../../domain/entities";

interface TaskCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (duration: number) => void;
    task?: Task;
}

export function TaskCompletionModal({ isOpen, onClose, onConfirm, task }: TaskCompletionModalProps) {
    const [duration, setDuration] = useState<string>("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            setDuration("");
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    const handleSubmit = () => {
        const mins = parseInt(duration);
        if (isNaN(mins) || mins < 0) {
            alert("Please enter a valid duration in minutes.");
            return;
        }
        onConfirm(mins);
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
        >
            <div className="bg-base-100 rounded-xl shadow-2xl w-full max-w-sm border border-[hsl(var(--color-border))] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-[hsl(var(--color-border))] bg-base-200/50 flex justify-between items-center">
                    <h3 id="modal-title" className="text-lg font-bold">Task Completed!</h3>
                    <button
                        onClick={onClose}
                        className="btn btn-sm btn-ghost btn-circle text-muted hover:text-main"
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                <div className="p-6 flex flex-col gap-4">
                    <p className="text-sm text-muted">
                        Great job completing <span className="font-bold text-main">"{task?.title}"</span>!
                    </p>

                    <div className="form-control w-full">
                        <label htmlFor="task-duration-input" className="label">
                            <span className="label-text font-bold">How long did it take? (minutes)</span>
                        </label>
                        <input
                            id="task-duration-input"
                            ref={inputRef}
                            type="number"
                            className="input input-bordered w-full"
                            placeholder="e.g. 30"
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSubmit();
                            }}
                        />
                        <div className="flex flex-wrap gap-2 justify-center mt-3">
                            {[15, 30, 45, 60].map((mins) => (
                                <button
                                    key={mins}
                                    className="btn btn-xs btn-outline hover:btn-primary transition-colors"
                                    onClick={() => {
                                        setDuration(mins.toString());
                                        inputRef.current?.focus();
                                    }}
                                    aria-label={`Set duration to ${mins} minutes`}
                                >
                                    {mins}m
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-base-200/50 flex justify-end gap-2 border-t border-[hsl(var(--color-border))]">
                    <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={handleSubmit}>Submit & Complete</button>
                </div>
            </div>
        </div>
    );
}
