import { useRef } from 'react';

export default function WaterRippleButton({
  children,
  onClick,
  className = '',
  type = 'button',
  disabled = false,
  variant = 'primary',
}) {
  const btnRef = useRef(null);

  const handleClick = (e) => {
    if (disabled) return;
    const btn = btnRef.current;
    if (btn) {
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const wave = document.createElement('span');
      wave.className = 'ripple-wave';
      wave.style.width = wave.style.height = `${size}px`;
      wave.style.left = `${e.clientX - rect.left - size / 2}px`;
      wave.style.top = `${e.clientY - rect.top - size / 2}px`;
      btn.appendChild(wave);
      setTimeout(() => wave.remove(), 750);
    }
    onClick?.(e);
  };

  const baseClass =
    variant === 'primary' ? 'glass-button-primary' : 'glass-button-ghost';

  return (
    <button
      ref={btnRef}
      type={type}
      disabled={disabled}
      onClick={handleClick}
      className={`ripple-btn ${baseClass} ${className}`}
    >
      {children}
    </button>
  );
}
