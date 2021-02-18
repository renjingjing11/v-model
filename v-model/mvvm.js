/**
 * 大概工作流程：
 * sub1 定义Mvvm的类  把dom结构与data对象挂载实例上
 * sub2 initDom
 * sub3 创建文档对象碎片
 * sub4 通过循环childNodes 
 */




// sub9  Dep  class类
class Dep {
    constructor() {
        this.events = []
    }
    addWatcher(watcher) {
        this.events.push(watcher)
    }
}
const dep = new Dep()
Dep.target = null
/**
* 1.Wathcer:监听数据驱动视图
* 2.constructor(cbk,data,key):参数一-->回调函数里执行了 node.textContent=newVal  参数二-->页面data对象 参数三-->textContent
* 3.把Dep.target挂载到Watcher实例上
* 4.sendValue():这个方法是调用Wathcer实例上的this.cbk(this.init())
*/

//  sub7  Watcher class类
class Watcher {
    constructor(cbk, data, key) {
        this.cbk = cbk;
        this.data = data;
        this.key = key;
        this.init()

        // sub8   Dep的静态属性target可以使用Wathcer实例
        Dep.target = this;
    }
    init() {
        // 这步操作是在watcher这个实例挂载utils.getValue()方法
        this.value = utils.getValue(this.data, this.key)
        return this.value
    }
    sendValue() {
        this.cbk(this.init())
    }
}
class Observer {
    constructor(data) {
        /**
         * 1.判断data对象是否是对象 否：不往下执行 是：执行接下来的数据劫持
         */
        if (!data || typeof data !== 'object') {
            return
        }
        this.data = data
        this.init()
    }
    init() {
        Object.keys(this.data).forEach(val => {
            this.observer(this.data, val, this.data[val])
        })
    }
    observer(obj, key, value) {
        // 通过递归给每个属性的数据劫持
        new Observer(obj[key])
        Object.defineProperty(obj, key, {
            // 增加数据劫持的get方法
            get() {
                if (Dep.target) {
                    dep.addWatcher(Dep.target)
                }
                return value
            },
            // 增加数据劫持的set方法
            set(newValue) {
                value = newValue

                // 为兼容新值还是对象,所以还是给对象添加劫持
                new Observer(value)

                dep.events.forEach(item => {
                    item.sendValue()
                })
            }
        })
    }
}

/** 
 * utils的作用：页面显示默认值
 * getValue方法：
 * 参数一：data是页面的data对象
 * 参数二：key是对象的第一层key值
 * 判断key值是否包含'.'(若包含点[.]则表示是对象)
 * 
 * changeValue方法：
 * 参数一：data是页面的data对象
 * 参数二：key是对象的第一层key值
 * 参数三：触发input事件会出现你输入的新值
 * 判断key值是否包含'.'(若包含点[.]则表示是对象)
 * 
 */
const utils = {
    getValue(data, key) {
        if (key.indexOf(".") > -1) {
            // console.log(key) Msg.age
            let keys = key.split(".")

            // console.log(keys)  ['Msg','age']
            for (let i = 0; i < keys.length; i++) {
                data = data[keys[i]]
            }
            // console.log(data)  任明明
            return data
        } else {
            // console.log(data[key])  默认值
            return data[key]
        }
    },
    changeValue(data, key, newVal) {
        if (key.indexOf("." > -1)) {
            let keys = key.split(".")
            for (let i = 0; i < keys.length - 1; i++) {
                data = data[keys[i]]
            }
            data[keys[keys.length - 1]] = newVal
        } else {
            data[key] = newVal
        }
    }
}

// 实现数据双向绑定
class Mvvm {
    // 把dom节点 传来的对象 挂载到this上

