import React from 'react'

export default function AdPrintLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ margin: 0, padding: 0, background: '#fff', fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {children}
    </div>
  )
}
