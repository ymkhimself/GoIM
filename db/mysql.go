package db

import (
	"GoIM/model"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB
func init() {
	dsn:="root:Ymk0910!@tcp(127.0.0.1:3306)/goim?charset=utf8mb4&parseTime=True&loc=Local"
	var err error
	DB,err = gorm.Open(mysql.Open(dsn),&gorm.Config{})
	if err != nil {
		panic(err.Error())
	}
	DB.AutoMigrate(&model.User{})
	DB.AutoMigrate(&model.Contact{})
	DB.AutoMigrate(&model.Community{})
}
