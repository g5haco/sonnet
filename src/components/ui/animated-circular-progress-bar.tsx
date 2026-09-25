import { cn } from "@/lib/utils"

// Magic UI's animated circular progress bar (via 21st.dev). Sonnet: `children` replaces the percent label
// (the focus timer shows mm:ss), and `label` names it for screen readers.
interface Props {
  max: number
  value: number
  gaugePrimaryColor: string
  gaugeSecondaryColor: string
  className?: string
  children?: React.ReactNode
  label?: string
}

export function AnimatedCircularProgressBar({
  max = 100,
  value = 0,
  gaugePrimaryColor,
  gaugeSecondaryColor,
  className,
  children,
  label,
}: Props) {
  const circumference = 2 * Math.PI * 45
  const percentPx = circumference / 100
  const currentPercent = (value / max) * 100

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.round(value)}
      className={cn("relative size-40 text-2xl font-semibold", className)}
      style={
        {
          "--circle-size": "100px",
          "--circumference": circumference,
          "--percent-to-px": `${percentPx}px`,
          "--gap-percent": "5",
          "--offset-factor": "0",
          "--transition-length": "1s",
          "--transition-step": "200ms",
          "--delay": "0s",
          "--percent-to-deg": "3.6deg",
          transform: "translateZ(0)",
        } as React.CSSProperties
      }
    >
      <svg fill="none" className="size-full" strokeWidth="2" viewBox="0 0 100 100" aria-hidden="true">
        {currentPercent <= 90 && currentPercent >= 0 && (
          <circle
            cx="50"
            cy="50"
            r="45"
            strokeWidth="10"
            strokeDashoffset="0"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-100"
            style={
              {
                stroke: gaugeSecondaryColor,
                "--offset-factor-secondary": "calc(1 - var(--offset-factor))",
                strokeDasharray: `${(90 - currentPercent) * percentPx} ${circumference}`,
                transform:
                  "rotate(calc(1turn - 90deg - (var(--gap-percent) * var(--percent-to-deg) * var(--offset-factor-secondary)))) scaleY(-1)",
                transition: "all var(--transition-length) linear var(--delay)",
                transformOrigin: "calc(var(--circle-size) / 2) calc(var(--circle-size) / 2)",
              } as React.CSSProperties
            }
          />
        )}
        <circle
          cx="50"
          cy="50"
          r="45"
          strokeWidth="10"
          strokeDashoffset="0"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-100"
          style={
            {
              stroke: gaugePrimaryColor,
              // Sonnet: the dash length is computed here (a var()-based calc never redrew when the value changed, so
              // the fill stayed empty) with one explicit transition, linear so a once-a-second value fills smoothly.
              strokeDasharray: `${currentPercent * percentPx} ${circumference}`,
              transition: "stroke-dasharray var(--transition-length) linear var(--delay), transform var(--transition-length) ease var(--delay)",
              transform: "rotate(calc(-90deg + var(--gap-percent) * var(--offset-factor) * var(--percent-to-deg)))",
              transformOrigin: "calc(var(--circle-size) / 2) calc(var(--circle-size) / 2)",
            } as React.CSSProperties
          }
        />
      </svg>
      <span
        data-current-value={currentPercent}
        className="absolute inset-0 m-auto size-fit delay-[var(--delay)] duration-[var(--transition-length)] ease-linear animate-in fade-in"
      >
        {children ?? currentPercent}
      </span>
    </div>
  )
}