    constructor({ el, data }) {

        // sub1  挂载到Mvvm实例上
        this.el = el
        this.data = data

        // 初始化执行数据绑定实例对象的过程
        this.init()

        // 替换文本中的属性为真实的数据56


        // sub2  创建文档对象碎片
        this.initDom()
    }
    init() {
        /** 
         * 1.Object.keys():返回对象的key值并且是用数组包裹起来的
         * 2.this.observer(观察者): this指整个对象  val指key值  this.data[val]指value值
         * 3.observer():观察对象并通过Object.defineProperty(obj:目标对象,key:需要定义或修改的属性的名字,value:目标属性所拥有的特性)
         *              get：得到(value)目标属性所拥有属性的特性  set：设置(value)目标属性所拥有属性的特性
         * */
        Object.keys(this.data).forEach(val => {
            this.observer(this, val, this.data[val])

            // 给当前数据进行数据劫持
            new Observer(this.data)
        })
    }
    observer(obj, key, value) {
        Object.defineProperty(obj, key, {
            get() {
                return value
            },
            set(newValue) {
                value = newValue
            }
        })
    }
    initDom() {
        // 获取dom节点
        this.$el = document.getElementById(this.el)

        // 文本碎片
        // sub3  创建文档对象碎片
        let newFargment = this.createFragment()

        // sub4  把data对象默认显示到页面上
        this.compiler(newFargment)

        // 为了解决dom结构消失的情况
        this.$el.appendChild(newFargment)
    }
    createFragment() {
        /** 
         * 1.创建文档对象片段
         * 2.声明一个变量
         * 3.判断声明的变量和页面dom节点是否一样(while返回值是 true||false)
         *   true:把节点添加到文档片段里(这样的话的是页面上的dom结构会消失)
         * 4.怎么让结构重新渲染出来?把文档对象片段重修添加到节点里(this.$el.appendChild(newFargment))
         * */
        let newFargment = document.createDocumentFragment()

        // console.dir(newFargment)
        let firstChild;
        while (firstChild = this.$el.firstChild) {
            // console.dir(this.$el.firstChild) // 打印的所有的节点(对象)  text：nodeType=3  input：nodeType=1
            newFargment.appendChild(firstChild)
        }
        return newFargment;
    }
    compiler(node) {
        /**  console.log(node) 打印了7个
         *   console.log(node.childNodes) NodeList(5) [text, input, text, div, text]
         *   console.log(attributes) NamedNodeMap {0: type, 1: v-model, type: type, v-model: v-model, length: 2}
         * 1.文档对象片段 #document.fragment 
         * 2.#text对象
         * 3.<input type="text" v-model="inpVal"> 
         * 4.#text文档
         * 5.<div>{{inpVal}}</div>
         * 6."{{inpVal}}"
         * 7."{{Msg.age}}"
         * 
         * nodeType为1时：
         *(1) attributes:获取input框上的html属性返回是对象(无顺序的节点列表)
         *(2) Array.from:把对象转换成数组并循环
         *(3) if(val.nodeName === "v-model"):判断val(type='text' v-model='inpVal').nodeName==='v-model'
         *(4) res:调用utils里的getValue方法(this.data,val,nodeValue)  参数一：页面data对象  参数二：inpVal-->v-model="inpVal" 
         *(5) node:绑定input事件  调用utils里的 changeValue(this.data-->页面data对象,val.nodeValue-->text inpVal,e.target.value-->触发input事件的返回值) 方法
         * 
         * nodeType为3时：
         *(1) textContent:截取完 '{{' 和 '}}'
         *(2) 判断textContent存在时才可以执行里面的代码
         * 
         * 判断node.childNodes(是个伪数组)是否存在 并且 判断数组的长度>0
         * 通过递归的形式保证每一级的文本被查找到并替换
         * */
        if (node.nodeType === 1) {
            let attributes = node.attributes
            Array.from(attributes).forEach(val => {
                // console.log(val) type="text" v-model="inpVal"
                // console.log(val.nodeName) type v-model
                // console.log(val.nodeValue)  text inpVal
                if (val.nodeName === "v-model") {
                    let res = utils.getValue(this.data, val.nodeValue)

                    // console.log(res) //默认值
                    node.value = res //这是默认让值显示到input里

                    // sub5  通过input事件改变input框的值
                    node.addEventListener("input", (e) => {

                        utils.changeValue(this.data, val.nodeValue, e.target.value)
                    })
                }
            })
        } else if (node.nodeType === 3) {
            // console.log(node.textContent) {{inpVal}} {{Msg.name}}
            let textContent = node.textContent.indexOf("{{") > -1 && node.textContent.split("{{")[1].split("}}")[0]

            // console.log(textContent) false(3个) inpVal Msg.name
            if (textContent) {
                // console.log(node.textContent)  {{inpVal}} {{Msg.name}}
                node.textContent = utils.getValue(this.data, textContent)

                // console.log(node.textContent)  默认值 任明明

                //监听页面是否变化
                // sub6  监听页面数据变化
                new Watcher((newVal) => {
                    node.textContent = newVal
                }, this.data, textContent)
            }
        }

        // sub4  通过循环所有的节点重新渲染到对应的结构里
        if (node.childNodes && node.childNodes.length > 0) {
            node.childNodes.forEach(val => {
                this.compiler(val)
            })
        }
    }
}
