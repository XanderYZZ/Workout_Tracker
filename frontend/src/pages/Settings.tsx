import type { FC } from 'react'
import { useEffect, useState } from 'react'
import '../index.css'
import { apiClient } from "../lib/apiclient";

const Settings: FC = () => {
    const [bodyweightEnter, setBodyweightEnter] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [settings, setSettings] = useState<Settings | null>(null);

    useEffect(() => {
        const getSettings = async () => {
            try {
                const response = await apiClient.get("/settings/");

                if (response.status == 200) {
                    setSettings(response.data);
                    setMessage({ type: 'success', text: 'Fetched settings!' });
                } else {
                    setMessage({ type: 'error', text: 'Error fetching settings' });
                }
            } catch (error) {
                setMessage({ type: 'error', text: 'Error fetching settings' });
            }
        };

        getSettings();
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!bodyweightEnter || isNaN(parseFloat(bodyweightEnter))) {
            setMessage({ type: 'error', text: 'Please enter a valid bodyweight' })
            return
        }

        setLoading(true);
        setMessage(null);

        try {            
            const response = await apiClient.post("/settings/bodyweight", {
                bodyweight: parseFloat(bodyweightEnter),
            });

            if (response.status == 201) {                
                if (!settings) { return; }

                settings.bodyweight = response.data.bodyweight;
                setSettings(settings);
                const bodyweight_str: string = String(response.data.bodyweight);
                setBodyweightEnter(bodyweight_str);
                setMessage({ type: 'success', text: 'Bodyweight updated successfully!' });
            } else {
                setMessage({ type: 'error', text: 'Error updating bodyweight' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error updating bodyweight' });
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-slate-950 to-slate-900 flex items-center justify-center px-4 py-8">
                <div className="max-w-md w-full">
                    <div className="bg-slate-900/80 backdrop-blur border border-white/10 rounded-2xl shadow-2xl p-8">
                        <h1 className="text-2xl font-bold text-white mb-2 text-center">Settings</h1>
                        <p className="text-gray-400 text-center mb-8">Manage your profile information</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4 mb-6">
                                <p className="text-gray-400 text-sm mb-1">Current Bodyweight</p>
                                <p className="text-3xl font-bold text-blue-400">{settings?.bodyweight} lbs</p>
                            </div>

                            <div>
                                <label htmlFor="bodyweight" className="block text-sm font-medium text-gray-300 mb-2">
                                    Update Bodyweight (lbs)
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        id="bodyweight"
                                        type="number"
                                        step="0.1"
                                        value={bodyweightEnter}
                                        onChange={(e) => setBodyweightEnter(e.target.value)}
                                        placeholder="Enter your bodyweight"
                                        className="flex-1 px-4 py-3 bg-slate-800 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 whitespace-nowrap"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <span>💾</span>
                                                Save
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {message && (
                                <div className={`p-3 rounded-lg text-sm font-medium ${message.type === 'success'
                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                                    }`}>
                                    {message.text}
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Settings;