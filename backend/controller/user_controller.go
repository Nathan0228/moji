package controller

import (
	"fmt"
	"net/http"
	"os"
	"time"

	"moji/config"
	"moji/model"
	"moji/utils"

	"path/filepath"

	"github.com/google/uuid"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
	"github.com/gin-gonic/gin"
)

// 注册请求
type RegisterRequest struct {
	Username string `json:"username"`

	Password string `json:"password"`
}

// 用户注册
func Register(c *gin.Context) {

	var req RegisterRequest

	// 解析 JSON
	if err := c.ShouldBindJSON(&req); err != nil {

		c.JSON(http.StatusBadRequest, gin.H{
			"message": "参数错误",
		})

		return
	}

	// 基础校验
	if len(req.Username) < 3 ||
		len(req.Password) < 8 {

		c.JSON(http.StatusBadRequest, gin.H{
			"message": "用户名至少3位，密码至少8位",
		})

		return
	}

	// 获取 IP
	ip := c.ClientIP()

	// 查询24小时内是否注册过
	var recentUser model.User

	oneHourAgo := time.Now().Add(-24 * time.Hour)

	config.DB.Where(
		"register_ip = ? AND created_at > ?",
		ip,
		oneHourAgo,
	).First(&recentUser)

	// 存在则限制注册
	if recentUser.ID != 0 {

		c.JSON(http.StatusTooManyRequests, gin.H{
			"message": "注册过于频繁，请24小时后再试",
		})

		return
	}

	// 判断用户名是否存在
	var user model.User

	config.DB.Where(
		"username = ?",
		req.Username,
	).First(&user)

	if user.ID != 0 {

		c.JSON(http.StatusBadRequest, gin.H{
			"message": "用户名已存在",
		})

		return
	}

	// 密码加密
	hashPassword, err :=
		utils.HashPassword(req.Password)

	if err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "密码加密失败",
		})

		return
	}

	// 创建用户
	newUser := model.User{

		Username: req.Username,

		Password: hashPassword,

		RegisterIP: ip,
	}

	// 保存数据库
	if err := config.DB.Create(&newUser).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "注册失败",
		})

		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "注册成功",
	})
}

// 用户登录
func Login(c *gin.Context) {

	var req RegisterRequest

	// 解析参数
	if err := c.ShouldBindJSON(&req); err != nil {

		c.JSON(http.StatusBadRequest, gin.H{
			"message": "参数错误",
		})

		return
	}

	// 查询用户
	var user model.User

	config.DB.Where(
		"username = ?",
		req.Username,
	).First(&user)

	// 用户不存在
	if user.ID == 0 {

		c.JSON(http.StatusBadRequest, gin.H{
			"message": "用户不存在",
		})

		return
	}

	// 校验密码
	if !utils.CheckPassword(
		req.Password,
		user.Password,
	) {

		c.JSON(http.StatusBadRequest, gin.H{
			"message": "密码错误",
		})

		return
	}

	// 生成 Token
	token, err := utils.GenerateToken(
		user.ID,
		user.Username,
	)

	if err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "Token生成失败",
		})

		return
	}

	c.JSON(http.StatusOK, gin.H{

		"message": "登录成功",

		"token": token,

		"user": gin.H{

			"id": user.ID,

			"username": user.Username,
		},
	})
}

// 获取用户信息
func GetUserInfo(c *gin.Context) {

	userID := c.MustGet("userID").(uint)

	var user model.User

	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "用户不存在",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "获取成功",
		"data": gin.H{
			"id":         user.ID,
			"username":   user.Username,
			"avatar":     user.Avatar,
			"created_at": user.CreatedAt.Format("2006-01-02 15:04:05"),
		},
	})
}

// 上传头像接口
func UploadAvatar(c *gin.Context) {

	userID := c.MustGet("userID").(uint)

	file, err := c.FormFile("avatar")
	if err != nil {
		c.JSON(400, gin.H{"message": "头像不能为空"})
		return
	}

	// ===== OSS配置 =====
	endpoint := os.Getenv("OSS_ENDPOINT")
	accessKey := os.Getenv("OSS_ACCESS_KEY_ID")
	secret := os.Getenv("OSS_ACCESS_KEY_SECRET")
	bucketName := os.Getenv("OSS_BUCKET")
	baseURL := os.Getenv("OSS_BASE_URL")

	client, err := oss.New(endpoint, accessKey, secret)
	if err != nil {
		c.JSON(500, gin.H{"message": "OSS连接失败"})
		return
	}

	bucket, err := client.Bucket(bucketName)
	if err != nil {
		c.JSON(500, gin.H{"message": "Bucket获取失败"})
		return
	}

	// ================================
	// 1️⃣ 查询旧头像
	// ================================
	var user model.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		c.JSON(500, gin.H{"message": "用户不存在"})
		return
	}

	oldAvatar := user.Avatar

	// ================================
	// 2️⃣ 上传新头像
	// ================================
	src, err := file.Open()
	if err != nil {
		c.JSON(500, gin.H{"message": "文件读取失败"})
		return
	}
	defer src.Close()

	ext := filepath.Ext(file.Filename)

	newKey := fmt.Sprintf("avatar/user_%d_%s%s",
		userID,
		uuid.New().String(),
		ext,
	)

	err = bucket.PutObject(newKey, src)
	if err != nil {
		c.JSON(500, gin.H{"message": "上传失败"})
		return
	}

	newURL := fmt.Sprintf("%s/%s", baseURL, newKey)

	// ================================
	// 3️⃣ 删除旧头像（核心）
	// ================================
	if oldAvatar != "" {

		oldKey := extractOSSKey(oldAvatar, baseURL)

		if oldKey != "" {
			_ = bucket.DeleteObject(oldKey) // 删除失败不影响主流程
		}
	}

	// ================================
	// 4️⃣ 更新数据库
	// ================================
	config.DB.Model(&model.User{}).
		Where("id = ?", userID).
		Update("avatar", newURL)

	c.JSON(200, gin.H{
		"message": "上传成功",
		"url":     newURL,
	})
}

func extractOSSKey(fullURL string, baseURL string) string {

	if fullURL == "" {
		return ""
	}

	// 去掉域名部分
	if len(fullURL) <= len(baseURL) {
		return ""
	}

	return fullURL[len(baseURL)+1:]
}
