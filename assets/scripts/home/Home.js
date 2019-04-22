let gameInfo = require("../app/GameInfo");
// let user = require("../app/UserInfo");
let engine = require("../MatchvsLib/MatchvsEngine");
let msg = require("../MatchvsLib/MatvhvsMessage");

cc.Class({
    extends: cc.Component,

    properties: {
        single: cc.Button,
        multiple: cc.Button
    },

    // LIFE-CYCLE CALLBACKS:


    initMatchvsEvent(self) {
        //在应用开始时手动绑定一下所有的回调事件

        cc.systemEvent.on(msg.MATCHVS_JOIN_ROOM_RSP, this.onMatchvsEvent, this);
        // this.node.on(msg.MATCHVS_JOIN_ROOM_NOTIFY,this.joinRoomNotify,this);
        cc.systemEvent.on(msg.MATCHVS_ERROE_MSG, this.onMatchvsEvent, this);
    },

    onMatchvsEvent(event) {
        let eventData = event.data;
        switch (event.type) {
            case msg.MATCHVS_JOIN_ROOM_RSP:
                console.log('加入房间成功->>>>>>>>>>');
                console.log('event.data = ', event.data);
                cc.director.loadScene("room");
                break;
            case msg.MATCHVS_ERROE_MSG:
                console.log("[Err]errCode:" + eventData.errorCode + " errMsg:" + eventData.errorMsg);
                break;
        }
    },

    onLoad() {

        this.initMatchvsEvent(this);

        this.single.node.on('click', function () {
            // engine.prototype.init(gameInfo.channel, gameInfo.platform, gameInfo.gameID);
            engine.prototype.joinRandomRoom(gameInfo.maxNumber);
        }, this);

        this.multiple.node.on('click', function () {
            // engine.prototype.init(gameInfo.channel, gameInfo.platform, gameInfo.gameID);
            alert('暂不支持');
        }, this);
    },

    start() {

    },

    // update (dt) {},
});
