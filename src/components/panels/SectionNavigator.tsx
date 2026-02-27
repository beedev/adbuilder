'use client'
import React, { useState } from 'react'
import { Section, Page } from '@/types'
import { useAdStore } from '@/stores/adStore'
import { ChevronDown, ChevronRight, Plus, FileText, Layers } from 'lucide-react'

interface PageItemProps {
  page: Page
  isSelected: boolean
  onSelect: () => void
}

function PageItem({ page, isSelected, onSelect }: PageItemProps) {
  return (
    <button
      onClick={onSelect}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '6px 8px 6px 28px',
        borderRadius: 4,
        border: 'none',
        backgroundColor: isSelected ? '#e3f2fd' : 'transparent',
        color: isSelected ? '#1565C0' : '#555',
        fontSize: 12,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontWeight: isSelected ? 600 : 400,
      }}
    >
      <FileText size={12} />
      <span>Page {page.position + 1}</span>
      {page.template && (
        <span style={{ fontSize: 10, color: '#aaa', marginLeft: 'auto' }}>
          {page.template.name.split(' ')[0]}
        </span>
      )}
    </button>
  )
}

interface SectionItemProps {
  section: Section
  selectedPageId: string | null
  onSelectPage: (pageId: string) => void
  onAddPage: (sectionId: string) => void
}

function SectionItem({ section, selectedPageId, onSelectPage, onAddPage }: SectionItemProps) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div style={{ marginBottom: 2 }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 8px',
          backgroundColor: 'transparent',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          color: '#222',
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: section.themeColor || '#999',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            flex: 1,
            textAlign: 'left',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {section.name}
        </span>
        <span style={{ fontSize: 10, color: '#aaa' }}>{section.pages.length}p</span>
        {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>

      {expanded && (
        <div>
          {section.pages
            .slice()
            .sort((a, b) => a.position - b.position)
            .map(page => (
              <PageItem
                key={page.id}
                page={page}
                isSelected={selectedPageId === page.id}
                onSelect={() => onSelectPage(page.id)}
              />
            ))}
          <button
            onClick={() => onAddPage(section.id)}
            style={{
              width: '100%',
              padding: '4px 8px 4px 28px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#aaa',
              fontSize: 11,
            }}
          >
            <Plus size={11} />
            Add page
          </button>
        </div>
      )}
    </div>
  )
}

interface Props {
  sections: Section[]
  selectedPageId: string | null
  onSelectPage: (pageId: string) => void
}

export function SectionNavigator({ sections, selectedPageId, onSelectPage }: Props) {
  const [showAddSection, setShowAddSection] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  const { addSection, addPage } = useAdStore()

  const handleAddSection = async () => {
    if (!newSectionName.trim()) return
    await addSection(newSectionName.trim())
    setNewSectionName('')
    setShowAddSection(false)
  }

  const handleAddPage = async (sectionId: string) => {
    await addPage(sectionId)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '8px 0', borderBottom: '1px solid #eee', marginBottom: 8 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '0 8px',
            marginBottom: 8,
          }}
        >
          <Layers size={14} color="#888" />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#555',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Sections
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {sections.map(section => (
          <SectionItem
            key={section.id}
            section={section}
            selectedPageId={selectedPageId}
            onSelectPage={onSelectPage}
            onAddPage={handleAddPage}
          />
        ))}
      </div>

      {showAddSection ? (
        <div style={{ padding: 8, borderTop: '1px solid #eee' }}>
          <input
            autoFocus
            value={newSectionName}
            onChange={e => setNewSectionName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleAddSection()
              if (e.key === 'Escape') setShowAddSection(false)
            }}
            placeholder="Section name..."
            style={{
              width: '100%',
              padding: '6px 8px',
              border: '1px solid #ddd',
              borderRadius: 4,
              fontSize: 12,
              marginBottom: 6,
              boxSizing: 'border-box',
              color: '#111',
              backgroundColor: '#fff',
            }}
          />
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={handleAddSection}
              style={{
                flex: 1,
                padding: '5px',
                backgroundColor: '#C8102E',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                fontSize: 11,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Add
            </button>
            <button
              onClick={() => setShowAddSection(false)}
              style={{
                flex: 1,
                padding: '5px',
                backgroundColor: '#f5f5f5',
                color: '#555',
                border: 'none',
                borderRadius: 4,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddSection(true)}
          style={{
            margin: 8,
            padding: '6px',
            backgroundColor: 'transparent',
            border: '1px dashed #ddd',
            borderRadius: 4,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: '#aaa',
            fontSize: 12,
            justifyContent: 'center',
          }}
        >
          <Plus size={14} />
          Add Section
        </button>
      )}
    </div>
  )
}
