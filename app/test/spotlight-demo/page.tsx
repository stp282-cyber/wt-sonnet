import { SpotlightEffect } from '@/components/ui/SpotlightEffect';

export default function SpotlightDemoPage() {
    return (
        <div className="min-h-screen w-full bg-[#0F172A] relative flex flex-col items-center justify-center overflow-hidden p-4">
            {/* 
        This page uses a dark background to demonstrate the spotlight effect better, 
        similar to the reference n8n site which usually has dark mode sections for this effect.
      */}

            {/* The Spotlight Effect Component */}
            <SpotlightEffect spotlightColor="rgba(147, 51, 234, 0.35)" size={500} />

            <div className="relative z-20 max-w-4xl w-full text-center space-y-8">
                <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-400">
                    Spotlight Effect
                </h1>
                <p className="text-neutral-300 text-xl max-w-2xl mx-auto">
                    Move your mouse around to see the spotlight following your cursor.
                    This effect highlights the background behind the mouse, creating a dynamic and immersive experience.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 text-left">
                    {[1, 2, 3].map((item) => (
                        <div
                            key={item}
                            className="p-6 rounded-2xl border border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 transition duration-200 backdrop-blur-sm"
                        >
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4" />
                            <h3 className="text-xl font-semibold text-white mb-2">Feature {item}</h3>
                            <p className="text-neutral-400">
                                This card sits above the spotlight. The glow passes beneath it, creating depth.
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-12">
                    <button className="px-8 py-3 rounded-full bg-white text-black font-bold hover:bg-neutral-200 transition">
                        Get Started
                    </button>
                </div>
            </div>
        </div>
    );
}
