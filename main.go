package main

// pion
import (
	helper "gopherdrop/helper"
	server "gopherdrop/server"
	"log"
	"os"
)

func main() {
	sec := helper.GetConfigFromEnv()

	db, err := server.OpenDB(sec.DBPath)
	if err != nil {
		log.Printf("Failed to open the db: %v", err)
		return
	}
	err = server.MigrateDB(db)
	if err != nil {
		log.Printf("Failed to mirgrate the db: %v", err)
		return
	}

	port := os.Getenv("PORT")
	serverUrl := sec.Url

	if port != "" {
		serverUrl = ":" + port
	} else if serverUrl == "" {
		serverUrl = ":8080"
	}

	ser := server.InitServer(serverUrl, sec.Password)
	ser.DB = db

	server.StartJanitor(ser)
	ser.SetupAllEndPoint()

	ser.StartServer()
}
