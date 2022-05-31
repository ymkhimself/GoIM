package ctrl

import (
	"GoIM/asset/db"
	"GoIM/model"
	"GoIM/util"
	"encoding/json"
	"github.com/fatih/set"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"log"
	"net/http"
	"strconv"
	"sync"
)

type Node struct {
	Conn      *websocket.Conn
	DataQueue chan []byte
	GroupSets set.Interface
}

var clientMap map[int]*Node = make(map[int]*Node, 0)
var mutex sync.RWMutex

func Chat(c *gin.Context) {
	var user model.User
	id, _ := strconv.Atoi(c.Query("id"))
	token := c.Query("token")

	db.DB.Where("id = ?", id).First(&user)
	isValida := token == user.Token

	conn, err := (&websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return isValida
		},
	}).Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println(err.Error())
		util.RespFail(c, "建立连接失败")
		return
	}
	node := &Node{
		Conn:      conn,
		DataQueue: make(chan []byte, 50),
		GroupSets: set.New(set.ThreadSafe),
	}

	//获取全部群的id
	comIds := make([]int,0)
	if err :=db.DB.Select("dist_id").Where("owner_id = ? ADN cate = 1",id).Error;err != nil {
		util.RespFail(c,"加载失败")
		return
	}
	for _,v :=range comIds {
		node.GroupSets.Add(v)
	}
	mutex.Lock()
	clientMap[id] = node
	mutex.Unlock()
	go sendproc(node)
	go recvproc(node)
}

func sendproc(node *Node) {
	for {
		select {
		case data := <-node.DataQueue:
			err := node.Conn.WriteMessage(websocket.TextMessage, data)
			if err != nil {
				log.Println(err.Error())
				return
			}
		}
	}
}

func recvproc(node *Node) {
	for {
		_, data, err := node.Conn.ReadMessage()
		if err != nil {
			log.Println(err.Error())
			return
		}
		dispatch(data)
	}
}

func AddCommunityId(userId, comId int) {
	mutex.RLock()
	node,ok := clientMap[userId]
	if ok {
		node.GroupSets.Add(comId)
	}
	mutex.Unlock()
}

func sendMsg(dstId int, msg []byte) {
	mutex.RLock()
	node, ok := clientMap[dstId]
	mutex.Unlock()
	if ok {
		node.DataQueue <- msg
	}
}

func dispatch(data []byte) {
	msg := model.Message{}
	err := json.Unmarshal(data, &msg)
	if err != nil {
		log.Println(err.Error())
		return
	}
	switch msg.Cmd {
	case model.CMD_SINGLE_MSG:
		sendMsg(msg.DstId, data)
	case model.CMD_ROOM_MSG:
		mutex.Lock()
		for _, v := range clientMap {
			v.DataQueue <- data
		}
		mutex.Unlock()
	case model.CMD_HEART:
		//啥也不做
	}
}
