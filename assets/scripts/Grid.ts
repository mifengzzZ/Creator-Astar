// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import Astar from "./Astar";
import { GRID_TYPE, TOUCH_GRID } from "./Global";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Grid extends cc.Component {

    red: cc.Color = new cc.Color(255, 0, 0, 255);
    grey: cc.Color = new cc.Color(169, 169, 169, 255);
    green: cc.Color = new cc.Color(0, 255, 36, 255);
    blue: cc.Color = new cc.Color(0, 36, 255, 255);
    yellow: cc.Color = new cc.Color(255, 255, 0, 255);

    @property({ type: cc.Node })
    bg: cc.Node = null;

    /** 格子坐标 */
    x = 0;
    y = 0;

    // 寻路消耗 f = g + h
    f: number = 0;
    g: number = 0;
    h: number = 0;

    // 格子的父节点
    parent: Grid = null;

    // 格子类型
    type: GRID_TYPE = GRID_TYPE.NORMAL;

    // Astar 实例
    _astar: Astar = null;
    public set astar(v: Astar) {
        this._astar = v;
    }
    public get astar(): Astar {
        return this._astar;
    }

    onLoad() {
    }

    start() {

    }

    onClickGrid() {
        // console.log('this.astar : ', this.astar);
        if (this._astar._touchGridState === TOUCH_GRID.NORMAL) {
            // console.log('对格子操作无效');
        } else if (this._astar._touchGridState === TOUCH_GRID.ZHANGAIWU) {
            // console.log('障碍物');
            this.type = GRID_TYPE.ZHANGAIWU;
            this.bg.color = this.red;
            this.f = 0;
            this.g = 0;
            this.h = 0;
            this.parent = null;
        } else if (this._astar._touchGridState === TOUCH_GRID.QIDIAN) {
            // console.log('起点');
            this.type = GRID_TYPE.START;
            this._astar.startGrid = this;
            this.bg.color = this.green;
        } else if (this._astar._touchGridState === TOUCH_GRID.ZHONGDIAN) {
            // console.log('终点');
            this.type = GRID_TYPE.END;
            this._astar.endGrid = this;
            this.bg.color = this.blue;
        } else if (this._astar._touchGridState === TOUCH_GRID.CACHU) {
            // console.log('擦除');
            this.resetGridType();
        }
        // console.log(this.astar.startGrid);
        // console.log(this.astar.endGrid);
        // console.log(this.astar._mapGridArray);
    }

    setBgYellow() {
        this.bg.color = this.yellow;
    }

    setSearchColor() {
        this.bg.color = new cc.Color(128, 0, 128, 255);
    }

    setTypeZA() {
        this.type = GRID_TYPE.ZHANGAIWU;
        this.bg.color = this.red;
        this.f = 0;
        this.g = 0;
        this.h = 0;
        this.parent = null;
    }

    resetGridType() {
        this.type = GRID_TYPE.NORMAL;
        this.bg.color = this.grey;
        this.f = 0;
        this.g = 0;
        this.h = 0;
        this.parent = null;
    }

}
