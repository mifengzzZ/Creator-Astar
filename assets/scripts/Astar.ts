// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

import { GRID_TYPE, TOUCH_GRID } from "./Global";
import Grid from "./Grid";
import BinaryHeap from "./BinaryHeap";
import Num from "./Num";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Astar extends cc.Component {

    @property({ type: cc.Prefab })
    grid: cc.Prefab = null;

    /** 保存地图格子二维数组 */
    _mapGridArray: Grid[][] = new Array<Array<Grid>>();

    /** 生产的路径 */
    _pathGridArray: Array<Grid> = [];

    /** 点击地图格子的操作模式 */
    _touchGridState: TOUCH_GRID = TOUCH_GRID.NORMAL;

    /** 开启列表 */
    _openList: BinaryHeap = null;

    /** 关闭列表 */
    _closeList: Array<Grid> = [];

    /** row */
    _row: number = 0;

    /** col */
    _col: number = 0;

    /** 起点 */
    private _startGrid: Grid = null;
    public set startGrid(v: Grid) {
        if (this._startGrid !== null) {
            this._startGrid.resetGridType();
        }
        this._startGrid = v;
    }
    public get startGrid(): Grid {
        return this._startGrid;
    }

    /** 终点 */
    private _endGrid: Grid = null;
    public set endGrid(v: Grid) {
        if (this._endGrid !== null) {
            this._endGrid.resetGridType();
        }
        this._endGrid = v;
    }
    public get endGrid(): Grid {
        return this._endGrid;
    }

    onLoad() {
        this._openList = new BinaryHeap((a: Grid) => {
            return a.f;
        });
        // let heap = new BinaryHeap((a: Num) => {
        //     return a.x;
        // });
        // let temp = [10, 3, 4, 8, 2, 9, 7, 1, 2, 6, 5];
        // for (let index = 0; index < temp.length; index++) {
        //     let tempNum = new Num();
        //     tempNum.x = temp[index];
        //     heap.push(tempNum);
        // }
    }

    start() {
        this.initMapGrid();
    }

    /**
     * 初始化地图格子
     */
    private initMapGrid() {
        this._row = this.node.width / 8;
        this._col = this.node.height / 6.4;
        console.log(`地图的尺寸: 行${this._row} 列${this._col}`);
        for (let k = 0; k < this._col; k++) {
            this._mapGridArray[k] = [];
            for (let j = 0; j < this._row; j++) {
                let node = cc.instantiate(this.grid);
                let grid = node.getComponent(Grid);
                grid.astar = this;
                grid.x = k;
                grid.y = j;
                this._mapGridArray[k].push(grid);
                let dieRoll = Math.floor((Math.random() * 10));
                if (dieRoll === 2 || dieRoll === 7) {
                    grid.setTypeZA();
                }
                node.setPosition(node.width / 2 + 8 * k, node.height / 2 + 6.4 * j);
                this.node.addChild(node);
            }
        }
        console.log('地图格子数据 : ', this._mapGridArray);
    }

    /**
     * 操作按钮点击
     */
    onClickMenu(touch: cc.Event.EventTouch, custom) {
        console.log('touch.target.name : ', touch.target.name);
        switch (touch.target.name) {
            case 'zhangaiwuBtn':
                this._touchGridState = TOUCH_GRID.ZHANGAIWU;
                break;
            case 'startBtn':
                this._touchGridState = TOUCH_GRID.QIDIAN;
                break;
            case 'zhongdianBtn':
                this._touchGridState = TOUCH_GRID.ZHONGDIAN;
                break;
            case 'xiangpicaBtn':
                this._touchGridState = TOUCH_GRID.CACHU;
                break;
            case 'findPathBtn':
                if (this._pathGridArray.length !== 0) {
                    this._touchGridState = TOUCH_GRID.NORMAL;
                    this.startGrid = null;
                    this.endGrid = null;
                    for (let index = 0; index < this._pathGridArray.length; index++) {
                        const grid = this._pathGridArray[index];
                        grid.resetGridType();
                    }
                    for (let index = 0; index < this._openList.content.length; index++) {
                        const grid = this._openList.content[index];
                        grid.resetGridType();
                    }
                    for (let index = 0; index < this._closeList.length; index++) {
                        const grid = this._closeList[index];
                        grid.resetGridType();
                    }
                    this._pathGridArray = [];
                } else {
                    this._touchGridState = TOUCH_GRID.NORMAL;
                    this._pathGridArray = this.searchPath();
                    // console.log('path : ', this._pathGridArray);
                    for (let index = 1; index < this._pathGridArray.length - 1; index++) {
                        const element = this._pathGridArray[index];
                        element.setBgYellow();
                    }
                    // 看是否有相同的开启列表
                    for (let index = 0; index < this._openList.content.length; index++) {
                        for (let j = 0; j < this._openList.content.length; j++) {
                            if (index !== j && this._openList.content[j] === this._openList.content[index]) {
                                console.log('有相同格子在开启列表中');
                                console.log(`x:${this._openList.content[index].x} y:${this._openList.content[index].y}`);
                            }
                        }
                    }
                    // 关闭列表
                    for (let index = 0; index < this._closeList.length; index++) {
                        for (let j = 0; j < this._closeList.length; j++) {
                            if (index !== j && this._closeList[j] === this._closeList[index]) {
                                console.log('有相同格子在关闭列表中');
                                console.log(`x1:${this._closeList[index].x} y1:${this._closeList[index].y}`);
                            }
                        }
                    }
                }
                break;
            case 'clearBtn':
                this._touchGridState = TOUCH_GRID.NORMAL;
                this.startGrid = null;
                this.endGrid = null;
                for (let index = 0; index < this._pathGridArray.length; index++) {
                    const grid = this._pathGridArray[index];
                    grid.resetGridType();
                }
                for (let index = 0; index < this._openList.content.length; index++) {
                    const grid = this._openList.content[index];
                    grid.resetGridType();
                }
                for (let index = 0; index < this._closeList.length; index++) {
                    const grid = this._closeList[index];
                    grid.resetGridType();
                }
                this._pathGridArray = [];
                break;
        }
    }

    /**
     * 搜索路径
     */
    searchPath(): Array<Grid> {
        if (this._startGrid === null || this._endGrid === null) {
            return [];
        }

        this._openList.removeAll();
        this._closeList = [];

        // 将起点加入到关闭列表中
        this._closeList.push(this._startGrid);

        while (true) {
            // 左上
            this.findNearlyToOpenList(this._startGrid.x - 1, this._startGrid.y + 1, 1.4, this._startGrid, this._endGrid);
            // 上
            this.findNearlyToOpenList(this._startGrid.x, this._startGrid.y + 1, 1, this._startGrid, this._endGrid);
            // 右上
            this.findNearlyToOpenList(this._startGrid.x + 1, this._startGrid.y + 1, 1.4, this._startGrid, this._endGrid);
            // 左
            this.findNearlyToOpenList(this._startGrid.x - 1, this._startGrid.y, 1, this._startGrid, this._endGrid);
            // 右
            this.findNearlyToOpenList(this._startGrid.x + 1, this._startGrid.y, 1, this._startGrid, this._endGrid);
            // 左下
            this.findNearlyToOpenList(this._startGrid.x - 1, this._startGrid.y - 1, 1.4, this._startGrid, this._endGrid);
            // 下
            this.findNearlyToOpenList(this._startGrid.x, this._startGrid.y - 1, 1, this._startGrid, this._endGrid);
            // 右下
            this.findNearlyToOpenList(this._startGrid.x + 1, this._startGrid.y - 1, 1.4, this._startGrid, this._endGrid);

            // 开启列表是否为空,说明一开始就是死路
            if (this._openList.content.length === 0) {
                // console.log('this._openList : ', this._openList.content.length);
                return [];
            }

            // 放入关闭列表并且从开启列表中删除
            // console.log('this._openList : ', this._openList.content.length);
            let openGrid = this._openList.pop();
            this._closeList.push(openGrid);
            this._startGrid = openGrid;

            if (this._startGrid === this._endGrid) {
                let path: Array<Grid> = [];
                path.push(this._endGrid);
                while (this._endGrid.parent !== null) {
                    // 压栈的方式
                    path.unshift(this._endGrid.parent);
                    this._endGrid = this._endGrid.parent;
                }
                return path;
            }
        }

    }

    /**
     * 将临近的点放入到开启列表中
     * @param x 
     * @param y 
     * @param father 
     * @param end 
     */
    findNearlyToOpenList(x: number, y: number, g: number, father: Grid, end: Grid) {
        if (x < 0 || x >= this._col || y < 0 || y >= this._row) {
            return
        }

        let grid = this._mapGridArray[x][y];
        if (grid === null || grid.type === GRID_TYPE.ZHANGAIWU) {
            return;
        }

        // 是否已经在开启列表或关闭列表
        for (let index = 0; index < this._openList.content.length; index++) {
            if (grid === this._openList.content[index]) {
                return;
            }
        }
        for (let index = 0; index < this._closeList.length; index++) {
            if (grid === this._closeList[index]) {
                return;
            }
        }

        // 计算消耗
        grid.parent = father;
        grid.g = father.g + g;
        grid.h = Math.abs(end.x - grid.x) + Math.abs(end.y - grid.y);
        grid.f = grid.g + grid.h;

        if (grid !== this._endGrid) {
            grid.setSearchColor();
        }
        this._openList.push(grid);
    }

}
