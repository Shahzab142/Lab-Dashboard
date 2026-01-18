import React, { useMemo } from 'react';

interface MiniWaveChartProps {
    color?: string;
    height?: number;
    width?: number;
    animate?: boolean;
    intensity?: number; // 0 to 1, representing activity level
    showGrid?: boolean;
}

export function MiniWaveChart({
    color = "#ff0080",
    height = 40,
    width = 120,
    animate = true,
    intensity = 0.5,
    showGrid = true
}: MiniWaveChartProps) {
    const path = useMemo(() => {
        const pointsCount = 10;
        const step = width / (pointsCount - 1);

        // Generate data points influenced by intensity
        // Static-ish base with subtle variance
        const baseHeight = height * 0.5;
        const amplitude = (height * 0.3) * intensity;

        const data = [
            baseHeight,
            baseHeight - amplitude * 0.5,
            baseHeight + amplitude * 0.8,
            baseHeight - amplitude * 0.2,
            baseHeight + amplitude * 0.4,
            baseHeight - amplitude * 0.7,
            baseHeight + amplitude * 0.3,
            baseHeight - amplitude * 0.9,
            baseHeight + amplitude * 0.1,
            baseHeight
        ];

        let d = `M 0 ${data[0]}`;
        for (let i = 1; i < data.length; i++) {
            const x_prev = (i - 1) * step;
            const x_curr = i * step;
            const cp1x = x_prev + step / 2;
            const cp2x = x_prev + step / 2;
            d += ` C ${cp1x} ${data[i - 1]}, ${cp2x} ${data[i]}, ${x_curr} ${data[i]}`;
        }
        return d;
    }, [width, height, intensity]);

    // Grid lines
    const gridLines = useMemo(() => {
        if (!showGrid) return null;
        const cols = 6;
        const rows = 3;
        const vLines = [];
        const hLines = [];

        for (let i = 1; i < cols; i++) {
            vLines.push((width / cols) * i);
        }
        for (let i = 1; i < rows; i++) {
            hLines.push((height / rows) * i);
        }
        return { vLines, hLines };
    }, [width, height, showGrid]);

    return (
        <div className="relative overflow-hidden shrink-0" style={{ width, height }}>
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Grid System */}
                {gridLines && (
                    <g opacity="0.1">
                        {gridLines.vLines.map(x => (
                            <line key={`v-${x}`} x1={x} y1={0} x2={x} y2={height} stroke="white" strokeWidth="0.5" />
                        ))}
                        {gridLines.hLines.map(y => (
                            <line key={`h-${y}`} x1={0} y1={y} x2={width} y2={y} stroke="white" strokeWidth="0.5" />
                        ))}
                    </g>
                )}

                <path
                    d={path}
                    stroke={color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={animate && intensity > 0.1 ? "animate-wave-flow" : ""}
                    style={{
                        filter: `drop-shadow(0 0 6px ${color}88)`,
                        transition: 'all 0.5s ease-in-out'
                    }}
                />

                {/* Fill Gradient */}
                <path
                    d={`${path} L ${width} ${height} L 0 ${height} Z`}
                    fill={`url(#grad-${color.replace('#', '')})`}
                    fillOpacity="0.05"
                />

                <defs>
                    <linearGradient id={`grad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={color} />
                        <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                </defs>
            </svg>
        </div>
    );
}
