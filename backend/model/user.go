package model

import "time"

type User struct {
	ID uint `gorm:"primarykey"`
	Username string `gorm:"size:50;unique"`
	Password string `gorm:"size:255"`
	Avatar string
	RegisterIP string `gorm:"size:100"`
	CreatedAt time.Time
}