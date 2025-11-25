import { cn } from "@/lib/utils";

interface LogoProps {
    className?: string;
    iconClassName?: string;
    textClassName?: string;
    showText?: boolean;
}

export function Logo({ className, iconClassName, textClassName, showText = true }: LogoProps) {
    return (
        <div className={cn("flex items-center gap-2 select-none", className)}>
            <div className={cn("relative w-8 h-8", iconClassName)}>
                <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="w-full h-full text-current"
                >
                    {/* Central Planet */}
                    <circle cx="12" cy="12" r="5" fill="currentColor" />
                    
                    {/* Orbit Rings */}
                    <path 
                        d="M12 2C6.48 2 2 6.48 2 12" 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                    />
                    <path 
                        d="M22 12C22 17.52 17.52 22 12 22" 
                        stroke="currentColor" 
                        strokeWidth="2.5" 
                        strokeLinecap="round" 
                    />
                    
                    {/* Accent Dot */}
                    <circle cx="20" cy="4" r="2" fill="currentColor" className="text-blue-500" />
                </svg>
            </div>
            {showText && (
                <span className={cn("font-bold text-xl tracking-tighter", textClassName)}>
                    ORBIT
                </span>
            )}
        </div>
    );
}
