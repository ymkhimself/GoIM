package model

import "time"

type Contact struct {
	ID       int       `json:"id"`
	OwnerId  int       `json:"ownerId"`
	DstId    int       `json:"dstId"`
	Cate     int       `json:"cate"` //1代表人与人 2代表人与群
	Memo     string    `json:"memo" gorm:"type:varchar(40)"`
	CreateAt time.Time `json:"createAt"`
}
