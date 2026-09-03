import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Spin } from 'antd';
import { loadUser } from '../store/slices/authSlice';

const ProtectedRoute = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, loading, token } = useSelector((state) => state.auth);

  // Attempt to load user if we have a token but aren't authenticated yet
  useEffect(() => {
    if (token && !isAuthenticated && !loading) {
      dispatch(loadUser());
    }
  }, [token, isAuthenticated, loading, dispatch]);

  // Show spinner while verifying token
  if (loading || (token && !isAuthenticated)) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: '#0a0a1a',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" />
          <p style={{ color: '#888', marginTop: 16, fontSize: '0.9rem' }}>
            Verifying authentication…
          </p>
        </div>
      </div>
    );
  }

  // No token or failed auth → redirect to login (preserve intended URL)
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
