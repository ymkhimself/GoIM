function userInfo(o) {
    if (typeof o == "undefined") {
        var r = sessionStorage.getItem("userinfo");
        if (!!r) {
            return JSON.parse(r);
        } else {
            return null
        }
    } else {
        sessionStorage.setItem("userinfo", JSON.stringify(o));
    }
}

function userId(id) {
    if (typeof id == "undefined") {
        var r = sessionStorage.getItem("userid");
        if (!r) {
            return 0;
        } else {
            return parseInt(r)
        }
    } else {
        sessionStorage.setItem("userid", id);
    }
}

var url = location.href;
var isOpen = url.indexOf("/login") > -1 || url.indexOf("/register") > -1
if (!userId() && !isOpen) {
    // location.href = "login.shtml";
}



function upload(dom) {

    var data = new FormData();
    data.append('file', dom.files[0])
    data.append('filetype', '.jpg')
    axios.post("/attach/upload", data).then(function (res) {
        if (res.data.code !== 0) {
            mui.toast(res.data.msg)
        } else {
            app.sendpicmsg(res.data.data)
        }
    })
}

var app = new Vue(
    {
        el: "#app",
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
            token: "",
            doutu: {
                config: {
                    "baseurl": "/asset/plugins/doutu",
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
                            var form = new FormData();
                            form.append('file', event.data)
                            form.append('filetype', '.mp3')
                            var that = this
                            console.log("触发了")
                            axios.post("/attach/upload", form).then(function (res) {
                                if (res.data.code !== 0) {
                                    mui.toast(res.data.msg)
                                } else {
                                    var duration = Math.ceil((new Date().getTime() - that.duration) / 1000);
                                    that.sendaudiomsg(res.data.data, duration)
                                }
                            })
                            stream.getTracks().forEach(function (track) {
                                track.stop();
                            });
                            this.showprocess = false
                            // uploadblob("attach/upload", event.data, ".mp3", res => {
                            //     var duration = Math.ceil((new Date().getTime() - this.duration) / 1000);
                            //     this.sendaudiomsg(res.data, duration);
                            // })
                            // stream.getTracks().forEach(function (track) {
                            //     track.stop();
                            // });
                            // this.showprocess = false
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
            showweixin: function () {
                mui.alert("请加微信号jiepool-winlion索取")
            },
            loaddoutures: function () {
                var res = [];
                var config = this.doutu.config;
                for (var i in config.pkgids) {
                    res[config.pkgids[i]] = (config.baseurl + "/" + config.pkgids[i] + "/info.json")
                }
                // console.log(res)
                var that = this;
                for (var id in res) {
                    axios.get(res[id]).then(function (res) {
                        pkginfo = res.data
                        var baseurl = config.baseurl + "/" + pkginfo.id + "/"
                        for (var j in pkginfo.assets) {
                            pkginfo.assets[j] = baseurl + pkginfo.assets[j];
                        }
                        pkginfo.icon = baseurl + pkginfo.icon;
                        that.doutu.packages.push(pkginfo)
                        if (that.doutu.choosed.pkgid === pkginfo.id) {
                            that.doutu.choosed.assets = pkginfo.assets;
                        }
                    })
                    // post(res[id], {}, function (pkginfo) {
                    //     //console.log("post res[i]",id,res[id],pkginfo)
                    //     var baseurl = config.baseurl + "/" + pkginfo.id + "/"
                    //     for (var j in pkginfo.assets) {
                    //         pkginfo.assets[j] = baseurl + pkginfo.assets[j];
                    //     }
                    //     pkginfo.icon = baseurl + pkginfo.icon;
                    //     that.doutu.packages.push(pkginfo)
                    //     if (that.doutu.choosed.pkgid === pkginfo.id) {
                    //         that.doutu.choosed.assets = pkginfo.assets;
                    //     }
                    //
                    // })
                }
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
                msg.media = 1;  //1是
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
                msg.media = 3;  //3是语音消息
                msg.url = url;
                msg.amount = num;
                this.showmsg(userInfo(), msg)
                //console.log("sendaudiomsg",this.msglist);
                this.webSocket.send(JSON.stringify(msg))
            },
            singlemsg: function (user) {
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
                var that = this
                if (!userinfo) {
                    axios.get("/user/"+parseInt(userid)).then(function (res) {
                        if(res.data.code !== 0) {
                            mui.toast(res.data.msg)
                        }else {
                            cb(res.data.data);
                            that.usermap[userid] = res.data.data;
                        }
                    })
                } else {
                    cb(userinfo)
                }
            },
            onmessage: function (data) {
                this.loaduserinfo(data.userId, function (user) {
                    // console.log(user)
                    this.showmsg(user, data)
                }.bind(this))
            },
            initwebsocket: function () {
                var user = userInfo()
                var url = "ws://" + location.host + "/chat?id=" + userId();
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
                    console.log("ws 关闭")
                }
                //出错回调
                this.webSocket.onerror = function (evt) {
                    console.log("ws 出错")
                }
            },
            sendmsg: function () {

            },
            loadfriends: function () {
                var that = this;
                axios.get("/contact/loadfriend/" + userId()).then(function (res) {
                    if (res.data.code !== 0) {
                        mui.toast("加载失败")
                    } else {
                        that.friends = res.data.data || [];
                        var umap = new Map();
                        for (var i in res.data.data) {
                            var k = "" + res.data.data[i].id
                            umap.set(k,res.data.data[i])
                        }
                        this.usermap = umap
                    }
                })
                // post("contact/loadfriend", {userId: userId()}, function (res) {
                //     that.friends = res.data.data || [];
                //     var usermap = new Map();
                //     for (var i in res.data.data) {
                //         var k = "" + res.data.data[i].id
                //         usermap[k] = res.data.data[i];
                //     }
                //     this.usermap = usermap;
                // }.bind(this))
            },
            loadcommunitys: function () {
                var that = this;
                axios.get("/contact/loadcommunity/" + userId()).then(function (res) {
                    if (res.data.code !== 0) {
                        mui.toast("加载出错")
                    } else {
                        that.communitys = res.data.data || [];
                    }
                })
                // post("contact/loadcommunity", {userId: userId()}, function (res) {
                //     that.communitys = res.data.data || [];
                // })
            },
            addfriend: function () {
                mui.prompt('', '请输入好友ID', '加好友', ['取消', '确认'], function (e) {
                    if (e.index === 1) {
                        if (isNaN(e.value) || e.value <= 0) {
                            mui.toast('格式错误');
                        } else {
                            axios.post("/contact/addfriend", {
                                dstId: parseInt(e.value),
                                ownerId: userId()
                            }).then(function (res) {
                                if (res.data.code !== 0) {
                                    mui.toast(res.data.msg)
                                } else {
                                    mui.toast("添加成功")
                                }
                            })
                        }
                    } else {
                        //mui.toast('您取消了入库');
                    }
                }, 'div');
                document.querySelector('.mui-popup-input input').type = 'number';
            },
            joincommunity: function () {
                var that = this;
                mui.prompt('', '请输入群号', '加群', ['取消', '确认'], function (e) {
                    if (e.index === 1) {
                        if (isNaN(e.value) || e.value <= 0) {
                            mui.toast('格式错误');
                        } else {
                            //mui.toast(e.value);
                            axios.post("/contact/joincommunity", {
                                dstId: parseInt(e.value),
                                ownerId: userId()
                            }).then(function (res) {
                                if (res.data.code !== 0) {
                                    mui.toast(res.data.msg)
                                } else {
                                    that.loadcommunitys()
                                    mui.toast("添加成功")
                                }
                            })
                        }
                    } else {
                        //mui.toast('您取消了入库');
                    }
                }, 'div');
                document.querySelector('.mui-popup-input input').type = 'number';
            },
            createcommunity: function () {
                var that = this;
                mui.prompt('', '请输入群名', '创建群聊', ['取消', '确认'], function (e) {
                    if (e.index === 1) {
                        if (e.value !== '') {
                            mui.toast('格式错误');
                        } else {
                            //mui.toast(e.value);
                            axios.post("/contact/createcommunity", {
                                name: parseInt(e.value),
                                ownerId: userId(),
                            }).then(function (res) {
                                if (res.data.code !== 0) {
                                    mui.toast(res.data.msg)
                                } else {
                                    that.loadcommunitys()
                                    mui.toast("创建成功,群号为" + res.data.data)
                                }
                            })
                        }
                    } else {
                        //mui.toast('您取消了入库');
                    }
                }, 'div');
            },
            quit: function () {
                sessionStorage.removeItem("userid")
                sessionStorage.removeItem("userinfo")
                location.href = "login.html"
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

