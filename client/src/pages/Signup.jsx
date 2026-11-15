import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#FAF9F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem 1rem',
  },
  card: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E2DC',
    borderRadius: '12px',
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '460px',
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
    marginBottom: '1.1rem',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
    marginBottom: '1.1rem',
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
  success: {
    backgroundColor: '#D8F3DC',
    color: '#1B4332',
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

const INITIAL_FORM = {
  email: '',
  password: '',
  nickname: '',
  phoneNumber: '',
  entryYear: '',
  studentId: '',
};

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await api.post('/auth/signup', {
        ...form,
        entryYear: Number(form.entryYear),
      });
      setSuccess('회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          '회원가입에 실패했습니다. 입력 내용을 확인해주세요.'
      );
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
          <p style={{ color: '#6B7280', fontSize: '13px', margin: '6px 0 0' }}>학우 회원가입</p>
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

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
              placeholder="8자 이상 입력하세요"
              required
              minLength={8}
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="nickname">
              닉네임
            </label>
            <input
              id="nickname"
              name="nickname"
              type="text"
              value={form.nickname}
              onChange={handleChange}
              placeholder="표시될 닉네임"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="phoneNumber">
              전화번호
            </label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              value={form.phoneNumber}
              onChange={handleChange}
              placeholder="010-0000-0000"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <div>
              <label style={styles.label} htmlFor="entryYear">
                입학년도
              </label>
              <input
                id="entryYear"
                name="entryYear"
                type="number"
                value={form.entryYear}
                onChange={handleChange}
                placeholder="2024"
                required
                min={2000}
                max={2099}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label} htmlFor="studentId">
                학번
              </label>
              <input
                id="studentId"
                name="studentId"
                type="text"
                value={form.studentId}
                onChange={handleChange}
                placeholder="20240001"
                required
                style={styles.input}
              />
            </div>
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
            {loading ? '가입 중...' : '가입하기'}
          </button>
        </form>

        <div style={styles.footer}>
          이미 계정이 있으신가요?{' '}
          <Link to="/login" style={styles.link}>
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
