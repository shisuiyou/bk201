(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.BK = factory();
  }
})(this, function() {

const hasProto = '__proto__' in {};

function def(obj, key, val, enumerable) {
    Object.defineProperty(obj, key, {
        value: val,
        enumerable: !!enumerable,
        writable: true,
        configurable: true
    })
};

/**
 * 将类数组转换成数组
 *
 * @param {Array-like} list
 * @param {Number} [start] - start index
 * @return {Array}
 */
function toArray (list, start) {
    start = start || 0;
    var i = list.length - start;
    var ret = new Array(i);
  	while (i--) {
    	ret[i] = list[i + start];
  	}
  	return ret;
}

const arrayProto = Array.prototype;
const arrayMethods = Object.create(arrayProto);

/**
 * 数组的变异方法
 */
['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse']
.forEach(function (method) {
    // 缓存数组原始方法
    var original = arrayProto[method];
    def(arrayMethods, method, function mutator() {
        var i = arguments.length;
        var args = new Array(i);
        while (i--) {
            args[i] = arguments[i];
        };
        console.log('数组变动');
        return original.apply(this, args);
    });
});

const arrayKeys = Object.getOwnPropertyNames(arrayMethods);

/**
 * 观察者构造函数
 * 
 * @param {Array|Object} value
 * @constructor
 */
function Observer(value) {
    this.value = value;
    if (Array.isArray(value)) {
        var augment = hasProto ? protoAugment : copyAugment;
        augment(value, arrayMethods, arrayKeys);
        this.observeArray(value);
    } else {
        this.walk(value);
    }
}

/**
 * Augment an target Object or Array by intercepting
 * the prototype chain using __proto__
 *
 * @param {Object|Array} target
 * @param {Object} src
 */
function protoAugment(target, src) {
    target.__proto__ = src;
}

/**
 * Augment an target Object or Array by defining
 * hidden properties.
 *
 * @param {Object|Array} target
 * @param {Object} proto
 */
function copyAugment(target, src, keys) {
    for (var i = 0, l = keys.length; i < l; i++) {
        var key = keys[i];
        def(target, key, src[key]);
    }
}

/**
 * 递归调用，为对象绑定getter/setter
 * 
 * @param {Object} obj
 */
Observer.prototype.walk = function (obj) {
    var keys = Object.keys(obj);
    for (var i = 0, l = keys.length; i < l; i++) {
        this.convert(keys[i], obj[keys[i]]);
    }
}

/**
 * 观察数组的每一项
 *
 * @param {Array} items
 */
Observer.prototype.observeArray = function (items) {
    for (var i = 0, l = items.length; i < l; i++) {
        observe(items[i])
    }
}

/**
 * 将属性转换为getter/setter
 * 
 * @param {String} key
 * @param {*} val
 */
Observer.prototype.convert = function (key, val) {
    defineReactive(this.value, key, val)
}

/**
 * 创建数据观察者实例
 *
 * @param {*} value
 * @param {Bk} [bm]
 * @return {Observer|undefined}
 * @static
 */
function observe(value) {
    if (!value || typeof value !== 'object') {
        return
    }
    return new Observer(value)
}

/**
 * 定义对象属性的getter/setter
 *
 * @param {Object} obj
 * @param {String} key
 * @param {*} val
 */
function defineReactive(obj, key, val) {
    var dep = new Dep()

    var property = Object.getOwnPropertyDescriptor(obj, key)
    if (property && property.configurable === false) {
        return
    }

    // 保存对象属性预先定义的getter/setter
    var getter = property && property.get
    var setter = property && property.set

    var childOb = observe(val)
    Object.defineProperty(obj, key, {
        enumerable: true,
        configurable: true,
        get: function reactiveGetter() {
            let value = getter ? getter.call(obj) : val
            console.log("访问：" + key)
            if (Dep.target) {
                dep.depend();
            }
            return value
        },
        set: function reactiveSetter(newVal) {
            var value = getter ? getter.call(obj) : val
            if (newVal === value) {
                return
            }
            if (setter) {
                setter.call(obj, newVal)
            } else {
                val = newVal
            }
            childOb = observe(newVal)
            // 通知订阅者
            dep.notify()
            console.log('更新：' + key + ' = ' + newVal)
        }
    })
}

let uid = 0

function Dep() {
    this.id = uid++
    this.subs = []
}

Dep.target = null

/**
 * 添加一个订阅者
 *
 * @param {Directive} sub
 */
Dep.prototype.addSub = function (sub) {
    this.subs.push(sub)
}

/**
 * 移除一个订阅者
 *
 * @param {Directive} sub
 */
Dep.prototype.removeSub = function (sub) {
    let index = this.subs.indexOf(sub);
    if (index !== -1) {
        this.subs.splice(index, 1);
    }
}

/**
 * 将自身作为依赖添加到目标watcher
 */
Dep.prototype.depend = function () {
    Dep.target.addDep(this)
}

/**
 * 通知数据变更
 */
Dep.prototype.notify = function () {
    var subs = toArray(this.subs)
    // stablize the subscriber list first
    for (var i = 0, l = subs.length; i < l; i++) {
        // 执行订阅者的update更新函数
        subs[i].update()
    }
}

/**
 * 观察者对象
 *
 * @param {Bk} bm
 * @param {String|Function} expOrFn
 * @param {Function} cb
 * @constructor
 */

function Watcher(bm, expOrFn, cb) {
    this.bm = bm
    this.cb = cb
    this.depIds = {}
    if (typeof expOrFn === 'function') {
        this.getter = expOrFn
    } else {
        this.getter = this.parseExpression(expOrFn)
    }
    this.value = this.get()
}

/**
 * 收集依赖
 */

Watcher.prototype.get = function () {
    // 当前订阅者(Watcher)读取被订阅数据的最新更新后的值时，通知订阅者管理员收集当前订阅者
    Dep.target = this
    // 触发getter，将自身添加到dep中
    const value = this.getter.call(this.bm, this.bm)
    // 依赖收集完成，置空，用于下一个Watcher使用
    Dep.target = null
    return value
}

Watcher.prototype.addDep = function (dep) {
    if (!this.depIds.hasOwnProperty(dep.id)) {
        dep.addSub(this)
        this.depIds[dep.id] = dep
    }
}

/**
 * 依赖变动更新
 *
 * @param {Boolean} shallow
 */

Watcher.prototype.update = function () {
    this.run()
}

Watcher.prototype.run = function () {
    var value = this.get()
    if (value !== this.value) {
        var oldValue = this.value
        this.value = value
        // 将newVal, oldVal挂载到BK实例上
        this.cb.call(this.bm, value, oldValue)
    }
}

Watcher.prototype.parseExpression = function (exp) {
    if (/[^\w.$]/.test(exp)) {
        return
    }

    var exps = exp.split('.')
    
    return function(obj) {
        for (var i = 0, len = exps.length; i < len; i++) {
            if (!obj) return
            obj = obj[exps[i]]
        }
        return obj
    }
}

function Compile(el, value) {
    this.$bm = value
    this.$el = this.isElementNode(el) ? el : document.querySelector(el)
    if (this.$el) {
        this.compileElement(this.$el)
    }
}

Compile.prototype.compileElement = function (el) {
    let self = this
    let childNodes = el.childNodes

    ;[].slice.call(childNodes).forEach(node => {
        let text = node.textContent
        let reg = /\{\{((?:.|\n)+?)\}\}/
        // 处理element节点
        if (self.isElementNode(node)) {
            self.compile(node)
        } else if (self.isTextNode(node) && reg.test(text)) { // 处理text节点
            self.compileText(node, RegExp.$1.trim())
        }
        // 解析子节点包含的指令
        if (node.childNodes && node.childNodes.length) {
            self.compileElement(node)
        }
    })
}

Compile.prototype.compile = function (node) {
    let nodeAttrs = node.attributes
    let self = this

    ;[].slice.call(nodeAttrs).forEach(attr => {
        var attrName = attr.name
        if (self.isDirective(attrName)) {
            let exp = attr.value
            let dir = attrName.substring(2)
            if (self.isEventDirective(dir)) {
                compileUtil.eventHandler(node, self.$bm, exp, dir)
            } else {
                compileUtil[dir] && compileUtil[dir](node, self.$bm, exp)
            }
            node.removeAttribute(attrName)
        }
    });
}

Compile.prototype.compileText = function (node, exp) {
    compileUtil.text(node, this.$bm, exp);
}

Compile.prototype.isDirective = function (attr) {
    return attr.indexOf('v-') === 0
}

Compile.prototype.isEventDirective = function (dir) {
    return dir.indexOf('on') === 0;
}

Compile.prototype.isElementNode = function (node) {
    return node.nodeType === 1
}

Compile.prototype.isTextNode = function (node) {
    return node.nodeType === 3
}

// 指令处理集合
var compileUtil = {
    text: function (node, bm, exp) {
        this.bind(node, bm, exp, 'text')
    },
    html: function (node, bm, exp) {
        this.bind(node, bm, exp, 'html')
    },
    model: function (node, bm, exp) {
        this.bind(node, bm, exp, 'model')

        let self = this, val = this._getBMVal(bm, exp)
        node.addEventListener('input', function (e) {
            var newValue = e.target.value
            if (val === newValue) {
                return
            }
            self._setBMVal(bm, exp, newValue)
            val = newValue
        });
    },
    class: function (node, bm, exp) {
        this.bind(node, bm, exp, 'class')
    },
    bind: function (node, bm, exp, dir) {
        var updaterFn = updater[dir + 'Updater']
        updaterFn && updaterFn(node, this._getBMVal(bm, exp))
        new Watcher(bm, exp, function (value, oldValue) {
            updaterFn && updaterFn(node, value, oldValue)
        })
    },
    eventHandler: function (node, bm, exp, dir) {
        var eventType = dir.split(':')[1],
            fn = bm.$options.methods && bm.$options.methods[exp];

        if (eventType && fn) {
            node.addEventListener(eventType, fn.bind(bm), false);
        }
    },
    _getBMVal: function (bm, exp) {
        var val = bm
        exp = exp.split('.')
        exp.forEach(function (k) {
            val = val[k]
        })
        return val
    },
    _setBMVal: function (bm, exp, value) {
        var val = bm;
        exp = exp.split('.')
        exp.forEach(function (k, i) {
            // 非最后一个key，更新val的值
            if (i < exp.length - 1) {
                val = val[k]
            } else {
                val[k] = value
            }
        })
    }
}

var updater = {
    textUpdater: function (node, value) {
        node.textContent = typeof value == 'undefined' ? '' : value
    },
    htmlUpdater: function (node, value) {
        node.innerHTML = typeof value == 'undefined' ? '' : value
    },
    classUpdater: function (node, value, oldValue) {
        var className = node.className;
        className = className.replace(oldValue, '').replace(/\s$/, '')
        var space = className && String(value) ? ' ' : ''
        node.className = className + space + value
    },
    modelUpdater: function (node, value, oldValue) {
        node.value = typeof value == 'undefined' ? '' : value
    }
}


/**
 * @class 双向绑定类 BK
 * @param {[type]} options [description]
 */
function BK(options) {
    this.$options = options || {}
    // 简化了对data的处理
    let data = this._data = this.$options.data
    // 将所有data最外层属性代理到Bk实例上
    Object.keys(data).forEach(key => this._proxy(key))
    // 监听数据
    observe(data)
    new Compile(options.el || document.body, this)
}

BK.prototype.$watch = function (expOrFn, cb) {
    new Watcher(this, expOrFn, cb)
}

BK.prototype._proxy = function (key) {
    Object.defineProperty(this, key, {
        configurable: true,
        enumerable: true,
        get: () => this._data[key],
        set: (val) => {
            this._data[key] = val
        }
    })
}

return BK;

})

