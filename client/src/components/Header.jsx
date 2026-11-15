import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiSearch, FiUser, FiLogOut, FiMenu } from 'react-icons/fi';

const GNB_TABS = ['전체도서', '대여가능 도서', '소설', '자기계발', '과학/IT', '기타'];

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const currentCat = searchParams.get('cat') || '전체도서';
  const urlQuery = searchParams.get('q') || '';
  const [keyword, setKeyword] = useState(urlQuery);

  // Sync keyword with URL search param
  useEffect(() => {
    setKeyword(urlQuery);
  }, [urlQuery]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = keyword.trim();
    if (trimmed) {
      navigate(`/?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/');
    }
  };

  const handleTabClick = (tab) => {
    if (tab === '전체도서') {
      navigate('/');
    } else {
      navigate(`/?cat=${encodeURIComponent(tab)}`);
    }
  };

  return (
    <header style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E2DC', position: 'sticky', top: 0, zIndex: 100 }}>
      {/* Top utility row */}
      <div style={{ borderBottom: '1px solid #F3F4F6', fontSize: '12px', color: '#6B7280' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '6px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ letterSpacing: '-0.2px' }}>교내 학우들을 위한 공유 서재 플랫폼</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {user ? (
              <>
                <span style={{ color: '#1F2937', fontWeight: 600 }}>{user.nickname} 님</span>
                <span style={{ color: '#E5E2DC' }}>|</span>
                <Link to="/mypage" style={{ color: '#1B4332', fontWeight: 600, textDecoration: 'none' }}>내 서재 (대여관리)</Link>
                <span style={{ color: '#E5E2DC' }}>|</span>
                <button
                  onClick={handleLogout}
                  style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', fontSize: '12px', padding: 0 }}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link to="/login" style={{ color: '#4B5563', textDecoration: 'none' }}>로그인</Link>
                <span style={{ color: '#E5E2DC' }}>|</span>
                <Link to="/signup" style={{ color: '#4B5563', textDecoration: 'none' }}>회원가입</Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Brand & Search row */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
        {/* Logo (Kyobo style typography) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2px', color: '#1B4332', textTransform: 'uppercase' }}>
              CHAEKSOOP
            </span>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#1B4332', letterSpacing: '-0.8px' }}>
              책숲
            </span>
          </Link>
        </div>

        {/* Kyobo-style Rounded Capsule Search Bar */}
        <form onSubmit={handleSearch} style={{ flex: '1', maxWidth: '580px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: '#FAF9F6',
            border: '2px solid #1B4332',
            borderRadius: '24px',
            padding: '3px 6px 3px 16px',
            transition: 'box-shadow 0.2s',
          }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1B4332', paddingRight: '12px', borderRight: '1px solid #E5E2DC', whiteSpace: 'nowrap' }}>
              통합검색
            </span>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="도서명, 저자, 출판사, ISBN 번호 검색"
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                padding: '8px 12px',
                fontSize: '14px',
                color: '#1F2937',
              }}
            />
            <button
              type="submit"
              style={{
                background: '#1B4332',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title="검색"
            >
              <FiSearch size={16} />
            </button>
          </div>
        </form>

        {/* Right Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/mypage"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '6px',
              border: '1px solid #E5E2DC',
              background: '#FAF9F6',
              color: '#1B4332',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <FiUser size={15} />
            <span>내 서재</span>
          </Link>
        </div>
      </div>

      {/* GNB Sub Nav - Active Line Indicator & Category Sync */}
      <div style={{ borderTop: '1px solid #F3F4F6' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', gap: '28px', overflowX: 'auto', whiteSpace: 'nowrap' }}>
          {GNB_TABS.map((tab) => {
            const isHome = location.pathname === '/';
            const isActive = isHome && (tab === currentCat || (tab === '전체도서' && !searchParams.get('cat')));

            return (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                style={{
                  background: 'none',
                  border: 'none',
                  display: 'inline-block',
                  padding: '11px 4px',
                  fontSize: '14px',
                  fontWeight: isActive ? 800 : 500,
                  color: isActive ? '#1B4332' : '#4B5563',
                  borderBottom: isActive ? '3px solid #1B4332' : '3px solid transparent',
                  cursor: 'pointer',
                  letterSpacing: '-0.3px',
                  transition: 'all 0.15s ease',
                  marginBottom: '-1px',
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

export default Header;
