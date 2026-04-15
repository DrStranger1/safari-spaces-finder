import { useEffect, useState } from 'react';

interface TypewriterTextProps {
  text: string;
  speed?: number;
  className?: string;
  highlightText?: string;
  highlightClassName?: string;
}

export default function TypewriterText({
  text,
  speed = 40,
  className = '',
  highlightText,
  highlightClassName = 'text-primary',
}: TypewriterTextProps) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (displayed < text.length) {
      const timer = setTimeout(() => setDisplayed(d => d + 1), speed);
      return () => clearTimeout(timer);
    }
  }, [displayed, text, speed]);

  const visible = text.slice(0, displayed);

  if (!highlightText) {
    return (
      <span className={className}>
        {visible}
        <span className="animate-pulse">|</span>
      </span>
    );
  }

  const idx = text.indexOf(highlightText);
  if (idx === -1 || displayed <= idx) {
    return (
      <span className={className}>
        {visible}
        {displayed < text.length && <span className="animate-pulse">|</span>}
      </span>
    );
  }

  const before = text.slice(0, idx);
  const highlightEnd = idx + highlightText.length;
  const highlightVisible = text.slice(idx, Math.min(displayed, highlightEnd));
  const after = displayed > highlightEnd ? text.slice(highlightEnd, displayed) : '';

  return (
    <span className={className}>
      {before}
      <span className={highlightClassName}>{highlightVisible}</span>
      {after}
      {displayed < text.length && <span className="animate-pulse">|</span>}
    </span>
  );
}
