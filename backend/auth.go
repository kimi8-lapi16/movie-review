package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"strconv"
	"strings"
	"time"
)

const tokenTTL = 30 * 24 * time.Hour

// Auth issues and verifies stateless admin tokens of the form "<expiry-unix>.<hmac>".
type Auth struct {
	password string
	secret   []byte
}

func (a *Auth) CheckPassword(pw string) bool {
	return subtle.ConstantTimeCompare([]byte(pw), []byte(a.password)) == 1
}

func (a *Auth) sign(payload string) string {
	mac := hmac.New(sha256.New, a.secret)
	mac.Write([]byte(payload))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}

func (a *Auth) IssueToken() string {
	exp := strconv.FormatInt(time.Now().Add(tokenTTL).Unix(), 10)
	return exp + "." + a.sign(exp)
}

func (a *Auth) VerifyToken(token string) bool {
	exp, sig, ok := strings.Cut(token, ".")
	if !ok || !hmac.Equal([]byte(sig), []byte(a.sign(exp))) {
		return false
	}
	unix, err := strconv.ParseInt(exp, 10, 64)
	return err == nil && time.Now().Unix() < unix
}
