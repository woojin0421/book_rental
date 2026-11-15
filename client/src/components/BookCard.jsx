import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BookCard({ book }) {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const { id, title, author, publisher, cover_image, category } = book;

  return (
    <div
      onClick={() => navigate(`/books/${id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/books/${id}`)}
      style={{
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: '190px',
        margin: '0 auto',
      }}
    >
      {/* Book Cover Container (Kyobo-style shadow & ratio) */}
      <div
        style={{
          width: '100%',
          aspectRatio: '1 / 1.48',
          position: 'relative',
          borderRadius: '4px',
          overflow: 'hidden',
          backgroundColor: '#F3F4F6',
          boxShadow: hovered
            ? '0 12px 24px rgba(0, 0, 0, 0.16), 0 4px 8px rgba(0, 0, 0, 0.08)'
            : '0 4px 12px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
          transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
          transition: 'all 0.25s cubic-bezier(0.2, 0, 0, 1)',
        }}
      >
        {cover_image ? (
          <img
            src={cover_image}
            alt={title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          /* Elegant Minimalist Book Cover Placeholder (Kyobo Style) */
          <div
            style={{
              width: '100%',
              height: '100%',
              background: 'linear-gradient(145deg, #1B4332 0%, #0F281E 100%)',
              color: '#FAF9F6',
              padding: '16px 14px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxSizing: 'border-box',
              position: 'relative',
            }}
          >
            <div style={{ borderLeft: '2px solid rgba(255,255,255,0.4)', paddingLeft: '8px' }}>
              <span style={{ fontSize: '10px', letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.7 }}>
                CHAEKSOOP
              </span>
              <p style={{ fontSize: '13px', fontWeight: 700, marginTop: '8px', lineHeight: 1.35, color: '#FFFFFF' }}>
                {title}
              </p>
            </div>
            <div style={{ fontSize: '11px', opacity: 0.8, textAlign: 'right' }}>
              {author || '저자 미상'}
            </div>
          </div>
        )}
      </div>

      {/* Book Metadata */}
      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {category && (
          <span
            style={{
              fontSize: '11px',
              color: '#1B4332',
              fontWeight: 600,
              letterSpacing: '-0.2px',
            }}
          >
            {category}
          </span>
        )}
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 700,
            color: hovered ? '#1B4332' : '#1F2937',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            margin: 0,
            transition: 'color 0.15s ease',
            letterSpacing: '-0.3px',
          }}
          title={title}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: '12px',
            color: '#6B7280',
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {author}{publisher ? ` · ${publisher}` : ''}
        </p>
      </div>
    </div>
  );
}
