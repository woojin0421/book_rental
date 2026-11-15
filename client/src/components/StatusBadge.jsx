const STATUS_MAP = {
  AVAILABLE: {
    label: '대여 가능',
    backgroundColor: '#D8F3DC',
    color: '#1B4332',
    dotColor: '#1B4332',
  },
  REQUESTED: {
    label: '수락 대기',
    backgroundColor: '#FEF3C7',
    color: '#B45309',
    dotColor: '#D97706',
  },
  RENTED: {
    label: '대여 중',
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    dotColor: '#9CA3AF',
  },
};

export default function StatusBadge({ status }) {
  const config = STATUS_MAP[status] ?? {
    label: status,
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    dotColor: '#9CA3AF',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        backgroundColor: config.backgroundColor,
        color: config.color,
        whiteSpace: 'nowrap',
        letterSpacing: '-0.2px',
      }}
    >
      <span
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          backgroundColor: config.dotColor,
          display: 'inline-block',
        }}
      />
      {config.label}
    </span>
  );
}
