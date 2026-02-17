import type { FC } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "../components/navbar.tsx";
import { ImageCarousel } from "../components/image_carousel.tsx";
import { useAuth } from "../contexts/auth.tsx";

const images = import.meta.glob(
    "../assets/Home/Slideshow/*.{png,jpg,jpeg,webp}",
    { eager: true }
);

const photos = Object.values(images).map((mod: any) => ({
    src: mod.default,
}));

const Home: FC = () => {
    const { user } = useAuth();

    return (
        <div className="background-primary">
            <Navbar></Navbar>
            <main>
                <section className="relative overflow-hidden">
                    <div className="" />
                    <section className="max-w-7xl mx-auto px-6 py-24">
                        <ImageCarousel photos={photos} />
                    </section>
                    <div className="relative max-w-7xl transform translate-y-[-60px] mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-none tracking-tight">
                                Train smarter.
                                <br />
                                <span className="text-blue-200">
                                    Progress faster.
                                </span>
                            </h1>

                            <p className="mt-8 text-lg text-gray-200 max-w-md">
                                Log workouts, visualize progress, and build
                                consistency with a fast, no-nonsense tracking
                                system.
                            </p>

                            {(!user || Object.keys(user).length === 0) && (
                                <div className="mt-10 flex gap-4">
                                    <Link to="/signup">
                                        <button className="px-6 py-3 rounded-full bg-indigo-500 text-white font-medium hover:bg-indigo-400 transition">
                                            Get started free
                                        </button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="bg-slate-900 border-t border-white/10">
                    <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-3 gap-8">
                        {[
                            [
                                "Log workouts",
                                "Fast input for sets, reps, and weights.",
                            ],
                            [
                                "See progress",
                                "Visualize strength gains over time.",
                            ],
                            [
                                "Create reports",
                                "Use reports to see your progress.",
                            ],
                        ].map(([title, desc]) => (
                            <div
                                key={title}
                                className="rounded-xl bg-slate-800/60 border border-white/10 p-6 hover:bg-slate-800 transition"
                            >
                                <h3 className="font-semibold text-white">
                                    {title}
                                </h3>
                                <p className="mt-2 text-sm text-slate-400">
                                    {desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};

export default Home;
