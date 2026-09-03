import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import store from './store';
import App from './App';
import './index.css';

const antdTheme = {
  token: {
    colorPrimary: '#ff7600',
    colorInfo: '#ff7600',
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorText: '#141820',
    borderRadius: 9,
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <ConfigProvider theme={antdTheme}>
          <App />
        </ConfigProvider>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
