import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Input, Button, Alert, Divider } from 'antd';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { registerUser, clearError } from '../store/slices/authSlice';

const Register = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);
  useEffect(() => { if (isAuthenticated) navigate('/', { replace: true }); }, [isAuthenticated, navigate]);
  useEffect(() => { dispatch(clearError()); }, [dispatch]);
  const submit = ({ confirmPassword, ...values }) => dispatch(registerUser(values));

  return <section className="auth-form auth-register-form">
    <header className="auth-form-heading"><h1>Create Account</h1><p>Start managing your fitness studio</p></header>
    {error && <Alert message={error} type="error" showIcon closable onClose={() => dispatch(clearError())} style={{ marginBottom: 20 }} />}
    <Form form={form} name="register" layout="vertical" onFinish={submit} autoComplete="off" size="large" requiredMark={false}>
      <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please enter your name' }, { min: 2, message: 'Name must be at least 2 characters' }]}><Input prefix={<UserOutlined />} placeholder="John Doe" /></Form.Item>
      <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Please enter your email' }, { type: 'email', message: 'Please enter a valid email' }]}><Input prefix={<MailOutlined />} placeholder="you@example.com" /></Form.Item>
      <Form.Item name="password" label="Password" rules={[{ required: true, message: 'Please enter a password' }, { min: 6, message: 'Password must be at least 6 characters' }]}><Input.Password prefix={<LockOutlined />} placeholder="Minimum 6 characters" /></Form.Item>
      <Form.Item name="confirmPassword" label="Confirm Password" dependencies={['password']} rules={[{ required: true, message: 'Please confirm your password' }, ({ getFieldValue }) => ({ validator: (_, value) => !value || getFieldValue('password') === value ? Promise.resolve() : Promise.reject(new Error('Passwords do not match')) })]}><Input.Password prefix={<LockOutlined />} placeholder="Re-enter password" /></Form.Item>
      <Form.Item style={{ marginBottom: 0, marginTop: 26 }}><Button type="primary" htmlType="submit" loading={loading} block className="auth-submit">{loading ? 'Creating account…' : 'CREATE ACCOUNT'}</Button></Form.Item>
    </Form>
    <Divider plain>or</Divider><div className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></div>
  </section>;
};

export default Register;
