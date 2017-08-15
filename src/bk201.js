var hasProto = '__proto__' in {};
var arrayKeys = Object.getOwnPropertyNames(arrayMethods);
var arrayProto = Array.prototype;
var arrayMethods = Object.create(arrayProto);
function Observer(value){
	this.value = value;
	if (Array.isArray(value)) {
	    var augment = hasProto
	      ? protoAugment
	      : copyAugment
	    augment(value, arrayMethods, arrayKeys)
	    this.observeArray(value)
	  } else {
	    this.walk(value)
	  }
};

Observer.prototype.observeArray = function (items) {
  for (var i = 0, l = items.length; i < l; i++) {
    observe(items[i])
  }
}

function protoAugment (target, src) {
  target.__proto__ = src
}

function copyAugment (target, src, keys) {
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i]
    def(target, key, src[key])
  }
}

Observer.prototpe.walk = function(obj){
	var keys = Object.keys(obj),
		_self = this;
	keys.forEach(function(v, i){
		_self.convert(keys[i], obj[keys[i]]);
	});
};

Observer.prototype.convert = function(key, value){
	defineReactive(this.value, key, val);
};

function observe(value){
	if(!value || typeof value != 'object'){
		return;
	};
	return new Observer(value);
}

function defineReative(obj, key, val){
	var property = Object.getOwnPropertyDescriptor(obj, key);
	if(property && property.configurable === false){
		return;
	}

	var getter = property && property.get;
	var setter = property && property.set;

	var childOb = observe(val);
	Object.defineProperty(obj, key, {
		enumerable: true,
		configurable: true,
		get: function reactiveGetter(){
			var value = getter ? getter.call(obj) : val;
			console.log('访问：' + key);
			return value;
		},
		set: function reactiveSetter(newVal){
			var value = getter ? getter ? getter.call(obj) : val;
			if(new === value){
				return ;
			}
			if(setter){
				setter.call(obj, newVal)
			} else {
				val = newVal;
			}
			childOb = observe(newVal);
			console.log('更新：' + key + '=' + newVal);
		}
	})
}

function def(obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  })
}

;[
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]
.forEach(function (method) {
  var original = arrayProto[method]
  def(arrayMethods, method, function mutator () {
    var i = arguments.length
    var args = new Array(i)
    while (i--) {
      args[i] = arguments[i]
    }
    console.log('数组变动')
    return original.apply(this, args)
  })
})

/**
 * 观察者对象
 */
function Watcher(vm, expOrFn, cb) {
    this.vm = vm
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
    const value = this.getter.call(this.vm, this.vm)
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
        // 将newVal, oldVal挂载到MVVM实例上
        this.cb.call(this.vm, value, oldValue)
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
