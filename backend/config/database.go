package config

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

// InitMySQL 初始化 MySQL 连接，配置从环境变量读取
func InitMySQL() {
	// 从环境变量读取，留有默认值以便开发环境使用
	username := getEnv("MYSQL_USER", "root")
	password := getEnv("MYSQL_PASSWORD", "361121")
	host := getEnv("MYSQL_HOST", "127.0.0.1")
	port := getEnv("MYSQL_PORT", "3306")
	database := getEnv("MYSQL_DATABASE", "moji")

	dsn := fmt.Sprintf(
		"%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		username,
		password,
		host,
		port,
		database,
	)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})

	if err != nil {
		log.Fatalf("连接数据库失败: %v", err)
	}

	DB = db

	fmt.Println("数据库连接成功!")
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
