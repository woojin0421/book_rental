import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import { FiUser, FiEdit2, FiCheck, FiX } from 'react-icons/fi';

const MyPage = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('borrowed');
  const [borrowed, setBorrowed] = useState([]);
  const [lent, setLent] = useState([]);
  const [loading, setLoading] = useState(true);

  // Nickname Edit State
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [nicknameSubmitting, setNicknameSubmitting] = useState(false);
  const [nicknameMsg, setNicknameMsg] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    setNewNickname(user.nickname || '');
    fetchRentals();
  }, [user]);

  const fetchRentals = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/rentals/me');
      setBorrowed(data.borrowed || []);
      setLent(data.lent || []);
    } catch (err) {
      console.error('대여 목록 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNickname = async (e) => {
    e.preventDefault();
    const trimmed = newNickname.trim();
    if (!trimmed) {
      alert('변경할 이름을 입력해주세요.');
      return;
    }
    setNicknameSubmitting(true);
    try {
      const res = await api.patch('/auth/me', { nickname: trimmed });
      updateUser(res.data.user);
      setIsEditingNickname(false);
      setNicknameMsg('이름이 성공적으로 변경되었습니다.');
      setTimeout(() => setNicknameMsg(''), 3000);
    } catch (err) {
      alert(err?.response?.data?.message || '이름 변경에 실패했습니다.');
    } finally {
      setNicknameSubmitting(false);
    }
  };

  const handleCancel = async (rentalId) => {
    if (!window.confirm('대여 신청을 취소하시겠습니까?')) return;
    try {
      await api.delete(`/rentals/${rentalId}`);
      fetchRentals();
    } catch (err) {
      alert('신청 취소에 실패했습니다.');
    }
  };

  const handleReturn = async (rentalId) => {
    if (!window.confirm('도서 반납 완료 처리를 진행하시겠습니까?')) return;
    try {
      await api.patch(`/rentals/${rentalId}/return`);
      fetchRentals();
    } catch (err) {
      alert('반납 처리에 실패했습니다.');
    }
  };

  const handleStatusChange = async (rentalId, status) => {
    const label = status === 'ACCEPTED' ? '수락' : '거절';
    if (!window.confirm(`대여 신청을 ${label}하시겠습니까?`)) return;
    try {
      await api.patch(`/rentals/${rentalId}/status`, { status });
      fetchRentals();
    } catch (err) {
      alert(`${label}에 실패했습니다.`);
    }
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#FAF9F6', padding: '36px 20px 80px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Kyobo-style MY Library Profile Banner with Nickname Edit */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E2DC',
            borderRadius: '8px',
            padding: '28px 32px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#FAF9F6',
                border: '1px solid #E5E2DC',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1B4332',
                fontSize: '26px',
              }}
            >
              <FiUser />
            </div>

            <div>
              {isEditingNickname ? (
                <form onSubmit={handleUpdateNickname} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <input
                    type="text"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    placeholder="새 이름(닉네임)"
                    required
                    style={{
                      padding: '5px 10px',
                      border: '1px solid #1B4332',
                      borderRadius: '4px',
                      fontSize: '14px',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={nicknameSubmitting}
                    style={{
                      background: '#1B4332',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '5px 12px',
                      fontSize: '13px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingNickname(false);
                      setNewNickname(user.nickname);
                    }}
                    style={{
                      background: '#FFFFFF',
                      color: '#6B7280',
                      border: '1px solid #E5E2DC',
                      borderRadius: '4px',
                      padding: '5px 10px',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    취소
                  </button>
                </form>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#1F2937', margin: 0 }}>
                    {user.nickname}
                  </h1>
                  <span style={{ fontSize: '13px', color: '#6B7280' }}>학우님</span>
                  <button
                    onClick={() => setIsEditingNickname(true)}
                    style={{
                      background: 'none',
                      border: '1px solid #E5E2DC',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      color: '#4B5563',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginLeft: '4px',
                    }}
                    title="이름 변경"
                  >
                    <FiEdit2 size={11} /> 이름 변경
                  </button>
                </div>
              )}

              {nicknameMsg && (
                <span style={{ fontSize: '12px', color: '#1B4332', fontWeight: 600, display: 'block', marginTop: '2px' }}>
                  {nicknameMsg}
                </span>
              )}

              <p style={{ fontSize: '13px', color: '#6B7280', margin: '4px 0 0' }}>
                {user.email} {user.student_id ? `· 학번 ${user.student_id}` : ''}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '24px', borderLeft: '1px solid #F3F4F6', paddingLeft: '24px' }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>빌린 도서</span>
              <strong style={{ fontSize: '20px', fontWeight: 800, color: '#1B4332' }}>{borrowed.length}</strong>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '12px', color: '#6B7280', display: 'block' }}>빌려준 도서</span>
              <strong style={{ fontSize: '20px', fontWeight: 800, color: '#1B4332' }}>{lent.length}</strong>
            </div>
          </div>
        </div>

        {/* Tab Row (Kyobo Style) */}
        <div style={{ display: 'flex', borderBottom: '2px solid #1F2937', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('borrowed')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'none',
              fontSize: '15px',
              fontWeight: activeTab === 'borrowed' ? 800 : 500,
              color: activeTab === 'borrowed' ? '#1B4332' : '#6B7280',
              borderBottom: activeTab === 'borrowed' ? '3px solid #1B4332' : '3px solid transparent',
              marginBottom: '-2px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            내가 빌린 도서 ({borrowed.length})
          </button>
          <button
            onClick={() => setActiveTab('lent')}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'none',
              fontSize: '15px',
              fontWeight: activeTab === 'lent' ? 800 : 500,
              color: activeTab === 'lent' ? '#1B4332' : '#6B7280',
              borderBottom: activeTab === 'lent' ? '3px solid #1B4332' : '3px solid transparent',
              marginBottom: '-2px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            내가 빌려준 도서 ({lent.length})
          </button>
        </div>

        {/* Content Section */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#6B7280', fontSize: '14px' }}>
            대여 내역을 조회하고 있습니다...
          </div>
        ) : activeTab === 'borrowed' ? (
          borrowed.length === 0 ? (
            <div style={{ background: '#FFFFFF', border: '1px solid #E5E2DC', borderRadius: '8px', padding: '60px 20px', textAlign: 'center', color: '#6B7280' }}>
              <p style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937', marginBottom: '6px' }}>
                대여 중이거나 신청한 도서가 없습니다.
              </p>
              <p style={{ fontSize: '13px', marginBottom: '18px' }}>
                책숲 서재에서 읽고 싶은 도서를 찾아보세요.
              </p>
              <Link
                to="/"
                style={{
                  display: 'inline-block',
                  background: '#1B4332',
                  color: '#FFFFFF',
                  padding: '9px 18px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                도서 목록 둘러보기
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {borrowed.map((item) => (
                <div
                  key={item.rental_id}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5E2DC',
                    borderRadius: '8px',
                    padding: '18px 22px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                  }}
                >
                  {/* Cover */}
                  <div
                    style={{
                      width: '54px',
                      height: '76px',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      backgroundColor: '#F3F4F6',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                    }}
                  >
                    {item.cover_image ? (
                      <img src={item.cover_image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#1B4332', color: '#FAF9F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', textAlign: 'center', padding: '4px', boxSizing: 'border-box' }}>
                        책숲
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1F2937', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 4px' }}>
                      {item.author}
                    </p>
                    <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                      책 소유자: <span style={{ color: '#4B5563', fontWeight: 600 }}>{item.owner_nickname}</span>
                    </p>
                  </div>

                  {/* Badge */}
                  <StatusBadge status={item.status} />

                  {/* Action */}
                  <div style={{ flexShrink: 0 }}>
                    {item.status === 'REQUESTED' && (
                      <button
                        onClick={() => handleCancel(item.rental_id)}
                        style={{
                          background: '#FFFFFF',
                          color: '#4B5563',
                          border: '1px solid #E5E2DC',
                          borderRadius: '4px',
                          padding: '7px 14px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        신청 취소
                      </button>
                    )}
                    {item.status === 'ACCEPTED' && (
                      <button
                        onClick={() => handleReturn(item.rental_id)}
                        style={{
                          background: '#1B4332',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '7px 16px',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        반납 완료하기
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : lent.length === 0 ? (
          <div style={{ background: '#FFFFFF', border: '1px solid #E5E2DC', borderRadius: '8px', padding: '60px 20px', textAlign: 'center', color: '#6B7280' }}>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#1F2937', marginBottom: '6px' }}>
              대여 신청이 들어왔거나 빌려준 내역이 없습니다.
            </p>
            <p style={{ fontSize: '13px', margin: 0 }}>
              소유하고 있는 도서를 등록하여 학우들의 대여 신청을 받아보세요.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 1. Pending Requests (Needs Owner Approval) */}
            {lent.filter((i) => i.status === 'REQUESTED').length > 0 && (
              <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', padding: '18px 20px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#B45309', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>●</span> 수락 대기 중인 대여 신청 ({lent.filter((i) => i.status === 'REQUESTED').length}건)
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {lent
                    .filter((item) => item.status === 'REQUESTED')
                    .map((item) => (
                      <div
                        key={item.rental_id}
                        style={{
                          background: '#FFFFFF',
                          border: '1px solid #FDE68A',
                          borderRadius: '6px',
                          padding: '14px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '16px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          {item.cover_image && (
                            <img src={item.cover_image} alt="" style={{ width: '40px', height: '56px', objectFit: 'cover', borderRadius: '3px' }} />
                          )}
                          <div>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: '#1F2937' }}>{item.title}</span>
                            <p style={{ fontSize: '13px', color: '#4B5563', margin: '2px 0 0' }}>
                              신청자: <strong style={{ color: '#1B4332' }}>{item.borrower_nickname}</strong> 학우님
                            </p>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleStatusChange(item.rental_id, 'ACCEPTED')}
                            style={{
                              background: '#1B4332',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '8px 18px',
                              fontSize: '13px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            신청 수락
                          </button>
                          <button
                            onClick={() => handleStatusChange(item.rental_id, 'REJECTED')}
                            style={{
                              background: '#FFFFFF',
                              color: '#DC2626',
                              border: '1px solid #FCA5A5',
                              borderRadius: '4px',
                              padding: '8px 14px',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            거절
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 2. All / In-progress Lent History */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#4B5563', marginBottom: '10px' }}>
                전체 대여 관리 목록 ({lent.length}건)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {lent.map((item) => (
                  <div
                    key={item.rental_id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E5E2DC',
                      borderRadius: '8px',
                      padding: '18px 22px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '20px',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                    }}
                  >
                    {/* Cover */}
                    <div
                      style={{
                        width: '54px',
                        height: '76px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        backgroundColor: '#F3F4F6',
                        flexShrink: 0,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                      }}
                    >
                      {item.cover_image ? (
                        <img src={item.cover_image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: '#1B4332', color: '#FAF9F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', textAlign: 'center', padding: '4px', boxSizing: 'border-box' }}>
                          책숲
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1F2937', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 4px' }}>
                        {item.author}
                      </p>
                      <p style={{ fontSize: '12px', color: '#9CA3AF', margin: 0 }}>
                        신청자: <span style={{ color: '#1B4332', fontWeight: 600 }}>{item.borrower_nickname}</span>
                      </p>
                    </div>

                    {/* Badge */}
                    <StatusBadge status={item.status} />

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                      {item.status === 'REQUESTED' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(item.rental_id, 'ACCEPTED')}
                            style={{
                              background: '#1B4332',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '7px 16px',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            수락
                          </button>
                          <button
                            onClick={() => handleStatusChange(item.rental_id, 'REJECTED')}
                            style={{
                              background: '#FFFFFF',
                              color: '#DC2626',
                              border: '1px solid #FCA5A5',
                              borderRadius: '4px',
                              padding: '7px 14px',
                              fontSize: '13px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            거절
                          </button>
                        </>
                      )}
                      {item.status === 'ACCEPTED' && (
                        <button
                          onClick={() => handleReturn(item.rental_id)}
                          style={{
                            background: '#1B4332',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '7px 16px',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          반납 확인 처리
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPage;
