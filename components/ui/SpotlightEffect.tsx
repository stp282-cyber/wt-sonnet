'use client';

import { useEffect, useRef, useState } from 'react';

interface SpotlightEffectProps {
    /**
     * Spotlight colors. Defaults to a blue/purple implementation.
     */
    spotlightColor?: string;
    /**
     * Size of the spotlight in pixels.
     */
    size?: number;
    /**
     * Optional className for the container.
     */
    className?: string;
}

export function SpotlightEffect({
    spotlightColor = 'rgba(120, 119, 198, 0.3)',
    size = 400,
    className = '',
}: SpotlightEffectProps) {
    const divRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!divRef.current) return;

            setPosition({ x: e.clientX, y: e.clientY });
            setOpacity(1);
        };

        const handleMouseLeave = () => {
            setOpacity(0);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <div
            ref={divRef}
            className={`pointer-events-none fixed inset-0 z-0 transition-opacity duration-300 ${className}`}
            style={{
                opacity,
                background: `radial-gradient(${size}px circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
            }}
            aria-hidden="true"
        />
    );
}
