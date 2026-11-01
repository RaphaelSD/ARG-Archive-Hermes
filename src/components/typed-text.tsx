'use client';

import { useEffect, useState } from 'react';

/** Печатает текст по буквам (эффект старого терминала). Если animate=false — показывает сразу. */
export function TypedText({
  text,
  animate = true,
  speed = 14,
  className,
}: {
  text: string;
  animate?: boolean;
  speed?: number;
  className?: string;
}) {
  const [count, setCount] = useState(animate ? 0 : text.length);

  useEffect(() => {
    if (!animate) {
      setCount(text.length);
      return;
    }
    setCount(0);
    // длинные тексты печатаем быстрее, чтобы не заставлять ждать
    const step = Math.max(1, Math.ceil(text.length / 260));
    const id = setInterval(() => {
      setCount((c) => {
        const next = Math.min(text.length, c + step);
        if (next >= text.length) clearInterval(id);
        return next;
      });
    }, speed);
    return () => clearInterval(id);
  }, [text, animate, speed]);

  const done = count >= text.length;
  return (
    <span className={className}>
      {text.slice(0, count)}
      {!done && <span className="ml-0.5 inline-block h-[1em] w-[0.5em] translate-y-[0.15em] animate-pulse bg-primary" />}
    </span>
  );
}
