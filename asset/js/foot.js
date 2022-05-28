function userInfo(o){
    if(typeof  o =="undefined"){
        var r = sessionStorage.getItem("userinfo");
        if(!!r){
            return JSON.parse(r);
        }else{
            return null
        }
    }else{
        sessionStorage.setItem("userinfo",JSON.stringify(o));
    }
}

function userId(id){
    if(typeof  id =="undefined"){
        var r = sessionStorage.getItem("userid");
        if(!r){
            return 0;
        }else{
            return parseInt(r)
        }
    }else{
        sessionStorage.setItem("userid",id);
    }
}

var url = location.href;
var isOpen = url.indexOf("/login")>-1 || url.indexOf("/register")>-1
if (!userId() && !isOpen){
    // location.href = "login.shtml";
}


function post(uri,data,fn){
    var xhr = new XMLHttpRequest();
    xhr.open("POST","//"+location.host+"/"+uri, true);
    // 添加http头，发送信息至服务器时内容编码类型
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 304)) {
            fn.call(this, JSON.parse(xhr.responseText));
        }
    };
    var _data=[];
    if(!! userId()){
        // data["userid"] = userId();
    }
    for(var i in data){
        _data.push( i +"=" + encodeURI(data[i]));
    }
    xhr.send(_data.join("&"));
}

function uploadblob(uri,blob,filetype,fn){
    var xhr = new XMLHttpRequest();
    xhr.open("POST","//"+location.host+"/"+uri, true);
    // 添加http头，发送信息至服务器时内容编码类型
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 304)) {
            fn.call(this, JSON.parse(xhr.responseText));
        }
    };
    var _data=[];
    var formdata = new FormData();
    formdata.append("filetype",filetype);
    if(!! userId()){
        formdata.append("userid",userId());
    }
    formdata.append("file",blob)
    xhr.send(formdata);
}
function uploadaudio(uri,blob,fn){
    uploadblob(uri,blob,".mp3",fn)
}
function uploadvideo(uri,blob,fn){
    uploadblob(uri,blob,".mp4",fn)
}

function upload(dom){

    var data = new FormData();
    data.append('file',dom.files[0])
    data.append('filetype','.jpg')
    axios.post("/upload",data).then(function (res){
        if(res.data.code !== 0) {
            mui.toast(res.data.msg)
        }else{
            app.sendpicmsg(res.data.data)
        }
    })

    uploadfile("attach/upload",dom,function(res){
        if(res.code==0){
            app.sendpicmsg(res.data)
        }

    })
}

function uploadfile(uri,dom,fn){
    var xhr = new XMLHttpRequest();
    xhr.open("POST","//"+location.host+"/"+uri, true);
    // 添加http头，发送信息至服务器时内容编码类型
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && (xhr.status == 200 || xhr.status == 304)) {
            fn.call(this, JSON.parse(xhr.responseText));
        }
    };
    var _data=[];
    var formdata = new FormData();
    if(!! userId()){
        formdata.append("userid",userId());
    }
    formdata.append("file",dom.files[0])
    xhr.send(formdata);
}


