import React, { useState } from 'react';
import axios from 'axios';
import config from '../config';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${config.apiUrl}/api/login`, formData);
      if (response.data.success) {
        onLogin(response.data.user);
      } else {
        setError('登入失敗');
      }
    } catch (err) {
      setError(err.response?.data?.error || '登入失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ 
            color: '#2c3e50', 
            marginBottom: '10px',
            fontSize: '2rem',
            fontWeight: '300'
          }}>
            訂單管理系統
          </h1>
          <p style={{ color: '#7f8c8d', fontSize: '1rem' }}>
            請選擇您的身份登入
          </p>
        </div>

        {error && (
          <div className="error" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">帳號</label>
            <input
              type="text"
              name="username"
              className="form-input"
              value={formData.username}
              onChange={handleInputChange}
              placeholder="請輸入帳號"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">密碼</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="請輸入密碼"
              required
            />
          </div>

          <button 
            type="submit" 
            className="button success"
            disabled={loading}
            style={{ width: '100%', padding: '15px', fontSize: '16px' }}
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </form>

        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          background: '#f8f9fa', 
          borderRadius: '8px',
          fontSize: '14px',
          color: '#666'
        }}>
          <h4 style={{ marginBottom: '10px', color: '#2c3e50' }}>測試帳號：</h4>
          <div style={{ marginBottom: '8px' }}>
            <strong>管理者：</strong> admin / admin123
          </div>
          <div>
            <strong>廚房員工：</strong> kitchen / kitchen123
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
