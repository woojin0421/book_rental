import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { FiChevronRight, FiPlus, FiX, FiCheck, FiMapPin, FiMessageSquare } from 'react-icons/fi';

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [book, setBook] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 내 책 등록 모달
  const [showRegModal, setShowRegModal] = useState(false);
  const [regForm, setRegForm] = useState({ owner_comment: '', location: '' });
  const [regSubmitting, setRegSubmitting] = useState(false);
  const [regError, setRegError] = useState('');

  // 대여 신청 상태
  const [rentingId, setRentingId] = useState(null);

  // [책 주인 전용] 대여 신청자 목록 모달 상태
  const [activeItemForRequests, setActiveItemForRequests] = useState(null);
  const [itemRequests, setItemRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [actionProcessingId, setActionProcessingId] = useState(null);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/books/${id}`);
      setBook(res.data.book);
      setRentals(res.data.rentals || []);
    } catch (e) {
      setError('도서 정보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id, user]);

  // 책 주인: 특정 책의 신청자 목록 모달 열기
  const openRequestsModal = async (rental_item_id) => {
    setActiveItemForRequests(rental_item_id);
    setLoadingRequests(true);
    try {
      const res = await api.get(`/rentals/items/${rental_item_id}/requests`);
      setItemRequests(res.data.requests || []);
    } catch (err) {
      alert(err?.response?.data?.message || '신청자 목록을 불러오지 못했습니다.');
    } finally {
      setLoadingRequests(false);
    }
  };

  // 책 주인: 대여 수락 / 거절 처리
  const handleOwnerAction = async (rentalId, status) => {
    const label = status === 'ACCEPTED' ? '수락' : '거절';
    if (!window.confirm(`이 학우의 대여 신청을 ${label}하시겠습니까?`)) return;

    setActionProcessingId(rentalId);
    try {
      await api.patch(`/rentals/${rentalId}/status`, { status });
      alert(`대여 신청이 성공적으로 ${label}되었습니다.`);
      // 새로고침
      await fetchDetail();
      if (activeItemForRequests) {
        const res = await api.get(`/rentals/items/${activeItemForRequests}/requests`);
        setItemRequests(res.data.requests || []);
      }
    } catch (err) {
      alert(err?.response?.data?.message || `${label} 처리에 실패했습니다.`);
    } finally {
      setActionProcessingId(null);
    }
  };

  const handleRent = async (rental_item_id) => {
    if (!user) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/login');
      return;
    }
    setRentingId(rental_item_id);
    try {
      await api.post('/rentals', { rental_item_id });
      // 즉시 UI에 반영: 해당 항목의 신청 상태를 'REQUESTED'로 변경
      setRentals((prev) =>
        prev.map((item) =>
          item.rental_item_id === rental_item_id
            ? { ...item, my_request_status: 'REQUESTED' }
            : item
        )
      );
      alert('대여 신청이 완료되었습니다.');
      await fetchDetail();
    } catch (err) {
      alert(err?.response?.data?.message || '대여 신청에 실패했습니다.');
    } finally {
      setRentingId(null);
    }
  };

  const openRegModal = () => {
    if (!user) {
      alert('로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.');
      navigate('/login');
      return;
    }
    // [중복 등록 방지]: 이미 본인이 등록한 경우 차단
    const alreadyRegistered = rentals.some((r) => Number(r.owner_id) === Number(user.id));
    if (alreadyRegistered) {
      alert('이미 회원님께서 대여 등록하신 도서입니다. 아래 목록의 [신청 관리]를 이용해주세요.');
      return;
    }
    setRegForm({ owner_comment: '', location: '' });
    setRegError('');
    setShowRegModal(true);
  };

  const handleRegChange = (e) => {
    setRegForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegSubmit = async (e) => {
    e.preventDefault();
    if (!regForm.location) {
      setRegError('교내 거래 장소를 입력해주세요.');
      return;
    }
    setRegSubmitting(true);
    setRegError('');
    try {
      await api.post(`/books/${id}/rentals`, regForm);
      setShowRegModal(false);
      await fetchDetail();
      alert('소유 도서가 대여 목록에 등록되었습니다.');
    } catch (err) {
      setRegError(err?.response?.data?.message || '등록에 실패했습니다.');
    } finally {
      setRegSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
        도서 정보를 불러오는 중입니다...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B91C1C' }}>
        {error}
      </div>
    );
  }

  if (!book) return null;

  const availableCount = rentals.filter((r) => r.status === 'AVAILABLE').length;

  return (
    <div style={{ minHeight: '100vh', background: '#FAF9F6' }}>
      {/* Breadcrumb Navigation (Kyobo Style) */}
      <div style={{ background: '#FFFFFF', borderBottom: '1px solid #E5E2DC' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#6B7280' }}>
          <Link to="/" style={{ color: '#6B7280', textDecoration: 'none' }}>홈</Link>
          <FiChevronRight size={14} />
          <Link to={`/?cat=${encodeURIComponent(book.category)}`} style={{ color: '#6B7280', textDecoration: 'none' }}>{book.category}</Link>
          <FiChevronRight size={14} />
          <span style={{ color: '#1F2937', fontWeight: 600, maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {book.title}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '36px 20px 60px' }}>
        {/* Book Header Section (Kyobo Product Detail Layout) */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E2DC',
            borderRadius: '8px',
            padding: '36px',
            marginBottom: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex',
            gap: '40px',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          {/* Book Cover with 3D Shadow */}
          <div
            style={{
              width: '180px',
              aspectRatio: '1 / 1.45',
              flexShrink: 0,
              borderRadius: '4px',
              overflow: 'hidden',
              boxShadow: '0 12px 24px rgba(0,0,0,0.15), 0 4px 8px rgba(0,0,0,0.08)',
              backgroundColor: '#F3F4F6',
            }}
          >
            {book.cover_image ? (
              <img
                src={book.cover_image}
                alt={book.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(145deg, #1B4332 0%, #0F281E 100%)',
                  color: '#FFFFFF',
                  padding: '16px',
                  boxSizing: 'border-box',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '10px', opacity: 0.7, letterSpacing: '1px' }}>CHAEKSOOP</span>
                <p style={{ fontSize: '15px', fontWeight: 700, margin: 0, lineHeight: 1.35 }}>{book.title}</p>
                <span style={{ fontSize: '11px', opacity: 0.8 }}>{book.author}</span>
              </div>
            )}
          </div>

          {/* Book Metadata & Actions */}
          <div style={{ flex: 1, minWidth: '280px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span
                style={{
                  background: '#D8F3DC',
                  color: '#1B4332',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                }}
              >
                {book.category}
              </span>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>
                대여 가능 <strong style={{ color: '#1B4332' }}>{availableCount}</strong> 권 / 총 {rentals.length} 권
              </span>
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#1F2937', margin: '0 0 16px', lineHeight: 1.35, letterSpacing: '-0.5px' }}>
              {book.title}
            </h1>

            {/* Kyobo-style Spec Table */}
            <div style={{ borderTop: '1px solid #F3F4F6', borderBottom: '1px solid #F3F4F6', padding: '16px 0', marginBottom: '24px', display: 'grid', gridTemplateColumns: '80px 1fr', rowGap: '10px', fontSize: '14px' }}>
              <span style={{ color: '#6B7280' }}>저자</span>
              <span style={{ color: '#1F2937', fontWeight: 600 }}>{book.author}</span>

              <span style={{ color: '#6B7280' }}>출판사</span>
              <span style={{ color: '#1F2937' }}>{book.publisher || '정보 없음'}</span>

              <span style={{ color: '#6B7280' }}>ISBN</span>
              <span style={{ color: '#1F2937', fontFamily: 'monospace' }}>{book.isbn || '정보 없음'}</span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {user && rentals.some((r) => Number(r.owner_id) === Number(user.id)) ? (
                <button
                  onClick={() => alert('이미 회원님께서 대여 등록하신 도서입니다. 아래 소유자 목록에서 [신청 관리]를 확인해주세요.')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#F3F4F6',
                    color: '#4B5563',
                    border: '1px solid #E5E2DC',
                    borderRadius: '6px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <FiCheck size={16} color="#1B4332" /> 이미 대여 등록한 도서입니다
                </button>
              ) : (
                <button
                  onClick={openRegModal}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    background: '#1B4332',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '12px 24px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#2D6A4F')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#1B4332')}
                >
                  <FiPlus size={16} /> 내 소유 도서 등록하기
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Available Rentals Section (Kyobo Style Store Inventory) */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E2DC',
            borderRadius: '8px',
            padding: '28px 32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', borderBottom: '2px solid #1F2937', paddingBottom: '12px' }}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#1F2937', margin: 0 }}>
              교내 대여 가능 목록
            </h2>
            <span style={{ fontSize: '13px', color: '#6B7280' }}>
              등록된 도서 {rentals.length}권
            </span>
          </div>

          {rentals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#6B7280' }}>
              <p style={{ fontSize: '14px', color: '#1F2937', fontWeight: 600, marginBottom: '6px' }}>
                현재 등록된 실물 도서가 없습니다.
              </p>
              <p style={{ fontSize: '13px', margin: 0 }}>
                이 책을 소유하고 계시다면 상단의 <strong>[내 소유 도서 등록하기]</strong>를 통해 학우들과 나눠보세요.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ background: '#FAF9F6', borderBottom: '1px solid #E5E2DC', color: '#4B5563', fontSize: '13px' }}>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600 }}>소유자</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600 }}>거래 희망 장소</th>
                    <th style={{ textAlign: 'left', padding: '10px 14px', fontWeight: 600 }}>도서 상태 및 한줄평</th>
                    <th style={{ textAlign: 'center', padding: '10px 14px', fontWeight: 600, width: '110px' }}>대여 상태</th>
                    <th style={{ textAlign: 'right', padding: '10px 14px', fontWeight: 600, width: '130px' }}>관리 / 신청</th>
                  </tr>
                </thead>
                <tbody>
                  {rentals.map((r) => {
                    const isMyItem = user && Number(user.id) === Number(r.owner_id);
                    return (
                      <tr key={r.rental_item_id} style={{ borderBottom: '1px solid #F3F4F6', background: isMyItem ? '#FAFAF8' : 'transparent' }}>
                        <td style={{ padding: '14px 14px', color: '#1F2937', fontWeight: 600 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{r.owner_nickname}</span>
                            {isMyItem && (
                              <span style={{ fontSize: '11px', background: '#D8F3DC', color: '#1B4332', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                내 도서
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '14px 14px', color: '#4B5563' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <FiMapPin size={13} color="#6B7280" /> {r.location}
                          </span>
                        </td>
                        <td style={{ padding: '14px 14px', color: '#6B7280' }}>
                          {r.owner_comment ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <FiMessageSquare size={13} color="#9CA3AF" /> {r.owner_comment}
                            </span>
                          ) : (
                            <span style={{ color: '#9CA3AF' }}>특이사항 없음</span>
                          )}
                        </td>
                        <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                          <StatusBadge status={r.status} />
                        </td>
                        <td style={{ padding: '14px 14px', textAlign: 'right' }}>
                          {isMyItem ? (
                            <button
                              onClick={() => openRequestsModal(r.rental_item_id)}
                              style={{
                                padding: '7px 14px',
                                borderRadius: '4px',
                                fontWeight: 700,
                                fontSize: '13px',
                                cursor: 'pointer',
                                background: Number(r.request_count) > 0 ? '#1B4332' : '#FFFFFF',
                                color: Number(r.request_count) > 0 ? '#FFFFFF' : '#1B4332',
                                border: '1px solid #1B4332',
                                transition: 'all 0.15s',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              신청 관리 {Number(r.request_count) > 0 ? `(${r.request_count}건)` : ''}
                            </button>
                          ) : r.my_request_status === 'REQUESTED' ? (
                            <button
                              disabled
                              title="도서 소유자의 대여 수락을 기다리고 있습니다."
                              style={{
                                padding: '7px 16px',
                                borderRadius: '4px',
                                fontWeight: 700,
                                fontSize: '13px',
                                cursor: 'not-allowed',
                                background: '#FEF3C7',
                                color: '#B45309',
                                border: '1px solid #FCD34D',
                                whiteSpace: 'nowrap',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <FiCheck size={14} /> 대여신청완료
                            </button>
                          ) : r.my_request_status === 'ACCEPTED' ? (
                            <button
                              disabled
                              style={{
                                padding: '7px 16px',
                                borderRadius: '4px',
                                fontWeight: 700,
                                fontSize: '13px',
                                cursor: 'not-allowed',
                                background: '#D8F3DC',
                                color: '#1B4332',
                                border: '1px solid #B7E4C7',
                                whiteSpace: 'nowrap',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <FiCheck size={14} /> 대여 이용 중
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRent(r.rental_item_id)}
                              disabled={r.status !== 'AVAILABLE' || rentingId === r.rental_item_id}
                              style={{
                                padding: '7px 16px',
                                borderRadius: '4px',
                                fontWeight: 700,
                                fontSize: '13px',
                                cursor: r.status === 'AVAILABLE' ? 'pointer' : 'not-allowed',
                                background: r.status === 'AVAILABLE' ? '#1B4332' : '#F3F4F6',
                                color: r.status === 'AVAILABLE' ? '#FFFFFF' : '#9CA3AF',
                                border: 'none',
                                transition: 'background 0.15s',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {rentingId === r.rental_item_id ? '처리 중' : '대여 신청'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Register My Book Modal */}
      {showRegModal && (
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
            if (e.target === e.currentTarget) setShowRegModal(false);
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '8px',
              padding: '28px 32px',
              width: '100%',
              maxWidth: '460px',
              border: '1px solid #E5E2DC',
              boxShadow: '0 16px 36px rgba(0,0,0,0.16)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #F3F4F6', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1F2937', margin: 0 }}>
                내 소유 도서 대여 등록
              </h2>
              <button
                onClick={() => setShowRegModal(false)}
                style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
              >
                <FiX size={18} />
              </button>
            </div>

            <div style={{ background: '#FAF9F6', border: '1px solid #E5E2DC', borderRadius: '6px', padding: '12px', marginBottom: '18px' }}>
              <span style={{ fontSize: '11px', color: '#1B4332', fontWeight: 700 }}>대여 등록 도서</span>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937', margin: '4px 0 2px' }}>{book.title}</p>
              <p style={{ fontSize: '12px', color: '#6B7280', margin: 0 }}>{book.author}</p>
            </div>

            <form onSubmit={handleRegSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>
                  거래 희망 장소 <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  name="location"
                  value={regForm.location}
                  onChange={handleRegChange}
                  placeholder="예: 중앙도서관 1층 로비, 공학관 라운지"
                  required
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #E5E2DC',
                    borderRadius: '4px',
                    fontSize: '14px',
                    color: '#1F2937',
                    background: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>
                  도서 상태 및 한줄평 (선택)
                </label>
                <input
                  name="owner_comment"
                  value={regForm.owner_comment}
                  onChange={handleRegChange}
                  placeholder="예: 밑줄 없음, 깨끗하게 사용했어요"
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #E5E2DC',
                    borderRadius: '4px',
                    fontSize: '14px',
                    color: '#1F2937',
                    background: '#FFFFFF',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {regError && <p style={{ color: '#B91C1C', fontSize: '13px', marginBottom: '14px' }}>{regError}</p>}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowRegModal(false)}
                  style={{
                    background: '#FFFFFF',
                    color: '#4B5563',
                    border: '1px solid #E5E2DC',
                    borderRadius: '4px',
                    padding: '9px 18px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={regSubmitting}
                  style={{
                    background: '#1B4332',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '9px 22px',
                    fontSize: '14px',
                    fontWeight: 700,
                    cursor: regSubmitting ? 'wait' : 'pointer',
                  }}
                >
                  {regSubmitting ? '등록 중...' : '등록 완료'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Owner's Rental Requests Management Modal */}
      {activeItemForRequests && (
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
            if (e.target === e.currentTarget) setActiveItemForRequests(null);
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '8px',
              padding: '28px 32px',
              width: '100%',
              maxWidth: '520px',
              maxHeight: '85vh',
              overflowY: 'auto',
              border: '1px solid #E5E2DC',
              boxShadow: '0 16px 36px rgba(0,0,0,0.16)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #F3F4F6', paddingBottom: '12px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1F2937', margin: 0 }}>
                  대여 신청자 목록 및 수락
                </h2>
                <p style={{ fontSize: '12px', color: '#6B7280', margin: '4px 0 0' }}>
                  신청자 중 한 명을 수락하면, 나머지 신청 건은 자동으로 거절 처리됩니다.
                </p>
              </div>
              <button
                onClick={() => setActiveItemForRequests(null)}
                style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '4px' }}
              >
                <FiX size={18} />
              </button>
            </div>

            {loadingRequests ? (
              <div style={{ textAlign: 'center', padding: '36px 0', color: '#6B7280', fontSize: '14px' }}>
                신청 목록을 불러오는 중...
              </div>
            ) : itemRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#6B7280' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937', marginBottom: '4px' }}>
                  현재 대기 중인 대여 신청이 없습니다.
                </p>
                <p style={{ fontSize: '12px', margin: 0 }}>
                  학우들이 신청을 접수하면 이곳에 목록이 표시됩니다.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {itemRequests.map((req) => (
                  <div
                    key={req.rental_id}
                    style={{
                      background: '#FAF9F6',
                      border: '1px solid #E5E2DC',
                      borderRadius: '6px',
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937' }}>
                          {req.borrower_nickname}
                        </span>
                        <StatusBadge status={req.status} />
                      </div>
                      <span style={{ fontSize: '11px', color: '#9CA3AF', display: 'block', marginTop: '4px' }}>
                        신청일시: {new Date(req.created_at).toLocaleString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleOwnerAction(req.rental_id, 'ACCEPTED')}
                        disabled={actionProcessingId === req.rental_id}
                        style={{
                          background: '#1B4332',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '7px 14px',
                          fontSize: '13px',
                          fontWeight: 700,
                          cursor: actionProcessingId === req.rental_id ? 'wait' : 'pointer',
                        }}
                      >
                        수락
                      </button>
                      <button
                        onClick={() => handleOwnerAction(req.rental_id, 'REJECTED')}
                        disabled={actionProcessingId === req.rental_id}
                        style={{
                          background: '#FFFFFF',
                          color: '#DC2626',
                          border: '1px solid #FCA5A5',
                          borderRadius: '4px',
                          padding: '7px 12px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: actionProcessingId === req.rental_id ? 'wait' : 'pointer',
                        }}
                      >
                        거절
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                type="button"
                onClick={() => setActiveItemForRequests(null)}
                style={{
                  background: '#FFFFFF',
                  color: '#4B5563',
                  border: '1px solid #E5E2DC',
                  borderRadius: '4px',
                  padding: '8px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
