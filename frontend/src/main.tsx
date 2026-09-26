import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { App as AntApp, ConfigProvider } from 'antd'
import jaJP from 'antd/locale/ja_JP'
import 'dayjs/locale/ja'
import dayjs from 'dayjs'
import { AuthProvider } from './auth'
import App from './App'

dayjs.locale('ja')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider locale={jaJP} button={{ autoInsertSpace: false }}>
      <AntApp>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
)
