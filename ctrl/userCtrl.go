package ctrl

import (
	"GoIM/db"
	"GoIM/model"
	"GoIM/util"
	"fmt"
	"github.com/gin-gonic/gin"
	"log"
	"math/rand"
	"time"
)

type LoginForm struct {
	Mobile string    `json:"mobile"`
	Pwd    string `json:"pwd"`
}

func Login(c *gin.Context) {
	var form LoginForm
	c.Bind(&form)

	var user model.User
	db.DB.Where("mobile = ?", form.Mobile).First(&user)
	if user.ID == 0 {
		util.RespFail(c, "手机号未注册")
		return
	}
	if !util.MD5Cmp(form.Pwd, user.Pwd, user.Salt) {
		util.RespFail(c, "密码错误")
		return
	}
	token := util.MD5EnCode(fmt.Sprintf("%d", time.Now().Unix()))
	user.Token = token
	db.DB.Model(&user).Update("token", token)
	util.RespSuccess(c, "", user)
}

type RegisterFrom struct {
	Mobile string `json:"mobile"`
	Pwd    string `json:"pwd"`
	Memo   string `json:"memo"`
	Avatar string `json:"avatar"`
	Sex    string `json:"sex"`
	Nickname string `json:"nickname"`
}

func Register(c *gin.Context) {
	var form RegisterFrom
	c.Bind(&form)

	var user model.User
	db.DB.Where("mobile = ?", form.Mobile).First(&user)
	if user.ID != 0 {
		util.RespFail(c, "该手机号已注册")
		return
	}
	user.Mobile = form.Mobile
	user.Avatar = form.Avatar
	user.Nickname = form.Nickname
	user.Salt = fmt.Sprintf("%06d", rand.Int31n(10000))
	user.Pwd = util.MD5EnCry(form.Pwd, user.Salt)
	user.CreatedAt = time.Now()
	user.Token  = fmt.Sprintf("%08d",rand.Int31())
	db.DB.Create(&user)
	util.RespSuccess(c,"注册成功",nil)
}

func Find(c *gin.Context) {
	id := c.Param("id")
	var user model.User
	if err := db.DB.Where("id = ?",id).First(&user).Error; err != nil {
		log.Println(err.Error())
		util.RespFail(c,"查询用户信息失败")
		return
	}
	util.RespSuccess(c,"",user)
}