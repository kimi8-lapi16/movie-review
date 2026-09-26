package main

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

var errNotFound = errors.New("not found")

type Review struct {
	ID        int64     `json:"id"`
	Title     string    `json:"title"`
	WatchedOn string    `json:"watchedOn"` // YYYY-MM-DD
	Rating    float64   `json:"rating"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type ReviewInput struct {
	Title     string  `json:"title"`
	WatchedOn string  `json:"watchedOn"`
	Rating    float64 `json:"rating"`
	Body      string  `json:"body"`
}

type Store struct {
	pool *pgxpool.Pool
}

const reviewColumns = `id, title, to_char(watched_on, 'YYYY-MM-DD'), rating::float8, body, created_at, updated_at`

func scanReview(row pgx.Row) (Review, error) {
	var r Review
	err := row.Scan(&r.ID, &r.Title, &r.WatchedOn, &r.Rating, &r.Body, &r.CreatedAt, &r.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return r, errNotFound
	}
	return r, err
}

func (s *Store) List(ctx context.Context, q string) ([]Review, error) {
	rows, err := s.pool.Query(ctx, `SELECT `+reviewColumns+` FROM reviews
		WHERE $1 = '' OR title ILIKE '%' || $1 || '%' OR body ILIKE '%' || $1 || '%'
		ORDER BY watched_on DESC, id DESC`, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	reviews := []Review{}
	for rows.Next() {
		r, err := scanReview(rows)
		if err != nil {
			return nil, err
		}
		reviews = append(reviews, r)
	}
	return reviews, rows.Err()
}

func (s *Store) Get(ctx context.Context, id int64) (Review, error) {
	return scanReview(s.pool.QueryRow(ctx, `SELECT `+reviewColumns+` FROM reviews WHERE id = $1`, id))
}

func (s *Store) Create(ctx context.Context, in ReviewInput) (Review, error) {
	return scanReview(s.pool.QueryRow(ctx, `INSERT INTO reviews (title, watched_on, rating, body)
		VALUES ($1, $2, $3, $4) RETURNING `+reviewColumns,
		in.Title, in.WatchedOn, in.Rating, in.Body))
}

func (s *Store) Update(ctx context.Context, id int64, in ReviewInput) (Review, error) {
	return scanReview(s.pool.QueryRow(ctx, `UPDATE reviews
		SET title = $2, watched_on = $3, rating = $4, body = $5, updated_at = now()
		WHERE id = $1 RETURNING `+reviewColumns,
		id, in.Title, in.WatchedOn, in.Rating, in.Body))
}

func (s *Store) Delete(ctx context.Context, id int64) error {
	tag, err := s.pool.Exec(ctx, `DELETE FROM reviews WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return errNotFound
	}
	return nil
}
