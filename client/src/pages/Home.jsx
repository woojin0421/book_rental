import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import BookCard from '../components/BookCard';
import { FiSearch, FiPlus, FiX, FiCheck, FiInfo } from 'react-icons/fi';

const CATEGORY_OPTIONS = ['소설', '자기계발', '과학/IT', '기타'];

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // URL Query Sync
  const currentCategory = searchParams.get('cat') || '전체도서';
  const searchQuery = searchParams.get('q') || '';

  // Modal & Form State
  const [showModal, setShowModal] = useState(false);
  const [isbnQuery, setIsbnQuery] = useState('');
  const [isbnSearching, setIsbnSearching] = useState(false);
  const [isbnSearchError, setIsbnSearchError] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const [form, setForm] = useState({
    title: '',
    author: '',
    publisher: '',
    isbn: '',
    category: '소설',
    cover_image: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/books');
      setBooks(res.data.books || []);
    } catch (e) {
      setError('도서 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  // Filter books by Header Category & Search keyword
  const filtered = books.filter((b) => {
    // 1. Category Filter
    let matchCat = true;
    if (currentCategory === '대여가능 도서') {
      matchCat = Number(b.available_rentals) > 0;
    } else if (currentCategory === '소설') {
      matchCat = b.category === '소설' || b.category === '소설·에세이';
    } else if (currentCategory === '자기계발') {
      matchCat = b.category === '자기계발';
    } else if (currentCategory === '과학/IT') {
      matchCat = b.category === '과학' || b.category === 'IT·개발' || b.category === '과학/IT';
    } else if (currentCategory === '기타') {
      matchCat = !['소설', '소설·에세이', '자기계발', '과학', 'IT·개발', '과학/IT'].includes(b.category);
    } else {
      // 전체도서
      matchCat = true;
    }

    // 2. Search Keyword Filter
    const q = searchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      (b.title && b.title.toLowerCase().includes(q)) ||
      (b.author && b.author.toLowerCase().includes(q)) ||
      (b.publisher && b.publisher.toLowerCase().includes(q)) ||
      (b.isbn && b.isbn.replace(/-/g, '').includes(q.replace(/-/g, '')));

    return matchCat && matchSearch;
  });

  const openModal = () => {
    if (!user) {
      alert('도서 등록은 로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.');
      navigate('/login');
      return;
    }
    setForm({
      title: '',
      author: '',
      publisher: '',
      isbn: '',
      category: '소설',
      cover_image: '',
    });
    setIsbnQuery('');
    setIsbnSearchError('');
    setSearchResults([]);
    setFormError('');
    setShowModal(true);
  };

  // ISBN 및 도서명 자동 검색 (교보문고 정면 표지 CDN & 서지정보 연동)
  const handleIsbnSearch = async (e) => {
    if (e) e.preventDefault();
    const trimmed = isbnQuery.trim();
    if (!trimmed) {
      setIsbnSearchError('ISBN 번호 또는 도서명을 입력해주세요.');
      return;
    }

    setIsbnSearching(true);
    setIsbnSearchError('');
    setSearchResults([]);

    try {
      const res = await api.get(`/books/search-isbn?isbn=${encodeURIComponent(trimmed)}`);
      const foundBooks = res.data.books || [];

      if (foundBooks.length === 0) {
        setIsbnSearchError('검색된 도서 정보가 없습니다. 도서 정보를 직접 입력해주세요.');
      } else {
        setSearchResults(foundBooks);
        const top = foundBooks[0];
        let coverImg = top.cover_image || '';
        if (coverImg && (coverImg.includes('SpineShelf') || coverImg.includes('_d.jpg'))) {
          coverImg = coverImg.replace(/\/SpineShelf\//gi, '/cover500/').replace(/_d\.jpg/gi, '_1.jpg');
        }
        setForm((prev) => ({
          ...prev,
          title: top.title || prev.title,
          author: top.author || prev.author,
          publisher: top.publisher || prev.publisher,
          isbn: top.isbn || trimmed,
          cover_image: coverImg || prev.cover_image,
        }));
      }
    } catch (err) {
      setIsbnSearchError('도서 검색 중 오류가 발생했습니다. 직접 입력해주세요.');
    } finally {
      setIsbnSearching(false);
    }
  };

  const selectSearchResult = (item) => {
    let coverImg = item.cover_image || '';
    if (coverImg && (coverImg.includes('SpineShelf') || coverImg.includes('_d.jpg'))) {
      coverImg = coverImg.replace(/\/SpineShelf\//gi, '/cover500/').replace(/_d\.jpg/gi, '_1.jpg');
    }
    setForm((prev) => ({
      ...prev,
      title: item.title,
      author: item.author,
      publisher: item.publisher,
      isbn: item.isbn,
      cover_image: coverImg,
    }));
  };

  const handleFormChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.author) {
      setFormError('도서 제목과 저자는 필수 입력 항목입니다.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await api.post('/books', form);
      setShowModal(false);
      await fetchBooks();
      alert('새 도서가 성공적으로 등록되었습니다.');
    } catch (err) {
      setFormError(err?.response?.data?.message || '도서 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // Section title based on active category
  const getSectionTitle = () => {
    if (searchQuery) return `"${searchQuery}" 검색 결과`;
    if (currentCategory === '대여가능 도서') return '지금 바로 대여할 수 있는 도서';
    if (currentCategory === '전체도서') return '학우들이 신중하게 골랐어요';
    return `${currentCategory} 분야 도서 목록`;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FAF9F6' }}>
      {/* Kyobo-style Clean Section Header (No Duplicate Category Buttons) */}
      <section style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E2DC', padding: '32px 0 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#1B4332', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                  CHAEKSOOP BOOK COLLECTION
                </span>
                <span style={{ color: '#E5E2DC' }}>|</span>
                <span style={{ fontSize: '12px', color: '#6B7280' }}>
                  현재 선택: <strong style={{ color: '#1B4332' }}>{currentCategory}</strong>
                </span>
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1F2937', margin: 0, letterSpacing: '-0.5px' }}>
                {getSectionTitle()}
              </h1>
            </div>

            {/* Quick Action: Register Book Button */}
            <button
              onClick={openModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#1B4332',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '11px 20px',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#2D6A4F')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#1B4332')}
            >
              <FiPlus size={16} />
              도서 등록하기
            </button>
          </div>
        </div>
      </section>

      {/* Main Books Grid Area */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '36px 20px 80px' }}>
        {/* Status Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', color: '#6B7280' }}>
            총 <strong style={{ color: '#1B4332', fontWeight: 700 }}>{filtered.length}</strong> 권의 도서
            {searchQuery && (
              <span style={{ marginLeft: '8px' }}>
                (키워드: <strong style={{ color: '#1F2937' }}>"{searchQuery}"</strong>)
              </span>
            )}
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchParams(currentCategory !== '전체도서' ? { cat: currentCategory } : {})}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '13px',
                color: '#6B7280',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <FiX size={14} /> 검색어 지우기
            </button>
          )}
        </div>

        {/* Book Grid */}
        {loading ? (
          <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
            도서 목록을 불러오는 중입니다...
          </div>
        ) : error ? (
          <div style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B91C1C' }}>
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E2DC',
            borderRadius: '8px',
            padding: '60px 20px',
            textAlign: 'center',
            color: '#6B7280',
          }}>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#1F2937', marginBottom: '6px' }}>
              해당 조건의 도서가 존재하지 않습니다.
            </p>
            <p style={{ fontSize: '13px', marginBottom: '20px' }}>
              다른 카테고리를 선택하시거나, 가지고 계신 책을 직접 등록해보세요.
            </p>
            <button
              onClick={openModal}
              style={{
                background: '#1B4332',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '9px 20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              새 도서 등록하기
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              columnGap: '24px',
              rowGap: '40px',
            }}
          >
            {filtered.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </main>

      {/* Book Registration Modal with Zero-Key ISBN Auto Search */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid #E5E2DC',
              boxShadow: '0 16px 36px rgba(0, 0, 0, 0.16)',
              padding: '30px',
              boxSizing: 'border-box',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #F3F4F6', paddingBottom: '14px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1F2937', margin: 0 }}>
                  도서 등록
                </h2>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0' }}>
                  ISBN 번호를 입력하면 제목, 저자, 출판사, 표지 이미지가 자동 로딩됩니다.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Fast ISBN Search Section (No API Key Required) */}
            <div style={{
              background: '#FAF9F6',
              border: '1px solid #E5E2DC',
              borderRadius: '6px',
              padding: '14px 16px',
              marginBottom: '20px',
            }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#1B4332', marginBottom: '6px' }}>
                ISBN 또는 도서명으로 자동 조회
              </label>
              <form onSubmit={handleIsbnSearch} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={isbnQuery}
                  onChange={(e) => setIsbnQuery(e.target.value)}
                  placeholder="예: 9788966260959 또는 클린 코드"
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #E5E2DC',
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: '#1F2937',
                    background: '#FFFFFF',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={isbnSearching}
                  style={{
                    background: '#1B4332',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isbnSearching ? 'wait' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {isbnSearching ? '조회 중...' : '도서 조회'}
                </button>
              </form>

              {isbnSearchError && (
                <p style={{ color: '#B91C1C', fontSize: '12px', marginTop: '6px', marginBottom: 0 }}>
                  {isbnSearchError}
                </p>
              )}

              {searchResults.length > 1 && (
                <div style={{ marginTop: '10px', borderTop: '1px solid #E5E2DC', paddingTop: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#6B7280', display: 'block', marginBottom: '6px' }}>
                    검색 결과 {searchResults.length}건 (도서를 선택하세요):
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '110px', overflowY: 'auto' }}>
                    {searchResults.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectSearchResult(item)}
                        style={{
                          background: form.title === item.title ? '#D8F3DC' : '#FFFFFF',
                          border: '1px solid #E5E2DC',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#1F2937', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </span>
                        <span style={{ color: '#6B7280', fontSize: '11px', flexShrink: 0 }}>
                          {item.author}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit}>
              {/* Cover Preview */}
              {form.cover_image && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  background: '#FAF9F6',
                  border: '1px solid #E5E2DC',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                }}>
                  <img
                    src={form.cover_image}
                    alt="표지"
                    style={{
                      width: '50px',
                      height: '70px',
                      objectFit: 'cover',
                      borderRadius: '4px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                    }}
                  />
                  <div>
                    <span style={{ fontSize: '11px', color: '#1B4332', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <FiCheck size={12} /> 표지 이미지 자동 연결 완료
                    </span>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#1F2937', margin: '3px 0 1px' }}>
                      {form.title}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>
                      {form.author}
                    </p>
                  </div>
                </div>
              )}

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>
                  도서명 <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="예: 클린 코드"
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #E5E2DC',
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: '#1F2937',
                    background: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>
                    저자 <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    name="author"
                    value={form.author}
                    onChange={handleFormChange}
                    placeholder="저자명"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #E5E2DC',
                      borderRadius: '4px',
                      fontSize: '13px',
                      color: '#1F2937',
                      background: '#FFFFFF',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>
                    출판사
                  </label>
                  <input
                    name="publisher"
                    value={form.publisher}
                    onChange={handleFormChange}
                    placeholder="출판사명"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #E5E2DC',
                      borderRadius: '4px',
                      fontSize: '13px',
                      color: '#1F2937',
                      background: '#FFFFFF',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>
                    카테고리
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #E5E2DC',
                      borderRadius: '4px',
                      fontSize: '13px',
                      color: '#1F2937',
                      background: '#FFFFFF',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>
                    ISBN
                  </label>
                  <input
                    name="isbn"
                    value={form.isbn}
                    onChange={handleFormChange}
                    placeholder="ISBN 13자리"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #E5E2DC',
                      borderRadius: '4px',
                      fontSize: '13px',
                      color: '#1F2937',
                      background: '#FFFFFF',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>
                  표지 이미지 URL (선택)
                </label>
                <input
                  name="cover_image"
                  value={form.cover_image}
                  onChange={handleFormChange}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #E5E2DC',
                    borderRadius: '4px',
                    fontSize: '13px',
                    color: '#1F2937',
                    background: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {formError && (
                <p style={{ color: '#B91C1C', fontSize: '12px', marginBottom: '12px' }}>
                  {formError}
                </p>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    background: '#FFFFFF',
                    color: '#4B5563',
                    border: '1px solid #E5E2DC',
                    borderRadius: '4px',
                    padding: '9px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    background: '#1B4332',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '9px 22px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: submitting ? 'wait' : 'pointer',
                  }}
                >
                  {submitting ? '등록 중...' : '도서 등록 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
