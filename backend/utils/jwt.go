package utils

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// jwtKey 从环境变量读取，若未设置使用默认值（仅用于开发）
var jwtKey = []byte(getEnv("JWT_SECRET", "moji_secret_key"))

// 自定义 Claims
type Claims struct {
	UserID uint `json:"user_id"`

	Username string `json:"username"`

	jwt.RegisteredClaims
}

// 生成 Token
func GenerateToken(
	userID uint,
	username string,
) (string, error) {

	expirationTime :=
		time.Now().Add(7 * 24 * time.Hour)

	claims := &Claims{

		UserID: userID,

		Username: username,

		RegisteredClaims: jwt.RegisteredClaims{

			ExpiresAt: jwt.NewNumericDate(expirationTime),

			IssuedAt: jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(
		jwt.SigningMethodHS256,
		claims,
	)

	return token.SignedString(jwtKey)
}

// 解析 Token
func ParseToken(tokenString string) (*Claims, error) {

	token, err := jwt.ParseWithClaims(

		tokenString,

		&Claims{},

		func(token *jwt.Token) (interface{}, error) {

			return jwtKey, nil
		},
	)

	if err != nil {

		return nil, err
	}

	claims, ok :=
		token.Claims.(*Claims)

	if !ok || !token.Valid {

		return nil, err
	}

	return claims, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
