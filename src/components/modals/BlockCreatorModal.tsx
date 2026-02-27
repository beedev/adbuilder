'use client'
import React, { useState, useCallback } from 'react'
import { X, Plus } from 'lucide-react'
import { BlockData, StampType, PriceType } from '@/types'

interface Props {
  adId: string
  onCreated: (block: BlockData) => void
  onClose: () => void
}

const CATEGORIES = [
  'Fresh Produce',
  'Meat & Seafood',
  'Bakery & Deli',
  'Dairy',
  'Frozen Foods',
  'Beverages',
  'Snacks',
  'Personal Care',
  'Household',
  'General',
]

const PRICE_TYPES: { value: PriceType; label: string }[] = [
  { value: 'each', label: 'Each' },
  { value: 'per_lb', label: 'Per Lb' },
  { value: 'x_for_y', label: 'X for Y' },
  { value: 'bogo', label: 'BOGO' },
  { value: 'pct_off', label: '% Off' },
]

const ALL_STAMPS: StampType[] = [
  'SALE', 'BOGO', 'PCT_OFF', 'HOT_DEAL',
  'NEW', 'ORGANIC', 'LOCAL', 'SEASONAL',
  'MANAGERS_SPECIAL', 'CLEARANCE',
]

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  border: '1px solid #ddd',
  borderRadius: 6,
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
  color: '#111',
  backgroundColor: '#fff',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 600,
  color: '#555',
  marginBottom: 4,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#333',
  marginBottom: 10,
  paddingBottom: 6,
  borderBottom: '1px solid #eee',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const fieldWrapStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 0,
}

