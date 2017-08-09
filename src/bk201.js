// 观察者构造函数
function Observer(value){
	this.value = value;
	this.walk(value);
};

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