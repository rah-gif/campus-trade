import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import { ShieldAlert, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DeleteAccount() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Confirm message, 2: Send OTP, 3: Verify OTP
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOtp({
                email: user.email,
                options: {
                    shouldCreateUser: false,
                }
            });
            if (error) throw error;
            toast.success("Verification code sent to your email!");
            setStep(3);
        } catch (error) {
            console.error(error);
            toast.error("Failed to send code: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndDelete = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // 1. Verify OTP
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email: user.email,
                token: otp,
                type: 'email'
            });

            if (verifyError) throw new Error("Invalid verification code.");

            // 2. Execute deletion RPC (We are verified now)
            const { error: deleteError } = await supabase.rpc('delete_own_account');
            if (deleteError) throw deleteError;

            // 3. Cleanup
            toast.success("Account permanently deleted.");
            await logout();
            navigate('/register');

        } catch (error) {
            console.error(error);
            toast.error(error.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <Navbar />
            
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-red-100 dark:border-red-900/50">
                    <div className="p-8 text-center">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
                            <ShieldAlert className="h-8 w-8 text-red-600 dark:text-red-500" />
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">We're sorry to see you go</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8">
                            Permanently deleting your account will wipe all your data, listings, and messages. This action 
                            <span className="font-bold text-red-600 dark:text-red-400"> cannot be undone</span>.
                        </p>

                        {step === 1 && (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                                    Are you sure you want to proceed? We'll need to verify your email ({user?.email}) first.
                                </p>
                                <button
                                    onClick={() => setStep(2)}
                                    className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-md transition-colors"
                                >
                                    Yes, I want to delete my account
                                </button>
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="w-full py-3 px-4 bg-white dark:bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Click below to send a 6-digit verification code to your email.
                                </p>
                                <button
                                    onClick={handleSendOtp}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md transition-colors disabled:opacity-50"
                                >
                                    <Mail size={18} />
                                    {loading ? "Sending..." : "Send Verification Code"}
                                </button>
                                <button
                                    onClick={() => setStep(1)}
                                    className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    Back
                                </button>
                            </div>
                        )}

                        {step === 3 && (
                            <form onSubmit={handleVerifyAndDelete} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className="text-left">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Enter Verification Code
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            placeholder="123456"
                                            className="block w-full pl-10 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-red-500 focus:ring-red-500 py-3 text-lg tracking-widest text-center font-mono"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-center mt-2 text-gray-500">Check your inbox for the code.</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-md transition-colors disabled:opacity-50"
                                >
                                    {loading ? "Verifying..." : "Confirm & Delete Account"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStep(2)}
                                    className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                >
                                    Resend Code
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
