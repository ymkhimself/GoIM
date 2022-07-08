package model

import "time"

type Community struct {
	ID        int       `json:"id"`
	Name      string    `json:"name" gorm:"type:varchar(20)"`
	OwnerId   int       `json:"ownerId"`
	Icon      string    `json:"icon" gorm:"type:varchar(250)"`
	Memo      string    `json:"memo" gorm:"type:varchar(150)"`
	CreatedAt time.Time `json:"createdAt"`
}