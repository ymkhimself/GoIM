package model

import "time"

type User struct {
	ID        int       `json:"id"`
	Mobile    string    `json:"mobile" gorm:"type:varchar(20)"`
	Pwd       string    `json:"pwd" gorm:"type:varchar(40)"`
	Avatar    string    `json:"avatar" gorm:"type:varchar(250)"`
	Sex       string    `json:"sex" gorm:"type:varchar(2)"` //U代表不知道，M为男，W为女
	Nickname  string    `json:"nickname" gorm:"type:varchar(20)"`
	Salt      string    `json:"salt" gorm:"type:varchar(10)"`
	Token     string    `json:"token" gorm:"type:varchar(40)"`
	CreatedAt time.Time `json:"createdAt"`
}
