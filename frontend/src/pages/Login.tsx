import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { App, Button, Card, Form, Input } from 'antd'
import { useAuth } from '../auth'

export default function Login() {
  const { admin, login } = useAuth()
  const { message } = App.useApp()
  const [submitting, setSubmitting] = useState(false)

  if (admin) return <Navigate to="/" replace />

  const onFinish = async ({ password }: { password: string }) => {
    setSubmitting(true)
    try {
      await login(password)
      message.success('ログインしました')
    } catch (e) {
      message.error((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card title="ログイン" style={{ maxWidth: 400, margin: '0 auto' }}>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item label="パスワード" name="password" rules={[{ required: true }]}>
          <Input.Password autoFocus />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={submitting} block>
          ログイン
        </Button>
      </Form>
    </Card>
  )
}
