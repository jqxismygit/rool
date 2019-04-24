let gameInfo = require("../app/GameInfo");
let gameMessage = require("../app/GameMessage");
let user = require("../app/UserInfo");
let mvs = require("../MatchvsLib/Matchvs");
let msg = require("../MatchvsLib/MatvhvsMessage");
let engine = require("../MatchvsLib/MatchvsEngine");
cc.Class({
  extends: cc.Component,

  properties: {
    // //对家
    // topSeat: cc.Node,
    // //左边
    // leftSeat: cc.Node,
    // //右边
    // rightSeat: cc.Node,
    // //下边(自己)
    // bottomSeat: cc.Node
    seats: {
      default: [],
      type: cc.Node
    },
    roomName: cc.Label,
  },

  // LIFE-CYCLE CALLBACKS:


  initMatchvsEvent(self) {
    //在应用开始时手动绑定一下所有的回调事件

    cc.systemEvent.on(msg.MATCHVS_JOIN_ROOM_RSP, this.onMatchvsEvent, this);
    cc.systemEvent.on(msg.MATCHVS_JOIN_ROOM_NOTIFY, this.onMatchvsEvent, this);
    cc.systemEvent.on(msg.MATCHVS_ERROE_MSG, this.onMatchvsEvent, this);
    cc.systemEvent.on(msg.MATCHVS_ROOM_DETAIL, this.onMatchvsEvent, this);

    //设置回调
    //客户端之间的消息通讯
    mvs.response.sendEventNotify = this.sendEventResponse.bind(this);
    //客户端和服务器之间的消息通讯
    mvs.response.gameServerNotify = this.onGameEvent.bind(this);//接收gameServer的
  },

  //系统事件
  onMatchvsEvent(event) {
    console.log('on Matchvs Event------>>>> = ', event);
    let eventData = event.data;
    switch (event.type) {
      case msg.MATCHVS_JOIN_ROOM_RSP:
        console.log('加入房间成功->>>');
        break;
      case msg.MATCHVS_JOIN_ROOM_NOTIFY:
        console.log('有人加入了房间->>>');
        break;
      case msg.MATCHVS_JOIN_ROOM_RSP:
        console.log('获取房间详情->>>>>>>>>>');
        console.log('event.data = ', event.data);
        break;
      case msg.MATCHVS_ERROE_MSG:
        console.log("[Err]errCode:" + eventData.errorCode + " errMsg:" + eventData.errorMsg);
        break;
    }
  },

  //服务器事件
  onGameEvent(event) {
    let eventData = JSON.parse(event.cpProto);
    console.log('on Game Event------>>>> = ', eventData);
    switch (eventData.type) {
      case gameMessage.PLAYER_UPDATE_EVENT:
        this.players = eventData.data.players;
        if (!this.player) {
          for (let i = 0; i < this.players.length; ++i) {
            if (this.players[i].userID === user.userID) {
              this.player = this.players[i];
              break;
            }
          }
        }
        if (this.player) {
          let mainSeat = this.player.seat;
          // this.seats[0].getChildByName("name").getComponent(cc.Label).string = this.player.profile.name;
          for (let i = 0; i < this.players.length; ++i) {
            let currentSeat = this.players[i].seat;
            this.seats[(4 - Math.abs(currentSeat - mainSeat)) % 4].getChildByName("name").getComponent(cc.Label).string = this.players[i].profile.name;
          }
        }
        // console.log('更新玩家成功----->>>', this.players, this.player);
        break;
      case gameMessage.GAME_START_EVENT:
        console.log('收到游戏开始的消息，开始抓牌---->>>');
        engine.prototype.sendEventEx(1, JSON.stringify({
          type: gameMessage.GET_PLAYER_CARDS_EVENT
        }));
        break;
      case gameMessage.GET_PLAYER_CARDS_RSP_EVENT:
        console.log('服务器发牌啦---->>>', eventData.data);

        break;
    }
  },

  //客户端之间的消息响应
  sendEventResponse: function (info) {
    if (!info
      || !info.status
      || info.status !== 200) {
      console.log('事件发送失败');
    }
  },

  //自定义事件
  onLoad() {

    this.initMatchvsEvent(this);
    console.log(user);

  },

  start() {

  },

  // update (dt) {},
});
