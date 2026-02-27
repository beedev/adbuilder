'use client'
import React, { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TemplateBuilder from '@/components/templates/TemplateBuilder'
import { Template } from '@/types'

interface Props {
  params: Promise<{ id: string }>
}

export default function EditTemplatePage({ params }: Props) {
  const { id } = use(params)
  const router = useRouter()
  const [template, setTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    fetch(`/api/templates/${id}`)
      .then(r => {
        if (!r.ok) {
          setNotFound(true)
          setLoading(false)
          return null
        }
        return r.json()
      })
      .then(data => {
        if (data) {
          setTemplate(data)
          setLoading(false)
        }
      })
      .catch(() => {
        setNotFound(true)
        setLoading(false)
      })
  }, [id])

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F0F2F5',
          fontSize: 14,
          color: '#888',
        }}
      >
        Loading template&hellip;
      </div>
    )
  }

  if (notFound || !template) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F0F2F5',
          gap: 16,
        }}
      >
        <div style={{ fontSize: 16, fontWeight: 700, color: '#333' }}>Template not found</div>
        <button
          onClick={() => router.push('/templates')}
          style={{
            padding: '8px 18px',
            backgroundColor: '#C8102E',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Back to Templates
        </button>
      </div>
    )
  }

  return (
    <TemplateBuilder
      initialTemplate={{
        id: template.id,
        name: template.name,
        category: template.category,
        orientation: template.orientation,
        layoutJson: template.layoutJson,
      }}
    />
  )
}
