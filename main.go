package main

import "GoIM/router"

func main() {
	r := router.InitRouter()
	r.Run(":8081")
}
