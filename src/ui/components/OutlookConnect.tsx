import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { graphService } from '../../services/graphService';
import { logger } from '../../infrastructure/logger';

export const OutlookConnect = () => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'browser_wait' | 'connected' | 'error'>('idle');
    const [userName, setUserName] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        if (authService.isAuthenticated()) {
            setStatus('loading');
            try {
                const user = await graphService.getUserDetails();
                setUserName(user.displayName);
                setStatus('connected');
            } catch (error) {
                logger.error('Failed to get user details', error);
                authService.logout();
                setStatus('idle');
            }
        }
    };

    const handleConnect = async () => {
        setStatus('browser_wait');
        setErrorMessage(null);
        try {
            await authService.login();
            
            // Success
            setStatus('loading');
            await checkConnection();
        } catch (error: any) {
            logger.error('Connection failed', error);
            setErrorMessage(error.message || 'An unknown error occurred.');
            setStatus('error');
        }
    };

    const handleDisconnect = () => {
        authService.logout();
        setStatus('idle');
        setUserName(null);
    };

    if (status === 'connected') {
        return (
            <div className="flex flex-col items-center gap-4 p-6">
                <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                    <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <div className="text-center">
                    <h4 className="text-lg font-bold text-main">Connected</h4>
                    <p className="text-muted">Signed in as <strong className="text-main">{userName}</strong></p>
                </div>

                <button
                    onClick={handleDisconnect}
                    className="mt-4 px-4 py-2 text-sm text-error hover:bg-error/10 rounded-lg transition-colors"
                >
                    Disconnect Account
                </button>
            </div>
        );
    }

    if (status === 'browser_wait') {
        return (
            <div className="space-y-6 text-center py-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl animate-bounce">🌐</span>
                </div>
                <div>
                    <h4 className="text-lg font-bold text-main mb-2">Check your browser</h4>
                    <p className="text-sm text-muted">
                        We've opened a secure Microsoft login page in your default web browser.
                        <br/><br/>
                        Please complete the authentication there. This window will automatically update once you're done.
                    </p>
                </div>
                <div className="flex justify-center mt-6">
                    <div className="loading loading-spinner loading-lg text-primary"></div>
                </div>
                <button
                    onClick={() => setStatus('idle')}
                    className="btn btn-ghost btn-sm mt-4"
                >
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-6 py-4">
            <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl">📅</span>
                </div>
                <h4 className="font-bold text-main">Connect Outlook Calendar</h4>
                <p className="text-sm text-muted max-w-xs">
                    Sync your upcoming meetings and events directly to your dashboard.
                </p>
            </div>

            <button
                onClick={handleConnect}
                disabled={status === 'loading'}
                className={`btn btn-primary w-full ${status === 'loading' ? 'loading' : ''}`}
            >
                {status === 'loading' ? 'Connecting...' : 'Authorize with Microsoft'}
            </button>

            {status === 'error' && (
                <div className="flex flex-col items-center">
                    <p className="text-xs text-error font-medium bg-error/10 px-3 py-1 rounded text-center">
                        Connection failed. Please try again or check your IT policy.
                    </p>
                    {errorMessage && (
                        <p className="text-[10px] text-muted mt-2 text-center max-w-[200px] break-words">
                            Error Details: {errorMessage}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
};
