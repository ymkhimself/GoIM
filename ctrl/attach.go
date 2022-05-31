package ctrl

import (
	"GoIM/util"
	"fmt"
	"github.com/gin-gonic/gin"
	"log"
	"math/rand"
	"time"
)

func Upload(c *gin.Context) {
	filetype := c.PostForm("filetype")
	file,err := c.FormFile("file")
	if err != nil {
		log.Println(err.Error())
		util.RespFail(c,"上传失败")
		return
	}
	filename:= fmt.Sprintf("%d%d%s",time.Now().Unix(),rand.Intn(100),filetype)
	err = c.SaveUploadedFile(file,"/asset/mnt/"+filename)
	if err != nil {
		util.RespFail(c,"上传失败")
		return
	}
	util.RespSuccess(c,"","/asset/mnt/"+filename)
}
