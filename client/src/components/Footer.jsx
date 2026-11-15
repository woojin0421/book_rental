const Footer = () => {
  return (
    <footer style={{ background: '#FFFFFF', borderTop: '1px solid #E5E2DC', padding: '36px 20px', color: '#6B7280', fontSize: '12px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '1.5px', color: '#1B4332' }}>CHAEKSOOP</span>
            <span style={{ fontSize: '15px', fontWeight: 900, color: '#1B4332' }}>책숲</span>
          </div>
          <p style={{ margin: '0 0 4px', lineHeight: 1.6 }}>
            교내 학우 도서 공유 및 렌탈 서비스 플랫폼
          </p>
          <p style={{ margin: 0, color: '#9CA3AF' }}>
            본 서비스는 교내 구성원 간의 자율적인 도서 공유를 위해 운영됩니다.
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '8px', justifyContent: 'flex-end', color: '#4B5563', fontWeight: 500 }}>
            <span>이용안내</span>
            <span>도서대여규정</span>
            <span>개인정보처리방침</span>
          </div>
          <span style={{ color: '#9CA3AF' }}>
            Copyright © 2026 CHAEKSOOP. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
