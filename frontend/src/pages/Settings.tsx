import type { FC } from "react";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/apiclient";
import { BackButton } from "../components/basic_buttons/back_button";
import { Notifications } from "../lib/notifications";
import { Card } from "../components/card";

const Settings: FC = () => {
    const queryClient = useQueryClient();
    const [bodyweightEnter, setBodyweightEnter] = useState("");

    const {
        data: settings,
        isLoading: loadingSettings,
        error,
        isSuccess,
    } = useQuery<Settings, Error>({
        queryKey: ["settings"],
        queryFn: async () => {
            const res = await apiClient.get("/settings/");
            return res.data as Settings;
        },
    });

    useEffect(() => {
        if (isSuccess && settings) {
            setBodyweightEnter(String(settings.bodyweight));
        }
    }, [isSuccess, settings]);

    const {
        mutate: updateBodyweightMutation,
        isPending: updateBodyweightIsPending,
    } = useMutation({
        mutationFn: async (newBodyweight: number) => {
            const res = await apiClient.post("/settings/bodyweight", {
                bodyweight: newBodyweight,
            });
            return res.data;
        },
        onSuccess: (data) => {
            settings &&
                queryClient.setQueryData<Settings>(["settings"], {
                    ...settings,
                    bodyweight: data.bodyweight,
                });
            setBodyweightEnter(String(data.bodyweight));
            Notifications.showSuccess("Bodyweight updated successfully!");
        },
        onError: () => {
            Notifications.showError("Error updating bodyweight");
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const weight = parseFloat(bodyweightEnter);

        if (isNaN(weight)) {
            Notifications.showError("Please enter a valid bodyweight");
            return;
        }

        updateBodyweightMutation(weight);
    };

    if (loadingSettings) {
        return (
            <div className="background-primary flex items-center justify-center min-h-screen">
                <div className="text-gray-300">Loading settings...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="background-primary flex items-center justify-center min-h-screen">
                <div className="text-red-400">Failed to load settings.</div>
            </div>
        );
    }

    return (
        <Card className="background-primary flex items-center justify-center min-h-screen">
            <div className="max-w-md w-full">
                <div className="card-background p-6">
                    <div className="relative mb-6">
                        <div className="absolute left-0 top-0">
                            <BackButton />
                        </div>
                        <h1 className="text-2xl font-bold text-white text-center">
                            Settings
                        </h1>
                    </div>
                    <p className="text-gray-300 text-center mb-8">
                        Manage your profile information
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-slate-800/50 border border-white/10 rounded-lg p-4 mb-6">
                            <p className="text-gray-400 text-sm mb-1">
                                Current Bodyweight
                            </p>
                            <p className="text-3xl font-bold text-blue-400">
                                {settings?.bodyweight} lbs
                            </p>
                        </div>

                        <div>
                            <label
                                htmlFor="bodyweight"
                                className="block text-sm font-medium text-gray-300 mb-2"
                            >
                                Update Bodyweight (lbs)
                            </label>
                            <div className="flex gap-3">
                                <input
                                    id="bodyweight"
                                    type="number"
                                    step="0.1"
                                    value={bodyweightEnter}
                                    onChange={(e) =>
                                        setBodyweightEnter(e.target.value)
                                    }
                                    placeholder="Enter your bodyweight"
                                    className="flex-1 px-4 py-3 bg-slate-800 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                                />
                                <button
                                    type="submit"
                                    disabled={updateBodyweightIsPending}
                                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    {updateBodyweightIsPending ? (
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
                    </form>
                </div>
            </div>
        </Card>
    );
};

export default Settings;
