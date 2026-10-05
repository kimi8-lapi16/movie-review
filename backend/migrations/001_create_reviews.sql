CREATE TABLE reviews (
    id          BIGSERIAL PRIMARY KEY,
    title       TEXT          NOT NULL,
    watched_on  DATE          NOT NULL,
    rating      NUMERIC(2, 1) NOT NULL CHECK (rating >= 0.5 AND rating <= 5),
    body        TEXT          NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX reviews_watched_on_idx ON reviews (watched_on DESC, id DESC);
