import { Button, Layout, Space, Typography } from 'antd'
import { Link, Route, Routes, useNavigate } from 'react-router-dom'
import { useAuth } from './auth'
import ReviewList from './pages/ReviewList'
import ReviewDetail from './pages/ReviewDetail'
import ReviewForm from './pages/ReviewForm'
import Login from './pages/Login'

export default function App() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Header
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}
      >
        <Link to="/">
          <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
            🎬 Movie Reviews
          </Typography.Title>
        </Link>
        <Space>
          {admin ? (
            <>
              <Button type="primary" onClick={() => navigate('/reviews/new')}>
                レビューを書く
              </Button>
              <Button ghost onClick={logout}>
                ログアウト
              </Button>
            </>
          ) : (
            <Button ghost onClick={() => navigate('/login')}>
              ログイン
            </Button>
          )}
        </Space>
      </Layout.Header>
      <Layout.Content style={{ padding: 16, maxWidth: 880, width: '100%', margin: '0 auto' }}>
        <Routes>
          <Route path="/" element={<ReviewList />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reviews/new" element={<ReviewForm />} />
          <Route path="/reviews/:id" element={<ReviewDetail />} />
          <Route path="/reviews/:id/edit" element={<ReviewForm />} />
          <Route path="*" element={<Typography.Text>ページが見つかりません</Typography.Text>} />
        </Routes>
      </Layout.Content>
    </Layout>
  )
}
