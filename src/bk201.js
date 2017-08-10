var hasProto = '__proto__' in {};
var arrayKeys = Object.getOwnPropertyNames(arrayMethods);

// 观察者构造函数
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

// 观察数组的每一项
Observer.prototype.observeArray = function (items) {
  for (var i = 0, l = items.length; i < l; i++) {
    observe(items[i])
  }
}

// 将目标对象/数组的原型指针__proto__指向src
function protoAugment (target, src) {
  target.__proto__ = src
}

// 将具有变异方法挂在需要追踪的对象上
function copyAugment (target, src, keys) {
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i]
    def(target, key, src[key])
  }
}

// 递归调用，为对象绑定 getter/setter
Observer.prototpe.walk = function(obj){
	var keys = Object.keys(obj),
		_self = this;
	keys.forEach(function(v, i){
		_self.convert(keys[i], obj[keys[i]]);
	});
};

// 将属性转换为 getter/setter
Observer.prototype.convert = function(key, value){
	defineReactive(this.value, key, val);
};

// 创建数据观察者实例
function observe(value){
	// 当值不存在或者不是对象类型时，不需要继续深入监听
	if(!value || typeof value != 'object'){
		return;
	};
	return new Observer(value);
}

// 定义对象属性的 getter/setter
function defineReative(obj, key, val){
	var property = Object.getOwnPropertyDescriptor(obj, key);
	if(property && property.configurable === false){
		return;
	}

	// 保存对象属性预先定义的 getter/setter
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

var arrayProto = Array.prototype
var arrayMethods = Object.create(arrayProto)

function def(obj, key, val, enumerable) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  })
}

// 数组的变异方法
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
  // 缓存数组原始方法
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
