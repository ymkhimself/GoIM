package util

import "github.com/gin-gonic/gin"

func RespSuccess(c *gin.Context,msg string,data interface{}){
	c.JSON(200,gin.H{
		"code":0,
		"msg":msg,
		"data":data,
	})
}

func RespFail(c *gin.Context,msg string){
	c.JSON(200,gin.H{
		"code":-1,
		"msg":msg,
	})
}
