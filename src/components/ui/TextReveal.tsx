'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface TextRevealProps {
    children: string;
    className?: string;
    delay?: number;
}

export function TextReveal({ children, className, delay = 0 }: TextRevealProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-10%" });
    const words = children.split(" ");

    return (
        <span ref={ref} className={className} style={{ overflow: 'hidden', display: 'inline-block', verticalAlign: 'bottom' }}>
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    className="inline-block mr-[0.25em]"
                    initial={{ y: "100%" }}
                    animate={isInView ? { y: 0 } : { y: "100%" }}
                    transition={{
                        duration: 0.5,
                        delay: delay + i * 0.03,
                        ease: [0.33, 1, 0.68, 1]
                    }}
                >
                    {word}
                </motion.span>
            ))}
        </span>
    );
}
