package main

import (
	"context"
	"crypto/sha256"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func main() {
	databaseURL := mustEnv("DATABASE_URL")
	password := mustEnv("ADMIN_PASSWORD")
	port := envOr("PORT", "8080")
	staticDir := envOr("STATIC_DIR", "../frontend/dist")

	// Tokens are signed with SESSION_SECRET; without it, derive a key from the
	// password so that changing the password invalidates existing sessions.
	secret := []byte(os.Getenv("SESSION_SECRET"))
	if len(secret) == 0 {
		sum := sha256.Sum256([]byte("movie-review:" + password))
		secret = sum[:]
	}

	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		log.Fatalf("connect database: %v", err)
	}
	defer pool.Close()
	if err := migrate(ctx, pool); err != nil {
		log.Fatalf("migrate: %v", err)
	}

	srv := &Server{store: &Store{pool: pool}, auth: &Auth{password: password, secret: secret}}
	mux := http.NewServeMux()
	srv.routes(mux)
	mux.Handle("/", spaHandler(staticDir))

	log.Printf("listening on :%s", port)
	log.Fatal(http.ListenAndServe(":"+port, mux))
}

// spaHandler serves files from dir, falling back to index.html so that
// client-side routes work on reload.
func spaHandler(dir string) http.Handler {
	fileServer := http.FileServer(http.Dir(dir))
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path := filepath.Join(dir, filepath.Clean("/"+r.URL.Path))
		if info, err := os.Stat(path); err != nil || info.IsDir() {
			w.Header().Set("Cache-Control", "no-cache")
			http.ServeFile(w, r, filepath.Join(dir, "index.html"))
			return
		}
		fileServer.ServeHTTP(w, r)
	})
}

func mustEnv(key string) string {
	v := os.Getenv(key)
	if v == "" {
		log.Fatalf("environment variable %s is required", key)
	}
	return v
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
