package router

import (
	"moji/controller"
	"moji/middleware"
	"net/http"

	"github.com/gin-gonic/gin"
)

func SetupRouter(r *gin.Engine) {

	//测试接口
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"message": "墨迹后端启动成功!",
		})

	})

	//用户接口
	api := r.Group("/api")
	{
		//注册接口
		api.POST("/register", controller.Register)

		//登录接口
		api.POST("/login", controller.Login)

		//获取作品接口
		api.GET(
			"/work",
			controller.GetWorks,
		)

		//获取作品详情
		api.GET(
			"/work/:id",
			controller.GetWorkDetail,
		)
	}

	//需要登录
	auth := api.Group("/")
	auth.Use(middleware.JWTAuth())
	{
		//上传作品接口
		auth.POST(
			"work/upload",
			controller.UploadWork,
		)
		//上传图片
		auth.POST(
			"upload/image",
			controller.UploadImage,
		)
		//获取用户信息
		auth.GET(
			"user/info",
			controller.GetUserInfo,
		)

		// 获取登录用户作品列表
		auth.GET(
			"work/my",
			controller.GetUserWorks,
		)

		//用户上传头像
		auth.POST(
			"/user/avatar",
			controller.UploadAvatar,
		)
	}
}
