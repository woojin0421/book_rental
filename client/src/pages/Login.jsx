import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#FAF9F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1rem',
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E2DC',
    borderRadius: '12px',
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  },
  logo: {
    textAlign: 'center',
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1B4332',
    marginBottom: '0.25rem',
  },
  subtitle: {
    textAlign: 'center',
    color: '#6B7280',
    fontSize: '0.9rem',
    marginBottom: '2rem',
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: '0.375rem',
  },
  input: {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: '1px solid #E5E2DC',
    borderRadius: '8px',
    fontSize: '0.95rem',
    color: '#1F2937',
    backgroundColor: '#FAF9F6',
    boxSizing: 'border-box',
    outline: 'none',
  },
  fieldGroup: {
    marginBottom: '1.25rem',
  },
  button: {
    width: '100%',
    padding: '0.75rem',
    backgroundColor: '#1B4332',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  error: {
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    marginBottom: '1.25rem',
  },
  footer: {
    textAlign: 'center',
    marginTop: '1.5rem',
    fontSize: '0.875rem',
    color: '#6B7280',
  },
  link: {
    color: '#1B4332',
    fontWeight: '600',
    textDecoration: 'none',
  },
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isUserNotFound, setIsUserNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsUserNotFound(false);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      const resData = err?.response?.data;
      const code = resData?.code;
      const msg = resData?.message || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.';

      if (code === 'USER_NOT_FOUND' || msg.includes('등록되지 않은')) {
        setIsUserNotFound(true);
        setError('등록되지 않은 계정입니다. 회원가입 페이지로 이동하시겠습니까?');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2px', color: '#1B4332', textTransform: 'uppercase' }}>
            CHAEKSOOP
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#1B4332', letterSpacing: '-0.8px', marginTop: '2px' }}>
            책숲
          </div>
          <p style={{ color: '#6B7280', fontSize: '13px', margin: '6px 0 0' }}>교내 서재 로그인</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: isUserNotFound ? '#FEF3C7' : '#FEE2E2',
            color: isUserNotFound ? '#B45309' : '#B91C1C',
            borderRadius: '6px',
            padding: '12px 14px',
            fontSize: '13px',
            marginBottom: '18px',
            lineHeight: 1.4,
          }}>
            <p style={{ margin: '0 0 6px', fontWeight: 600 }}>{error}</p>
            {isUserNotFound && (
              <button
                type="button"
                onClick={() => navigate('/signup')}
                style={{
                  background: '#B45309',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: '4px',
                }}
              >
                회원가입 페이지로 이동 →
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="email">
              학교 이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="student@school.ac.kr"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="password">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
              required
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.button,
              opacity: loading ? 0.75 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <div style={styles.footer}>
          계정이 없으신가요?{' '}
          <Link to="/signup" style={styles.link}>
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
