import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Alert, App, Button, Card, Flex, Popconfirm, Rate, Spin, Typography } from 'antd'
import dayjs from 'dayjs'
import { api, type Review } from '../api'
import { useAuth } from '../auth'

export default function ReviewDetail() {
  const id = Number(useParams().id)
  const navigate = useNavigate()
  const { admin } = useAuth()
  const { message } = App.useApp()
  const [review, setReview] = useState<Review | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .getReview(id)
      .then(setReview)
      .catch((e: Error) => setError(e.message))
  }, [id])

  const handleDelete = async () => {
    try {
      await api.deleteReview(id)
      message.success('削除しました')
      navigate('/')
    } catch (e) {
      message.error((e as Error).message)
    }
  }

  if (error) return <Alert type="error" title={error} />
  if (!review) return <Spin />

  return (
    <Card
      title={review.title}
      extra={
        admin && (
          <Flex gap={8}>
            <Button onClick={() => navigate(`/reviews/${id}/edit`)}>編集</Button>
            <Popconfirm title="このレビューを削除しますか？" onConfirm={handleDelete} okText="削除" cancelText="キャンセル">
              <Button danger>削除</Button>
            </Popconfirm>
          </Flex>
        )
      }
    >
      <Flex vertical gap={8}>
        <Flex align="center" gap={8}>
          <Rate disabled allowHalf value={review.rating} />
          <Typography.Text strong>{review.rating.toFixed(1)}</Typography.Text>
        </Flex>
        <Typography.Text type="secondary">{review.watchedOn} 鑑賞</Typography.Text>
        <Typography.Paragraph style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>{review.body}</Typography.Paragraph>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          投稿: {dayjs(review.createdAt).format('YYYY-MM-DD HH:mm')}
          {review.updatedAt !== review.createdAt && ` / 更新: ${dayjs(review.updatedAt).format('YYYY-MM-DD HH:mm')}`}
        </Typography.Text>
      </Flex>
    </Card>
  )
}
