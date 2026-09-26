import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { App, Button, Card, DatePicker, Form, Input, Rate, Spin } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { api } from '../api'
import { useAuth } from '../auth'

type FormValues = {
  title: string
  watchedOn: Dayjs
  rating: number
  body?: string
}

export default function ReviewForm() {
  const params = useParams()
  const id = params.id ? Number(params.id) : null
  const navigate = useNavigate()
  const { admin } = useAuth()
  const { message } = App.useApp()
  const [form] = Form.useForm<FormValues>()
  const [loading, setLoading] = useState(id !== null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (id === null) return
    api
      .getReview(id)
      .then((r) => form.setFieldsValue({ ...r, watchedOn: dayjs(r.watchedOn) }))
      .catch((e: Error) => message.error(e.message))
      .finally(() => setLoading(false))
  }, [id, form, message])

  if (!admin) return <Navigate to="/login" replace />
  if (loading) return <Spin />

  const onFinish = async (values: FormValues) => {
    const input = {
      title: values.title,
      watchedOn: values.watchedOn.format('YYYY-MM-DD'),
      rating: values.rating,
      body: values.body ?? '',
    }
    setSubmitting(true)
    try {
      const saved = id === null ? await api.createReview(input) : await api.updateReview(id, input)
      message.success('保存しました')
      navigate(`/reviews/${saved.id}`)
    } catch (e) {
      message.error((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card title={id === null ? 'レビューを書く' : 'レビューを編集'}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ watchedOn: dayjs(), rating: 3 }}
      >
        <Form.Item label="タイトル" name="title" rules={[{ required: true, whitespace: true, max: 200 }]}>
          <Input />
        </Form.Item>
        <Form.Item label="鑑賞日" name="watchedOn" rules={[{ required: true }]}>
          <DatePicker />
        </Form.Item>
        <Form.Item label="評価" name="rating" rules={[{ required: true, type: 'number', min: 0.5 }]}>
          <Rate allowHalf />
        </Form.Item>
        <Form.Item label="感想" name="body" rules={[{ max: 20000 }]}>
          <Input.TextArea autoSize={{ minRows: 6 }} />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={submitting}>
          保存
        </Button>
      </Form>
    </Card>
  )
}
