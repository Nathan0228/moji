package model

import "time"

type Work struct {

	ID uint `gorm:"primaryKey"`

	UserID uint

	Title string `gorm:"size:100"`

	ImageURL string

	StyleType string `gorm:"size:50"`

	Content string `gorm:"type:text"`

	CreatedAt time.Time
}