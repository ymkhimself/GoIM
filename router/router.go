package router

import (
	"GoIM/ctrl"
	"github.com/gin-gonic/gin"
	"net/http"
)

func InitRouter()*gin.Engine {
	r := gin.Default()

	r.LoadHTMLFiles("asset/html/login.html")
	r.Static("/asset","asset")

	r.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK,"login.html",nil)
	})

	//用户相关
	r.POST("/user/login",ctrl.Login)
	r.POST("/user/register",ctrl.Register)
	r.GET("/user/:id",ctrl.Find)

	//聊天相关
	r.GET("/chat",ctrl.Chat)

	//关系相关
	r.GET("/contact/loadfriend/:id",ctrl.LoadFriend)
	r.GET("/contact/loadcommunity/:id",ctrl.LoadCommunity)
	r.POST("/contact/createcommunity",ctrl.CreateCommunity)
	r.POST("/contact/joincommunity",ctrl.JoinCommunity)
	r.POST("/contact/addfriend",ctrl.AddFriend)


	r.POST("/attach/upload",ctrl.Upload)
	return r
}
