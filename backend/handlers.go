package main

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode/utf8"
)

type Server struct {
	store *Store
	auth  *Auth
}

func (s *Server) routes(mux *http.ServeMux) {
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) { w.Write([]byte("ok")) })

	mux.HandleFunc("POST /api/login", s.login)
	mux.HandleFunc("GET /api/me", s.me)

	mux.HandleFunc("GET /api/reviews", s.listReviews)
	mux.HandleFunc("GET /api/reviews/{id}", s.getReview)
	mux.HandleFunc("POST /api/reviews", s.requireAdmin(s.createReview))
	mux.HandleFunc("PUT /api/reviews/{id}", s.requireAdmin(s.updateReview))
	mux.HandleFunc("DELETE /api/reviews/{id}", s.requireAdmin(s.deleteReview))

	mux.HandleFunc("/api/", func(w http.ResponseWriter, r *http.Request) {
		writeError(w, http.StatusNotFound, "not found")
	})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

func (s *Server) internalError(w http.ResponseWriter, err error) {
	log.Printf("internal error: %v", err)
	writeError(w, http.StatusInternalServerError, "internal server error")
}

func (s *Server) isAdmin(r *http.Request) bool {
	token, ok := strings.CutPrefix(r.Header.Get("Authorization"), "Bearer ")
	return ok && s.auth.VerifyToken(token)
}

func (s *Server) requireAdmin(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !s.isAdmin(r) {
			writeError(w, http.StatusUnauthorized, "ログインが必要です")
			return
		}
		next(w, r)
	}
}

func (s *Server) login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return
	}
	if !s.auth.CheckPassword(req.Password) {
		time.Sleep(500 * time.Millisecond) // slow down brute force attempts
		writeError(w, http.StatusUnauthorized, "パスワードが違います")
		return
	}
	writeJSON(w, http.StatusOK, map[string]string{"token": s.auth.IssueToken()})
}

func (s *Server) me(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]bool{"admin": s.isAdmin(r)})
}

func pathID(w http.ResponseWriter, r *http.Request) (int64, bool) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		writeError(w, http.StatusNotFound, "not found")
		return 0, false
	}
	return id, true
}

func decodeInput(w http.ResponseWriter, r *http.Request) (ReviewInput, bool) {
	var in ReviewInput
	if err := json.NewDecoder(r.Body).Decode(&in); err != nil {
		writeError(w, http.StatusBadRequest, "invalid request body")
		return in, false
	}
	in.Title = strings.TrimSpace(in.Title)
	var msg string
	switch {
	case in.Title == "":
		msg = "タイトルは必須です"
	case utf8.RuneCountInString(in.Title) > 200:
		msg = "タイトルは200文字以内で入力してください"
	case in.Rating < 0.5 || in.Rating > 5 || in.Rating*2 != float64(int(in.Rating*2)):
		msg = "評価は0.5〜5の0.5刻みで入力してください"
	case utf8.RuneCountInString(in.Body) > 20000:
		msg = "本文は20000文字以内で入力してください"
	}
	if msg == "" {
		if _, err := time.Parse(time.DateOnly, in.WatchedOn); err != nil {
			msg = "鑑賞日はYYYY-MM-DD形式で入力してください"
		}
	}
	if msg != "" {
		writeError(w, http.StatusBadRequest, msg)
		return in, false
	}
	return in, true
}

func (s *Server) listReviews(w http.ResponseWriter, r *http.Request) {
	reviews, err := s.store.List(r.Context(), strings.TrimSpace(r.URL.Query().Get("q")))
	if err != nil {
		s.internalError(w, err)
		return
	}
	writeJSON(w, http.StatusOK, reviews)
}

func (s *Server) getReview(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	review, err := s.store.Get(r.Context(), id)
	s.respondReview(w, http.StatusOK, review, err)
}

func (s *Server) createReview(w http.ResponseWriter, r *http.Request) {
	in, ok := decodeInput(w, r)
	if !ok {
		return
	}
	review, err := s.store.Create(r.Context(), in)
	s.respondReview(w, http.StatusCreated, review, err)
}

func (s *Server) updateReview(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	in, ok := decodeInput(w, r)
	if !ok {
		return
	}
	review, err := s.store.Update(r.Context(), id, in)
	s.respondReview(w, http.StatusOK, review, err)
}

func (s *Server) deleteReview(w http.ResponseWriter, r *http.Request) {
	id, ok := pathID(w, r)
	if !ok {
		return
	}
	if err := s.store.Delete(r.Context(), id); err != nil {
		s.respondReview(w, 0, Review{}, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (s *Server) respondReview(w http.ResponseWriter, status int, review Review, err error) {
	switch {
	case errors.Is(err, errNotFound):
		writeError(w, http.StatusNotFound, "レビューが見つかりません")
	case err != nil:
		s.internalError(w, err)
	default:
		writeJSON(w, status, review)
	}
}
