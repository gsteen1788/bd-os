import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { graphService } from '../../services/graphService';

export const OutlookConnect = () => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'code_wait' | 'connected' | 'error'>('idle');
    const [deviceCode, setDeviceCode] = useState<{ user_code: string; verification_uri: string } | null>(null);
    const [userName, setUserName] = useState<string | null>(null);

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
                console.error('Failed to get user details', error);
                authService.logout();
                setStatus('idle');
            }
        }
    };

    const handleConnect = async () => {
        setStatus('loading');
        setDeviceCode(null);
        try {
            const codeData = await authService.initiateDeviceFlow();
            setDeviceCode(codeData);
            setStatus('code_wait');

            // Start polling
            await authService.pollForToken(codeData.device_code);

            // Success
            await checkConnection();
        } catch (error) {
            console.error('Connection failed', error);
            setStatus('error');
        }
    };

    const handleDisconnect = () => {
        authService.logout();
        setStatus('idle');
        setUserName(null);
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
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

    if (status === 'code_wait' && deviceCode) {
        return (
            <div className="space-y-6">
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                    <p className="text-sm text-warning mb-2"><strong>Step 1:</strong> Copy the code below</p>
                    <div className="flex items-center gap-2">
                        <code className="flex-1 bg-base-100 p-3 rounded font-mono font-bold text-2xl text-center text-main tracking-widest border border-[hsl(var(--color-border))]">
                            {deviceCode.user_code}
                        </code>
                        <button
                            onClick={() => copyToClipboard(deviceCode.user_code)}
                            className="p-3 bg-base-100 border border-[hsl(var(--color-border))] rounded hover:bg-base-200 text-primary"
                            title="Copy to clipboard"
                        >
                            📋
                        </button>
                    </div>
                </div>

                <div className="text-center">
                    <p className="text-sm text-muted mb-3"><strong>Step 2:</strong> Sign in with Microsoft</p>
                    <a
                        href={deviceCode.verification_uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary w-full"
                    >
                        Open Login Page ↗
                    </a>
                    <p className="text-xs text-dim mt-4 animate-pulse">
                        Waiting for you to complete sign in...
                    </p>
                </div>
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
                <p className="text-xs text-error font-medium bg-error/10 px-3 py-1 rounded">
                    Connection failed. Please try again.
                </p>
            )}
        </div>
    );
};
