package controller

import (
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"moji/config"
	"moji/model"

	"path/filepath"

	"github.com/google/uuid"

	"github.com/aliyun/aliyun-oss-go-sdk/oss"
	"github.com/gin-gonic/gin"
)

// 上传作品请求
type UploadWorkRequest struct {
	Title string `json:"title"`

	ImageURL string `json:"image_url"`

	StyleType string `json:"style_type"`

	Content string `json:"content"`
}

// 上传作品
func UploadWork(c *gin.Context) {

	var req UploadWorkRequest

	// 解析参数
	if err := c.ShouldBindJSON(&req); err != nil {

		c.JSON(http.StatusBadRequest, gin.H{
			"message": "参数错误",
		})

		return
	}

	// 获取用户ID
	userID := c.MustGet("userID").(uint)

	// 创建作品
	work := model.Work{

		UserID: userID,

		Title: req.Title,

		ImageURL: req.ImageURL,

		StyleType: req.StyleType,

		Content: req.Content,
	}

	// 保存数据库
	if err := config.DB.Create(&work).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "作品发布失败",
		})

		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "作品发布成功",
	})
}

// 获取作品列表
func GetWorks(c *gin.Context) {

	var works []model.Work

	// 查询最新作品
	if err := config.DB.
		Order("created_at desc").
		Limit(20).
		Find(&works).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "获取作品失败",
		})

		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "获取成功",
		"data":    works,
	})
}

// 获取作品详情
func GetWorkDetail(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil || id <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"message": "作品 ID 不合法",
		})
		return
	}

	var work model.Work
	if err := config.DB.First(&work, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"message": "作品未找到",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "获取成功",
		"data":    work,
	})
}

// 获取当前用户作品列表
func GetUserWorks(c *gin.Context) {

	var works []model.Work

	userID := c.MustGet("userID").(uint)

	if err := config.DB.
		Where("user_id = ?", userID).
		Order("created_at desc").
		Find(&works).Error; err != nil {

		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "获取作品失败",
		})

		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "获取成功",
		"data":    works,
	})
}

// 上传图片
func UploadImage(c *gin.Context) {

	// 获取文件
	file, err := c.FormFile("image")

	ext := filepath.Ext(file.Filename)

	userID := c.MustGet("userID").(uint)

	if err != nil {

		c.JSON(http.StatusBadRequest, gin.H{
			"message": "图片不能为空",
		})

		return
	}
	//打开文件
	src, _ := file.Open()
	defer src.Close()

	// 阿里云 OSS 配置
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
		c.JSON(500, gin.H{"message": "Bucket错误"})
		return
	}

	//文件名
	filename := fmt.Sprintf(
		"works/user_%d_%d_%s%s",
		userID,
		time.Now().UnixNano(),
		uuid.New().String(),
		ext,
	)

	//上传
	err = bucket.PutObject(filename, src)
	if err != nil {
		c.JSON(500, gin.H{"message": "上传失败"})
		return
	}

	//返回公网URL
	url := fmt.Sprintf("%s/%s", baseURL, filename)

	c.JSON(200, gin.H{
		"message": "上传成功",
		"url":     url,
	})

	// // 生成文件名
	// filename :=
	// 	time.Now().Format(
	// 		"20060102150405",
	// 	) + "_" + file.Filename

	// // 保存路径
	// savePath :=
	// 	"./uploads/" + filename

	// // 保存文件
	// if err := c.SaveUploadedFile(
	// 	file,
	// 	savePath,
	// ); err != nil {

	// 	c.JSON(http.StatusInternalServerError, gin.H{
	// 		"message": "图片保存失败",
	// 	})

	// 	return
	// }

	// // 图片URL 使用 APP_BASE_URL 环境变量（仅用于构建对外访问的 URL）
	// base := os.Getenv("APP_BASE_URL")
	// if base == "" {
	// 	base = "http://localhost:8080"
	// }

	// imageURL := fmt.Sprintf("%s/uploads/%s", base, filename)

	// c.JSON(http.StatusOK, gin.H{

	// 	"message": "上传成功",

	// 	"url": imageURL,
	// })
}
