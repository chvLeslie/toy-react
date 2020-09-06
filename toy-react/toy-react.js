// 用一个symbol来私有化
const RENDER_TO_DOM = Symbol("render to dom")


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
    get vdom() {
        return this.render().vdom;
    }
    // get vchildren() {
    //     return this.children.map(child => child.vdom);
    // }
    // 私有的，range API是位置position
    [RENDER_TO_DOM](range) {
        this._range = range;
        this._vdom = this.vdom;
        // 递归
        this._vdom[RENDER_TO_DOM](range);
    }
    update() {
        let isSameNode = (oldNode, newNode) => {
            // 类型不同，短路
            if (oldNode.type !== newNode.type)
                return false;
            // 属性不同
            for (let name in newNode.props) {
                if (newNode.props[name] !== oldNode.props[name]) {
                    return false;
                }
            }
            // 属性数量不同
            if (Object.keys(oldNode.props).length > Object.keys(newNode.props.length)) {
                return false;
            }
            // 文本节点
            if (newNode.type === "#text") {
                if (newNode.content !== oldNode.content) {
                    return false;
                }
            }
            return true;
        }
        // 两棵树的对比
        let update = (oldNode, newNode) => {
            // diff算法
            //type, props,dhildren
            //#text content 
            if (!isSameNode(oldNode, newNode)) {
                newNode(RENDER_TO_DOM)(oldNode._range);
                return;
            }
            // newNode必须是element
            newNode._range = oldNode._range;

            let newChildren = newNode.vchildren;
            let oldChildren = oldNode.vchildren;
            if (!newChildren || !newChildren.length) {
                return;
            }


            let tailRange = oldChildren[oldChildren.length - 1]._range;


            for (let i = 0; i < newChildren.length; i++) {
                let newChild = newChildren[i];
                let oldChild = oldChildren[i];
                if (i < oldChild.length) {
                    update(oldChild, newChild);
                } else {
                    // TODO
                    let range = document.createRange();
                    range.setStart(tailRange.endContainer, tailRange.endOffset);
                    range.setEnd(tailRange.endContainer, tailRange.endOffset);
                    newChild(RENDER_TO_DOM)(range);
                    tailRange = range;
                }
            }
        }
        let vdom = this.vdom;
        update(this._vdom, vdom);
        this, this._vdom = vdom;
    }
    // 重新绘制的算法
    // rerender() {
    //     let oldRange = this._range;
    //     let range = document.createRange();
    //     range.setStart(oldRange.startContainer, oldRange.startOffset);
    //     range.setEnd(oldRange.startContainer, oldRange.startOffset);
    //     this[RENDER_TO_DOM](range);
    //     oldRange.setStart(range.endContainer, range.endOffset);
    //     oldRange.deleteContents();
    // }
    // 跟渲染相关，实现更新的话，不能进行root的更新
    // get root() {
    //     if (!this._root) {
    //         this._root = this.render().root;
    //     }
    //     return this._root;
    // }
    // 深拷贝的合并, 递归的形式去访问每一个对象和属性
    setState(newState) {
        if (this.state === null || typeof this.state !== "object") {
            this.state = newState;
            this.rerender();
            return;
        }
        let merge = function (oldState, newState) {
            for (let p in newState) {
                if (oldState[p] === null || typeof this.oldState[p] !== "object") {
                    oldState[p] = newState[p];
                } else {
                    merge(oldState[p], newState[p]);
                }
            }
        }
        merge(this.state, newState);
        this.update();
    }
}
// ElementWrapper对root的操作
class ElementWrapper extends Component {
    constructor(type) {
        super(type);
        this.type = type;
        this.root = document.createElement(type);
    }
    // setAttribute(name, value) {
    //     // 正则里 [\s\S] 表示所有的字符
    //     if (name.match(/^on([\s\S]+)$/)) {
    //         // 确保是小写字母开头的, 大小写敏感
    //         this.root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value);
    //     } else {
    //         if (name === "className") {
    //             this.root.setAttribute("class", value);
    //         } else {
    //             this.root.setAttribute(name, value);
    //         }
    //     }
    // }
    // appendChild(component) {
    //     let range = document.createRange();
    //     range.setStart(this.root, this.root.childNodes.length);
    //     range.setEnd(this.root, this.root.childNodes.length);
    //     component[RENDER_TO_DOM](range);
    // }
    // 虚拟dom
    get vdom() {
        this.vchildren = this.children.map(child => child.vdom);
        return this;
        // {
        //     type: this.type,
        //     props: this.props,
        //     children: this.children.map(child => child.vdom)
        // }
    }
    [RENDER_TO_DOM](range) {
        this._range = range;
        // range.deleteContents();
        let root = document.createElement(this.type);
        for (let name in this.props) {
            let value = this.props[name];
            if (name.match(/^on([\s\S]+)$/)) {
                // 确保是小写字母开头的, 大小写敏感
                root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value);
            } else {
                if (name === "className") {
                    root.setAttribute("class", value);
                } else {
                    root.setAttribute(name, value);
                }
            }
        }
        if (!this.vchildren)
            this.vchildren = this.children.map(child => child.vdom);

        for (let child of this.vchildren) {
            let childRange = document.createRange();
            childRange.setStart(root, root.childNodes.length);
            childRange.setEnd(root, root.childNodes.length);
            child[RENDER_TO_DOM](childRange);
        }

        replaceContent(range, root);
        range.insertNode(root);
    }
}
class TextWrapper extends Component {
    constructor(content) {
        super(content);
        this.type = "#text";
        this.content = content;
        // this.root = document.createTextNode(content);
    }
    get vdom() {
        return this;
        // {
        //     type: "#text",
        //     content: this.content
        // }
    }
    [RENDER_TO_DOM](range) {
        this._range = range;
        // range.deleteContents();
        // range.insertNode(this.root);
        let root = document.createTextNode(this.content);
        replaceContent(range, root);
    }
}

function replaceContent(range, node) {
    range.insertNode(node);
    range.setStartAfter(node);
    range.deleteContents();
    range.setStartbefore(node);
    range.setEndAfter(node);
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