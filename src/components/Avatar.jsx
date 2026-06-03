import React from 'react'

export default function Avatar({ name, color, size = 40 }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
    : '?'

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: color?.bg || '#F5E6D3',
      color: color?.text || '#9A5E28',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.35,
      fontWeight: 500,
      fontFamily: 'var(--font-display)',
      flexShrink: 0,
      letterSpacing: '0.02em',
    }}>
      {initials}
    </div>
  )
}
