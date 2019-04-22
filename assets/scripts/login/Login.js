let gameInfo = require("../app/GameInfo");
let user = require("../app/UserInfo");
let engine = require("../MatchvsLib/MatchvsEngine");
let msg = require("../MatchvsLib/MatvhvsMessage");
let mvs = require("../MatchvsLib/Matchvs");
cc.Class({
    extends: cc.Component,

    properties: {
        loginBtn: cc.Button,
        wechatLoginBtn: cc.Button,
        clearStorageBtn: cc.Button
    },

    // LIFE-CYCLE CALLBACKS:

    // onLoad: function () {
    //     this.login.node.on('click', this.onLogin, this);
    //     this.wechatLogin.node.on('click', this.onLogin, this);
    // },

    // onLogin: function (event) {
    //     if (event.node.name === 'Login') {
    //         var matchvsAuthNode = cc.find("Canvas/MatchvsAuth");
    //         if (matchvsAuthNode) {
    //             var matchvsAuth = matchvsAuthNode.getComponent("MatchvsAuth");
    //             matchvsAuth.auth();
    //         }
    //     } else if (event.node.name === 'WechatLogin') {

    //     }
    //     console.log(event.node.name);
    // },

    // start() {

    // },

    // update (dt) {},


    /**
     * load 显示页面
     */
    onLoad: function () {
        this.initEvent();
        this.loginBtn.node.on('click', function () {
            engine.prototype.init(gameInfo.channel, gameInfo.platform, gameInfo.gameID);
        }, this);

        this.clearStorageBtn.node.on('click', function () {
            mvs.LocalStore_Clear();
        }, this);
    },

    /**
     * 注册对应的事件监听和把自己的原型传递进入，用于发送事件使用
     */
    initEvent: function () {
        cc.systemEvent.on(msg.MATCHVS_INIT, this.onEvent, this);
        cc.systemEvent.on(msg.MATCHVS_RE_CONNECT, this.onEvent, this);
        cc.systemEvent.on(msg.MATCHVS_ERROE_MSG, this.onEvent, this);
        cc.systemEvent.on(msg.MATCHVS_REGISTER_USER, this.onEvent, this);
        cc.systemEvent.on(msg.MATCHVS_LOGIN, this.onEvent, this);
        cc.systemEvent.on(msg.MATCHVS_WX_BINDING, this.onEvent, this);
    },


    /**
     * 事件接收方法
     * @param event
     */
    onEvent: function (event) {
        let eventData = event.data;
        switch (event.type) {
            case msg.MATCHVS_INIT:
                this.labelLog('初始化成功');
                this.getUserFromWeChat(this);
                break;
            case msg.MATCHVS_REGISTER_USER:
                this.login(eventData.userInfo.id, eventData.userInfo.token);
                break;
            case msg.MATCHVS_LOGIN:
                if (eventData.MsLoginRsp.roomID != null && eventData.MsLoginRsp.roomID !== '0') {
                    console.log("开始重连" + eventData.MsLoginRsp.roomID);
                    engine.prototype.reconnect();
                } else {
                    cc.director.loadScene("home");
                }
                break;
            case msg.MATCHVS_RE_CONNECT:

                // cc.director.loadScene("home");

                // if (eventData.roomUserInfoList.state === 1) {
                //     if (eventData.roomUserInfoList.roomProperty === "") {
                //         engine.prototype.leaveRoom();
                //         cc.director.loadScene("Lobby");
                //     } else {
                //         cc.director.loadScene('CreateRoom');
                //     }
                // } else {
                //     cc.director.loadScene("Game");
                // }

                console.log(eventData);

                gameInfo.roomID = eventData.roomUserInfoList.roomID;
                // if (eventData.roomUserInfoList.owner === GLB.userID) {
                //     GLB.isRoomOwner = true;
                // } else {
                //     GLB.isRoomOwner = false;
                // }
                if (eventData.roomUserInfoList.state === 1) {
                    if (eventData.roomUserInfoList.roomProperty === "") {
                        engine.prototype.leaveRoom();
                        cc.director.loadScene("home");
                    } else {
                        console.log('直接进入房间---->>>');
                        cc.director.loadScene('room');
                    }
                } else {
                    cc.director.loadScene("home");
                }
                break;
            case msg.MATCHVS_ERROE_MSG:
                this.labelLog("[Err]errCode:" + eventData.errorCode + " errMsg:" + eventData.errorMsg);
                //只要出错了直接logout
                engine.prototype.logout();
                break;
            case msg.MATCHVS_WX_BINDING:
                engine.prototype.login(eventData.data.userid, eventData.data.token);
                break;
        }
    },

    getUserFromWeChat: function (self) {
        //获取微信信息
        try {
            getWxUserInfo(function (userInfos) {
                getUserOpenID(function (openInfos) {
                    userInfos.openInfos = openInfos;
                    self.bindOpenIDWithUserID(userInfos);
                });
            });
        } catch (error) {
            console.warn("getUserFromWeChat for error:" + error.message);
            console.log("不是在微信平台，调用不进行绑定！");
            engine.prototype.registerUser();
        }
    },

    /**
     * 登录
     * @param id
     * @param token
     */
    login: function (id, token) {
        user.userID = id;
        this.labelLog('开始登录...用户ID:' + id + " gameID " + gameInfo.gameID);
        engine.prototype.login(id, token);
    },

    /**
     * 移除监听
     */
    removeEvent: function () {
        cc.systemEvent.off(msg.MATCHVS_INIT, this.onEvent);
        cc.systemEvent.off(msg.MATCHVS_RE_CONNECT, this.onEvent);
        cc.systemEvent.off(msg.MATCHVS_ERROE_MSG, this.onEvent);
        cc.systemEvent.off(msg.MATCHVS_REGISTER_USER, this.onEvent);
        cc.systemEvent.off(msg.MATCHVS_LOGIN, this.onEvent);
        cc.systemEvent.off(msg.MATCHVS_WX_BINDING, this.onEvent);
    },

    /**
     * 页面log打印
     * @param info
     */
    labelLog: function (info) {
        // this.labelInfo.string += '\n[LOG]: ' + info;
        console.log(info);
    },

    /**
     * 生命周期，页面销毁
     */
    onDestroy() {
        this.removeEvent();
        console.log("Login页面销毁");
    },

    setUserData(GameID, userID, key, value, appKey, appSecret, platform) {
        let request = new XMLHttpRequest();
        let url;
        if (platform === "release") {
            url = "https://vsuser.matchvs.com/wc6/thirdBind.do?"
        } else if (platform === "alpha") {
            url = "https://alphavsuser.matchvs.com/wc6/thirdBind.do?";
        }
        request.open("GET", url, true);
    },

    /**
     * 绑定微信OpenID 返回用户信息
     */
    bindOpenIDWithUserID: function (wxUserInfo) {
        let self = this;
        console.log("获取到的微信用户信息", wxUserInfo);
        if (!wxUserInfo) {
            return;
        }
        console.log('openid:' + wxUserInfo.openInfos.data.openid);
        if (wxUserInfo.openInfos.data.openid === undefined) {
            console.warn("没有获取到微信OpenID，获取OpenID请参考：" + 'http://www.matchvs.com/service?page=third');
            engine.prototype.registerUser();
            return;
        }
        user.name = wxUserInfo.nickName;
        user.avatar = wxUserInfo.avatarUrl;
        user.isWX = true;
        let req = new XMLHttpRequest();
        let reqUrl = this.getBindOpenIDAddr(GLB.channel, GLB.platform);
        req.open("post", reqUrl, true);
        req.setRequestHeader("Content-Type", "application/json");
        req.onreadystatechange = function () {
            if (req.readyState === 4 && (req.status >= 200 && req.status < 400)) {
                try {
                    let response = req.responseText;
                    let data = JSON.parse(response).data;
                    console.log(data.userid, data.token);
                    self.login(data.userid, data.token);
                } catch (error) {
                    console.warn(error.message);
                    engine.prototype.registerUser();
                }
            }
        };
        let params = "gameID=" + gameInfo.gameID + "&openID=" + wxUserInfo.openInfos.data.openid + "&session=" + wxUserInfo.openInfos.data.session_key + "&thirdFlag=1";
        //计算签名
        let signstr = this.getSign(params);
        //重组参数
        // params = "userID=0&"+params+"&sign="+signstr;

        let jsonParam = {
            userID: 0,
            gameID: gameInfo.gameID,
            openID: wxUserInfo.openInfos.data.openid,
            session: wxUserInfo.openInfos.data.session_key,
            thirdFlag: 1,
            sign: signstr
        };
        req.send(jsonParam);

    },

    getBindOpenIDAddr: function (channel, platform) {
        if (channel === "MatchVS" || channel === "Matchvs") {
            if (platform === "release") {
                return "http://vsuser.matchvs.com/wc6/thirdBind.do?"
            } else if (platform === "alpha") {
                return "http://alphavsuser.matchvs.com/wc6/thirdBind.do?";
            }
        } else if (channel === "MatchVS-Test1") {
            if (platform === "release") {
                return "http://zwuser.matchvs.com/wc6/thirdBind.do?"
            } else if (platform === "alpha") {
                return "http://alphazwuser.matchvs.com/wc6/thirdBind.do?";
            }
        }
    },

    getSign: function (params) {
        let str = gameInfo.appKey + "&" + params + "&" + gameInfo.secret;
        console.log(str);
        let md5Str = hex_md5(str);
        console.log(md5Str);
        return md5Str;
    },


});
