import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  className?: string;
}

/** Minimal trend sparkline. Inherits color from the parent (stroke/fill-current). */
export function Sparkline({ data, className }: SparklineProps) {
  if (data.length < 2) return null;
  const width = 100;
  const height = 28;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn("h-7 w-full", className)}
      aria-hidden="true"
    >
      <path
        d={`M 0,${height} L ${points.join(" L ")} L ${width},${height} Z`}
        className="fill-current opacity-10"
      />
      <path
        d={`M ${points.join(" L ")}`}
        className="fill-none stroke-current"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
