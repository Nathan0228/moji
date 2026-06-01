package main

import (
	"log"
	"moji/config"
	"moji/model"
	"moji/router"
	"time"

	"github.com/joho/godotenv"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {

	err := godotenv.Load()
	if err != nil {
		log.Println("加载 .env 文件失败，使用环境变量中的配置")
	}

	// 初始化数据库
	config.InitMySQL()

	// 自动迁移数据库
	config.DB.AutoMigrate(
		&model.User{},
		&model.Work{},
	)

	//创建Gin实例
	r := gin.Default()

	//配置CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins: []string{
			"http://127.0.0.1:5500",
			"http://localhost:5500",
		},

		AllowMethods: []string{
			"GET",
			"POST",
			"PUT",
			"DELETE",
			"OPTIONS",
		},

		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Authorization",
		},

		ExposeHeaders: []string{
			"Content-Length",
		},

		AllowCredentials: true,

		MaxAge: 12 * time.Hour,
	}))

	//静态文件
	r.Static(
		"/uploads",
		"./uploads",
	)

	//注册路由
	//router.RegisterRoutes(r)
	router.SetupRouter(r)

	//启动服务器
	r.Run(":8080")
}
