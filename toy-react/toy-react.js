// 用一个symbol来私有化
const RENDER_TO_DOM = Symbol("render to dom")

class ElementWrapper {
    constructor(type) {
        this.root = document.createElement(type);
    }
    setAttribute(name, value) {
        // 正则里 [\s\S] 表示所有的字符
        if(name.match(/^on([\s\S]+)$/)){
            // 确保是小写字母开头的, 大小写敏感
            this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c=>c.toLowerCase()), value);
        }else {
            if(name === "className"){
                this.root.setAttribute("class", value);
            } else {
                this.root.setAttribute(name, value);
            }
        }
    }
    appendChild(component) {
        let range = document.createRange();
        range.setStart(this.root, this.root.childNodes.length);
        range.setEnd(this.root, this.root.childNodes.length);
        component[RENDER_TO_DOM](range);
    }
    [RENDER_TO_DOM](range) {
        range.deleteContents();
        range.insertNode(this.root);
    }
}
class TextWrapper {
    constructor(content) {
        this.root = document.createTextNode(content);
    }
    [RENDER_TO_DOM](range) {
        range.deleteContents();
        range.insertNode(this.root);
    }
}

export class Component {
    constructor() {
        this.props = Object.create(null);
        this.children = [];
        this._root = null;
        this._range = null;
    }
    setAttribute(name, value) {
        this.props[name] = value;
    }
    appendChild(component) {
        this.children.push(component);
    }
    // 私有的，range API是位置position
    [RENDER_TO_DOM](range) {
        this._range = range;
        // 递归
        this.render()[RENDER_TO_DOM](range);
    }
    // 重新绘制的算法
    rerender(){
        let oldRange = this._range;
        let range = document.createRange();
        range.setStart(oldRange.startContainer,oldRange.startOffset);
        range.setEnd(oldRange.startContainer,oldRange.startOffset);
        this[RENDER_TO_DOM](range);
        oldRange.setStart(range.endContainer,range.endOffset);
        oldRange.deleteContents();
    }
    // 跟渲染相关，实现更新的话，不能进行root的更新
    // get root() {
    //     if (!this._root) {
    //         this._root = this.render().root;
    //     }
    //     return this._root;
    // }
    // 深拷贝的合并, 递归的形式去访问每一个对象和属性
    setState(newState) {
        if(this.state === null || typeof this.state !== "object") {
            this.state = newState;
            this.rerender();
            return;
        }
        let merge = function(oldState, newState) {
            for(let p in newState){
                if(oldState[p] === null || typeof this.oldState[p] !== "object") {
                    oldState[p] = newState[p];
                } else {
                    merge(oldState[p], newState[p]);
                }
            }
        }
        merge(this.state, newState);
        this.rerender();
    }
}


export function createElement(type, attributes, ...children) {
    let e;
    if (typeof type === 'string') {
        e = new ElementWrapper(type);
    } else {
        e = new type;;
    }

    for (let p in attributes) {
        e.setAttribute(p, attributes[p]);
    }
    let insertChildren = (children) => {
        for (let child of children) {
            if (typeof child === "string") {
                child = new TextWrapper(child);
            }
            if (child === null) {
                continue;
            }
            if ((typeof child === 'object') && (child instanceof Array)) {
                insertChildren(child);
            } else {
                e.appendChild(child);
            }
        }
    }
    insertChildren(children);
    return e;
}
export function render(component, parentElement) {
    let range = document.createRange();
    range.setStart(parentElement, 0);
    // 包含文本节点和注释节点
    range.setEnd(parentElement, parentElement.childNodes.length);
    range.deleteContents();
    component[RENDER_TO_DOM](range);
}