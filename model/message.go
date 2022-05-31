package model

const (
	CMD_SINGLE_MSG = 10
	CMD_ROOM_MSG   = 11
	CMD_HEART      = 0
)

type Message struct {
	ID      int    `json:"id"`
	UserId  int    `json:"userId"` //谁发的
	Cmd     int    `json:"cmd"`    //群聊还是私聊
	DstId   int    `json:"dstId"`  //对方id
	Media   int    `json:"media"`  //媒体类型
	Content string `json:"content"`
	Url     string `json:"url"`
	Memo    string `json:"memo"`
	Amount  int    `json:"amount"`
}