export function BlockCreatorModal({ adId, onCreated, onClose }: Props) {
  // Product Info
  const [productName, setProductName] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('General')
  const [upc, setUpc] = useState('')

  // Price
  const [priceType, setPriceType] = useState<PriceType>('each')
  const [salePrice, setSalePrice] = useState('')
  const [regularPrice, setRegularPrice] = useState('')
  const [unitCount, setUnitCount] = useState('')
  const [pctOff, setPctOff] = useState('')

  // Images
  const [productImageUrl, setProductImageUrl] = useState('')
  const [lifestyleImageUrl, setLifestyleImageUrl] = useState('')

  // Content
  const [headline, setHeadline] = useState('')
  const [description, setDescription] = useState('')
  const [disclaimer, setDisclaimer] = useState('')

  // Stamps
  const [selectedStamps, setSelectedStamps] = useState<StampType[]>([])

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const toggleStamp = useCallback((stamp: StampType) => {
    setSelectedStamps(prev => {
      if (prev.includes(stamp)) {
        return prev.filter(s => s !== stamp)
      }
      if (prev.length >= 2) return prev
      return [...prev, stamp]
    })
  }, [])

  const validate = useCallback(() => {
    const errs: Record<string, string> = {}
    if (!productName.trim()) errs.productName = 'Product name is required'
    if (!category) errs.category = 'Category is required'
    return errs
  }, [productName, category])

  const handleSubmit = useCallback(async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setSubmitting(true)

    try {
      const salePriceNum = parseFloat(salePrice) || null
      const regularPriceNum = parseFloat(regularPrice) || 0

      const price = {
        adPrice: salePriceNum,
        priceType,
        regularPrice: regularPriceNum,
        unitCount: priceType === 'x_for_y' ? parseInt(unitCount) || null : null,
        percentOff: priceType === 'pct_off' ? parseInt(pctOff) || null : null,
        savingsText:
          regularPriceNum && salePriceNum
            ? `Save $${(regularPriceNum - salePriceNum).toFixed(2)}`
            : '',
        priceDisplay: salePriceNum ? `$${salePriceNum.toFixed(2)}` : '',
      }

      const res = await fetch(`/api/ads/${adId}/blocks/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: productName.trim(),
          brand: brand.trim(),
          category,
          upc: upc.trim(),
          price,
          productImageUrl: productImageUrl.trim() || null,
          lifestyleImageUrl: lifestyleImageUrl.trim() || null,
          headline: headline.trim() || productName.trim(),
          description: description.trim(),
          disclaimer: disclaimer.trim(),
          stamps: selectedStamps,
        }),
      })

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        setErrors({ submit: errBody.error || 'Failed to create block. Please try again.' })
        return
      }

      const newBlock: BlockData = await res.json()
      onCreated(newBlock)
      onClose()
    } catch {
      setErrors({ submit: 'Network error. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }, [
    validate,
    adId,
    productName,
    brand,
    category,
    upc,
    priceType,
    salePrice,
    regularPrice,
    unitCount,
    pctOff,
    productImageUrl,
    lifestyleImageUrl,
    headline,
    description,
    disclaimer,
    selectedStamps,
    onCreated,
    onClose,
  ])

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 10,
          width: '100%',
          maxWidth: 560,
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 8px 40px rgba(0,0,0,0.25)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #eee',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111' }}>Create New Block</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
              Add a custom product block to this ad
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              color: '#888',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Section 1: Product Info */}
          <div>
            <div style={sectionTitleStyle}>Product Info</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Product Name — full width */}
              <div style={fieldWrapStyle}>
                <label style={labelStyle}>
                  Product Name <span style={{ color: '#C8102E' }}>*</span>
                </label>
                <input
                  value={productName}
                  onChange={e => {
                    setProductName(e.target.value)
                    if (errors.productName) setErrors(prev => ({ ...prev, productName: '' }))
                  }}
                  placeholder="e.g. Organic Gala Apples"
                  style={{
                    ...inputStyle,
                    borderColor: errors.productName ? '#C8102E' : '#ddd',
                  }}
                />
                {errors.productName && (
                  <span style={{ fontSize: 11, color: '#C8102E', marginTop: 3 }}>
                    {errors.productName}
                  </span>
                )}
              </div>

              {/* Brand + Category in two columns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={fieldWrapStyle}>
                  <label style={labelStyle}>Brand</label>
                  <input
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    placeholder="e.g. Nature's Best"
                    style={inputStyle}
                  />
                </div>

                <div style={fieldWrapStyle}>
                  <label style={labelStyle}>
                    Category <span style={{ color: '#C8102E' }}>*</span>
                  </label>
                  <select
                    value={category}
                    onChange={e => {
                      setCategory(e.target.value)
                      if (errors.category) setErrors(prev => ({ ...prev, category: '' }))
                    }}
                    style={{
                      ...inputStyle,
                      borderColor: errors.category ? '#C8102E' : '#ddd',
                      appearance: 'auto',
                    }}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <span style={{ fontSize: 11, color: '#C8102E', marginTop: 3 }}>
                      {errors.category}
                    </span>
                  )}
                </div>
              </div>

              {/* UPC */}
              <div style={fieldWrapStyle}>
                <label style={labelStyle}>UPC</label>
                <input
                  value={upc}
                  onChange={e => setUpc(e.target.value)}
                  placeholder="e.g. 012345678901"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Price */}
          <div>
            <div style={sectionTitleStyle}>Price</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Price Type + Sale Price */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={fieldWrapStyle}>
                  <label style={labelStyle}>Price Type</label>
                  <select
                    value={priceType}
                    onChange={e => setPriceType(e.target.value as PriceType)}
                    style={{ ...inputStyle, appearance: 'auto' }}
                  >
                    {PRICE_TYPES.map(pt => (
                      <option key={pt.value} value={pt.value}>
                        {pt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={fieldWrapStyle}>
                  <label style={labelStyle}>Sale Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={salePrice}
                    onChange={e => setSalePrice(e.target.value)}
                    placeholder="3.99"
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Regular Price + conditional fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={fieldWrapStyle}>
                  <label style={labelStyle}>Regular Price</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={regularPrice}
                    onChange={e => setRegularPrice(e.target.value)}
                    placeholder="5.99"
                    style={inputStyle}
                  />
                </div>

                {priceType === 'x_for_y' && (
                  <div style={fieldWrapStyle}>
                    <label style={labelStyle}>Unit Count</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={unitCount}
                      onChange={e => setUnitCount(e.target.value)}
                      placeholder="2"
                      style={inputStyle}
                    />
                  </div>
                )}

                {priceType === 'pct_off' && (
                  <div style={fieldWrapStyle}>
                    <label style={labelStyle}>Percent Off</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={pctOff}
                      onChange={e => setPctOff(e.target.value)}
                      placeholder="20"
                      style={inputStyle}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Images */}
          <div>
            <div style={sectionTitleStyle}>Images</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={fieldWrapStyle}>
                <label style={labelStyle}>Product Image URL</label>
                <input
                  value={productImageUrl}
                  onChange={e => setProductImageUrl(e.target.value)}
                  placeholder="https://..."
                  style={inputStyle}
                />
              </div>
              <div style={fieldWrapStyle}>
                <label style={labelStyle}>Lifestyle Image URL</label>
                <input
                  value={lifestyleImageUrl}
                  onChange={e => setLifestyleImageUrl(e.target.value)}
                  placeholder="https://..."
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Content */}
          <div>
            <div style={sectionTitleStyle}>Content</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={fieldWrapStyle}>
                <label style={labelStyle}>Headline</label>
                <input
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  placeholder={productName || 'e.g. Fresh & Delicious'}
                  style={inputStyle}
                />
              </div>
              <div style={fieldWrapStyle}>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Short product description..."
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    lineHeight: 1.4,
                  }}
                />
              </div>
              <div style={fieldWrapStyle}>
                <label style={labelStyle}>Disclaimer</label>
                <input
                  value={disclaimer}
                  onChange={e => setDisclaimer(e.target.value)}
                  placeholder="e.g. While supplies last"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          {/* Section 5: Stamps */}
          <div>
            <div style={sectionTitleStyle}>Stamps</div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 8 }}>
              Select up to 2 stamps
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 6,
              }}
            >
              {ALL_STAMPS.map(stamp => {
                const isSelected = selectedStamps.includes(stamp)
                const isDisabled = !isSelected && selectedStamps.length >= 2
                return (
                  <button
                    key={stamp}
                    type="button"
                    onClick={() => toggleStamp(stamp)}
                    disabled={isDisabled}
                    style={{
                      padding: '6px 8px',
                      border: '1px solid',
                      borderColor: isSelected ? '#C8102E' : '#ddd',
                      borderRadius: 6,
                      backgroundColor: isSelected ? '#C8102E' : '#fff',
                      color: isSelected ? '#fff' : isDisabled ? '#bbb' : '#333',
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '0.03em',
                      transition: 'all 0.1s',
                      textAlign: 'center',
                    }}
                  >
                    {stamp.replace(/_/g, ' ')}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Submit error */}
          {errors.submit && (
            <div
              style={{
                backgroundColor: '#FFF5F5',
                border: '1px solid #FFCDD2',
                borderRadius: 6,
                padding: '10px 12px',
                fontSize: 12,
                color: '#C62828',
              }}
            >
              {errors.submit}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #eee',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '8px 18px',
              border: '1px solid #ddd',
              borderRadius: 6,
              backgroundColor: '#fff',
              color: '#555',
              fontSize: 13,
              fontWeight: 600,
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: '8px 18px',
              border: 'none',
              borderRadius: 6,
              backgroundColor: submitting ? '#e57373' : '#C8102E',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: submitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background-color 0.15s',
            }}
          >
            <Plus size={14} />
            {submitting ? 'Creating...' : 'Create Block'}
          </button>
        </div>
      </div>
    </div>
  )
}
