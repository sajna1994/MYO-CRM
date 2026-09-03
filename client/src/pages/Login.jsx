import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Form, Input, Button, Alert, Checkbox, Divider } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { loginUser, clearError } from '../store/slices/authSlice';

const Login = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  const from = location.state?.from?.pathname || '/';

  useEffect(() => { if (isAuthenticated) navigate(from, { replace: true }); }, [isAuthenticated, navigate, from]);
  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  return <section className="auth-form">
    <header className="auth-form-heading"><h1>Welcome Back!</h1><p>Sign in to continue</p></header>
    {error && <Alert message={error} type="error" showIcon closable onClose={() => dispatch(clearError())} style={{ marginBottom: 20 }} />}
    <Form form={form} name="login" layout="vertical" onFinish={(values) => dispatch(loginUser(values))} autoComplete="off" size="large" requiredMark={false}>
      <Form.Item name="email" label="Username" rules={[{ required: true, message: 'Please enter your email' }, { type: 'email', message: 'Please enter a valid email' }]}>
        <Input prefix={<MailOutlined />} placeholder="Username or email" />
      </Form.Item>
      <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please enter your password' }]}>
        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
      </Form.Item>
      <div className="auth-options"><Checkbox>Remember me</Checkbox><a href="#forgot-password">Forgot Password?</a></div>
      <Form.Item style={{ marginBottom: 0, marginTop: 26 }}><Button type="primary" htmlType="submit" loading={loading} block className="auth-submit">{loading ? 'Logging in…' : 'LOGIN'}</Button></Form.Item>
    </Form>
    <Divider plain>or</Divider>
    <Button className="google-button" block><span className="google-mark">G</span>Login with Google</Button>
    <div className="auth-switch">Don't have an account? <Link to="/register">Create one</Link></div>
  </section>;
};

export default Login;
