import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Card, Empty, Flex, Input, Rate, Spin, Typography } from 'antd'
import { api, type Review } from '../api'

export default function ReviewList() {
  const [query, setQuery] = useState('')
  const [reviews, setReviews] = useState<Review[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .listReviews(query)
      .then((data) => {
        setReviews(data)
        setError(null)
      })
      .catch((e: Error) => setError(e.message))
  }, [query])

  return (
    <Flex vertical gap={16}>
      <Input.Search placeholder="タイトル・本文で検索" allowClear enterButton onSearch={setQuery} />
      {error && <Alert type="error" title={error} />}
      {reviews === null && !error ? (
        <Spin />
      ) : reviews?.length === 0 ? (
        <Empty description="レビューがありません" />
      ) : (
        reviews?.map((r) => (
          <Link key={r.id} to={`/reviews/${r.id}`}>
            <Card hoverable size="small">
              <Flex justify="space-between" align="center" wrap gap={8}>
                <Typography.Title level={5} style={{ margin: 0 }}>
                  {r.title}
                </Typography.Title>
                <Rate disabled allowHalf value={r.rating} />
              </Flex>
              <Typography.Text type="secondary">{r.watchedOn} 鑑賞</Typography.Text>
              {r.body && (
                <Typography.Paragraph ellipsis={{ rows: 2 }} style={{ margin: '8px 0 0' }}>
                  {r.body}
                </Typography.Paragraph>
              )}
            </Card>
          </Link>
        ))
      )}
    </Flex>
  )
}
