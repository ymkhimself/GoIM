package ctrl

import (
	"GoIM/asset/db"
	"GoIM/model"
	"GoIM/util"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"strconv"
	"time"
)

func LoadFriend(c *gin.Context) {
	id := c.Param("id")
	friends := make([]model.User, 0)
	if err := db.DB.Model(&model.User{}).
		Joins("left join contacts on contacts.owner_id = ? AND contacts.cate = ? AND users.id = contacts.owner_id", id, 1).
		Scan(&friends).Error; err != nil {
		util.RespFail(c, "加载失败")
		return
	}
	util.RespSuccess(c, "", friends)
}

func LoadCommunity(c *gin.Context) {
	id := c.Param("id")
	communitys := make([]model.Community, 0)
	if err := db.DB.Model(&model.Community{}).
		Joins("left join contacts on contacts.owner_id = ? AND contacts.cate = ? AND communities.id = contacts.dst_id", id, 2).
		Scan(&communitys).Error; err != nil {
		util.RespFail(c, "加载失败")
		return
	}
	util.RespSuccess(c, "", communitys)
}

type AddFrom struct {
	OwnerId int `json:"ownerId"`
	DstId   int `json:"dstId"`
}

func AddFriend(c *gin.Context) {
	var form AddFrom
	c.Bind(&form)
	var contact model.Contact

	var user model.User
	db.DB.Where("id = ?", form.DstId).First(&user)
	if user.ID == 0 {
		util.RespFail(c, "账号不存在")
		return
	}

	db.DB.Where("owner_id = ? AND dst_id = ? AND cate = 1", form.OwnerId, form.DstId).First(&contact)
	if contact.ID != 0 {
		util.RespFail(c, "已添加过好友")
		return
	}

	contact.OwnerId = form.OwnerId
	contact.DstId = form.DstId
	contact.Cate = 1
	contact.CreateAt = time.Now()
	acontact := model.Contact{
		OwnerId:  form.DstId,
		DstId:    form.OwnerId,
		Cate:     1,
		CreateAt: time.Now(),
	}
	err := db.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&contact).Error; err != nil {
			return err
		}
		if err := tx.Create(&acontact).Error; err != nil {
			return err
		}
		return nil
	}).Error
	if err != nil {
		util.RespFail(c, "添加失败")
		return
	}
	util.RespSuccess(c, "", nil)
}

//加群
func JoinCommunity(c *gin.Context) {
	var form AddFrom
	c.Bind(&form)

	var community model.Community
	db.DB.Where("id = ?", form.DstId).First(&community)
	if community.ID == 0 {
		util.RespFail(c, "群聊不存在")
		return
	}

	var contact model.Contact
	db.DB.Where("owner_id = ? AND dst_id = ? AND cate = 2", form.OwnerId, form.DstId).First(&contact)
	if contact.ID != 0 {
		util.RespFail(c, "该群已加过")
		return
	}

	contact.OwnerId = form.OwnerId
	contact.DstId = form.DstId
	contact.Cate = 2
	contact.CreateAt = time.Now()
	err := db.DB.Create(&contact)
	if err != nil {
		util.RespFail(c, "添加失败")
		return
	}
	AddCommunityId(form.OwnerId, form.DstId)
	util.RespSuccess(c, "添加成功", nil)
}

func CreateCommunity(c *gin.Context) {
	name := c.PostForm("name")
	id := c.PostForm("id")
	var community model.Community

	community.Name = name
	community.OwnerId, _ = strconv.Atoi(id)
	community.CreatedAt = time.Now()
	db.DB.Create(&community)
	util.RespSuccess(c,"",community.ID)
}