var app = new Vue(
    {
        el: "#pageapp",
        data: {
            usermap: {},
            friends: [],
            communitys: [],
            profile: {
                avatar: "",
                nickname: "",
                memo: "",
            },
            webSocket: {},
            win: "main",
            txtmsg: "",
            panelstat: "kbord",
            txtstat: "kbord",
            title: "",
            doutu: {
                config: {
                    "baseurl": "/asset/plugins/doutu/",
                    "pkgids": ["mkgif", "emoj"]
                },
                packages: [],
                choosed: {"pkgid": "emoj", "assets": [], "size": "small"}
            },
            msglist: [],

            msgcontext: {
                dstId: 10,
                cmd: 10,
                userId: userId()
            },
            plugins: [
                {
                    icon: "/asset/images/upload.png",
                    name: "照片",
                    id: "upload",
                    slot: "<input accept=\"image/gif,image/jpeg,,image/png\" type=\"file\" onchange=\"upload(this)\" class='upload' />"
                },

                {
                    icon: "/asset/images/camera.png",
                    name: "拍照",
                    id: "camera",
                    slot: "<input accept=\"image/*\" capture=\"camera\" type=\"file\" onchange=\"upload(this)\" class='upload' />"
                },
                {
                    icon: "/asset/images/audiocall.png",
                    name: "语音",
                    id: "audiocall"
                },
                {
                    icon: "/asset/images/videocall.png",
                    name: "视频",
                    id: "videocall"
                },
                {
                    icon: "/asset/images/redpackage.png",
                    name: "红包",
                    id: "redpackage"
                },
                {
                    icon: "/asset/images/exchange.png",
                    name: "转账",
                    id: "exchange"
                },
                {
                    icon: "/asset/images/address.png",
                    name: "地址",
                    id: "address"
                },
                {
                    icon: "/asset/images/person.png",
                    name: "名片",
                    id: "person"
                }

            ],
            timer: 0,
            recorder: {},
            allChunks: [],
            iscomplete: false,
            duration: 0,
            showprocess: false,
        },
        created: function () {
            this.loadfriends();
            this.loadcommunitys();
            this.loaddoutures();
            var user = userInfo()
            if (!!user) {
                this.profile.avatar = user.avatar;
                this.profile.nickname = user.nickname;
                this.profile.memo = user.memo;
            }

            this.initwebsocket()

        },
        mounted: function () {

        },
        methods: {
            playaudio: function (url) {
                document.getElementById('audio4play').src = url;
                document.getElementById('audio4play').play();
            },
            startrecorder: function () {
                let audioTarget = document.getElementById('audio');
                var types = ["video/webm",
                    "audio/webm",
                    "video/webm\;codecs=vp8",
                    "video/webm\;codecs=daala",
                    "video/webm\;codecs=h264",
                    "audio/webm\;codecs=opus",
                    "video/mpeg"];
                var suporttype = "";
                for (var i in types) {
                    if (MediaRecorder.isTypeSupported(types[i])) {
                        suporttype = types[i];
                    }
                }
                if (!suporttype) {
                    mui.toast("编码不支持")
                    return;
                }

                this.duration = new Date().getTime();
                navigator.mediaDevices.getUserMedia({audio: true, video: false})
                    .then(function (stream) {
                        this.showprocess = true
                        this.recorder = new MediaRecorder(stream);
                        audioTarget.srcObject = stream;

                        this.recorder.ondataavailable = (event) => {
                            console.log("ondataavailable");
                            uploadblob("attach/upload", event.data, ".mp3", res => {
                                var duration = Math.ceil((new Date().getTime() - this.duration) / 1000);
                                this.sendaudiomsg(res.data, duration);
                            })
                            stream.getTracks().forEach(function (track) {
                                track.stop();
                            });
                            this.showprocess = false
                        }
                        this.recorder.start();
                    }.bind(this)).catch(function (err) {
                    console.log(err)
                    mui.toast(err)
                    this.showprocess = false
                }.bind(this));
            },
            stoprecorder: function () {
                if (typeof this.recorder.stop == "function") {
                    this.recorder.stop();
                }
                this.showprocess = false
                console.log("stoprecorder")

            },
            dispatchplugin: function (item) {
                switch (item.id) {
                    case "upload":
                    case "camera":

                        break;
                    default:
                        mui.toast("系统暂不支持,请自行扩展")
                }
            },
            reset: function () {
                this.panelstat = "kbord";
                this.txtstat = "kbord";
                this.txtmsg = "";
            },
            createmsgcontext: function () {
                return JSON.parse(JSON.stringify(this.msgcontext))
            },
            loaddoutures: function () {
                var res = [];
                var config = this.doutu.config;
                for (var i in config.pkgids) {
                    res[config.pkgids[i]] = (config.baseurl + "/" + config.pkgids[i] + "/info.json")
                }
                var that = this;
                for (var id in res) {
                    //console.log("res[i]",id,res[id])
                    post(res[id], {}, function (pkginfo) {
                        //console.log("post res[i]",id,res[id],pkginfo)
                        var baseurl = config.baseurl + "/" + pkginfo.id + "/"
                        for (var j in pkginfo.assets) {
                            pkginfo.assets[j] = baseurl + pkginfo.assets[j];
                        }
                        pkginfo.icon = baseurl + pkginfo.icon;
                        that.doutu.packages.push(pkginfo)
                        if (that.doutu.choosed.pkgid == pkginfo.id) {
                            that.doutu.choosed.assets = pkginfo.assets;
                        }

                    })
                }
            },
            showweixin: function () {
                mui.alert("请加微信号jiepool-winlion索取")
            },
            showmsg: function (user, msg) {
                var data = {}
                data.ismine = userId() === msg.userId;
                //console.log(data.ismine,userId(),msg.userid)
                data.user = user;
                data.msg = msg;
                this.msglist = this.msglist.concat(data)
                this.reset();
                var that = this;
                that.timer = setTimeout(function () {
                    window.scrollTo(0, document.getElementById("convo").offsetHeight);
                    clearTimeout(that.timer)
                }, 100)

            },
            startrecord: function () {

            },
            sendtxtmsg: function (txt) {
                //{id:1,userid:2,dstid:3,cmd:10,media:1,content:"hello"}
                var msg = this.createmsgcontext();
                msg.media = 1;
                msg.content = txt;
                this.showmsg(userInfo(), msg);
                this.webSocket.send(JSON.stringify(msg))
            },
            sendpicmsg: function (picurl) {
                //{id:1,userid:2,dstid:3,cmd:10,media:4,url:"http://www.baidu.com/a/log,jpg"}
                var msg = this.createmsgcontext();
                msg.media = 2  //图像为2;
                msg.url = picurl;
                this.showmsg(userInfo(), msg)
                this.webSocket.send(JSON.stringify(msg))
            },
            sendaudiomsg: function (url, num) {
                //{id:1,userid:2,dstid:3,cmd:10,media:3,url:"http://www.a,com/dsturl.mp3",anount:40}
                var msg = this.createmsgcontext();
                msg.media = 3;
                msg.url = url;
                msg.amount = num;
                this.showmsg(userInfo(), msg)
                //console.log("sendaudiomsg",this.msglist);
                this.webSocket.send(JSON.stringify(msg))
            },
            singlemsg: function (user) {
                //console.log(user)
                this.win = "single";
                this.title = "和" + user.nickname + "聊天中";
                this.msgcontext.dstId = parseInt(user.id);
                this.msgcontext.cmd = 10;
            },
            groupmsg: function (group) {

                this.win = "group";
                this.title = group.name;
                this.msgcontext.dstId = parseInt(group.id);
                this.msgcontext.cmd = 11;
            },
            loaduserinfo: function (userid, cb) {
                userid = "" + userid;
                var userinfo = this.usermap[userid];
                if (!userinfo) {
                    post("user/find", {id: parseInt(userid)}, function (res) {
                        cb(res.data);
                        this.usermap[userid] = res.data;
                    }.bind(this))
                } else {
                    cb(userinfo)
                }
            },
            onmessage: function (data) {

                this.loaduserinfo(data.userId, function (user) {
                    this.showmsg(user, data)
                }.bind(this))

            },
            initwebsocket: function () {
                var url = "ws://" + location.host + "/chat?id=" + userId() + "&token=" + util.parseQuery("token");
                this.webSocket = new WebSocket(url);
                //消息处理
                this.webSocket.onmessage = function (evt) {
                    //{"data":"}",...}
                    if (evt.data.indexOf("}") > -1) {
                        this.onmessage(JSON.parse(evt.data));
                    } else {
                        console.log("recv<==" + evt.data)
                    }
                }.bind(this)
                //关闭回调
                this.webSocket.onclose = function (evt) {
                    console.log(evt.data)
                }
                //出错回调
                this.webSocket.onerror = function (evt) {
                    console.log(evt.data)
                }
                /*{
                    this.webSocket.send()
                }*/
            },
            sendmsg: function () {

            },
            loadfriends: function () {
                var that = this;
                post("contact/loadfriend", {userId: userId()}, function (res) {
                    that.friends = res.data.data || [];
                    var usermap = new Map();
                    for (var i in res.data.data) {
                        var k = "" + res.data.data[i].id
                        usermap[k] = res.data.data[i];
                    }
                    this.usermap = usermap;
                }.bind(this))
            },
            loadcommunitys: function () {
                var that = this;
                post("contact/loadcommunity", {userId: userId()}, function (res) {
                    that.communitys = res.data.data || [];
                })
            },
            addfriend: function () {
                var that = this;
                //prompt
                mui.prompt('', '请输入好友ID', '加好友', ['取消', '确认'], function (e) {
                    if (e.index === 1) {
                        if (isNaN(e.value) || e.value <= 0) {
                            mui.toast('格式错误');
                        } else {
                            //mui.toast(e.value);
                            that._addfriend(e.value)
                        }
                    } else {
                        //mui.toast('您取消了入库');
                    }
                }, 'div');
                document.querySelector('.mui-popup-input input').type = 'number';
            },
            _addfriend: function (dstobj) {
                var that = this
                post("contact/addfriend", {dstId: dstobj, userId: userId()}, function (res) {
                    if (res.code == 0) {
                        mui.toast("添加成功");
                        that.loadfriends();
                    } else {
                        mui.toast(res.msg);
                    }
                })
            },
            _joincomunity: function (dstobj) {
                var that = this;
                post("contact/joincommunity", {dstId: dstobj, userId: userId()}, function (res) {
                    if (res.code == 0) {
                        mui.toast("添加成功");

                        that.loadcommunitys();
                    } else {
                        mui.toast(res.msg);
                    }
                })
            },
            joincomunity: function () {
                var that = this;
                mui.prompt('', '请输入群号', '加群', ['取消', '确认'], function (e) {
                    if (e.index == 1) {
                        if (isNaN(e.value) || e.value <= 0) {
                            mui.toast('格式错误');
                        } else {
                            //mui.toast(e.value);
                            that._joincomunity(e.value)
                        }
                    } else {
                        //mui.toast('您取消了入库');
                    }
                }, 'div');
                document.querySelector('.mui-popup-input input').type = 'number';
            },
            quit: function () {
                sessionStorage.removeItem("userid")
                sessionStorage.removeItem("userinfo")
                location.href = "login.shtml"
            }


        },
        watch: {
            "win": function (n, o) {
                // console.log("watch",o,n)
                if (n != "main") {
                    document.getElementById("menubar").style.display = "none";
                } else {
                    document.getElementById("menubar").style.display = "block";
                }
            }
        }
    }
)