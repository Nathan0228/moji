package middleware

import (
	"net/http"
	"strings"

	"moji/utils"

	"github.com/gin-gonic/gin"
)

func JWTAuth() gin.HandlerFunc {

	return func(c *gin.Context) {

		// 获取 Authorization
		authHeader :=
			c.GetHeader("Authorization")

		if authHeader == "" {

			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "未登录",
			})

			c.Abort()

			return
		}

		// Bearer token
		tokenString :=
			strings.Replace(
				authHeader,
				"Bearer ",
				"",
				1,
			)

		// 解析 Token
		claims, err :=
			utils.ParseToken(tokenString)

		if err != nil {

			c.JSON(http.StatusUnauthorized, gin.H{
				"message": "Token无效",
			})

			c.Abort()

			return
		}

		// 保存用户信息
		c.Set("userID", claims.UserID)

		c.Set("username", claims.Username)

		c.Next()
	}
}