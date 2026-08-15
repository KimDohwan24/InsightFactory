import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    const success = await login(username, password);
    if (success) {
      navigate('/', { replace: true });
    } else {
      setError('로그인에 실패했습니다. (데모: 임의의 문자 입력)');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="nav-brand" style={{ justifyContent: 'center', marginBottom: '8px' }}>
            <span className="brand-spike" style={{ fontSize: '24px' }}>✸</span>
            <span className="brand-name" style={{ fontSize: '24px' }}>InsightFactory</span>
          </div>
          <h2 className="login-title">Administrator Login</h2>
          <p className="login-subtitle">스마트 팩토리 중앙 관제 시스템</p>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Username / ID</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your ID (ex. admin)"
              autoComplete="username"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>
          
          <button type="submit" className="login-submit-btn">
            로그인 (Sign In)
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
