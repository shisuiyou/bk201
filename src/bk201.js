var hasProto = '__proto__' in {};
var arrayProto = Array.prototype;
var arrayMethods = Object.create(arrayProto);
var arrayKeys = Object.getOwnPropertyNames(arrayMethods);
function Observer(value){
	this.value = value;
	if (Array.isArray(value)) {
	    var augment = hasProto
	      ? protoAugment
	      : copyAugment
	    augment(value, arrayMethods, arrayKeys);
	    this.observeArray(value);
	  } else {
	    this.walk(value);
	  }
};

Observer.prototype.observeArray = function (items) {
  for (var i = 0, l = items.length; i < l; i++) {
    observe(items[i]);
  }
}

function protoAugment (target, src) {
  target.__proto__ = src;
}

function copyAugment (target, src, keys) {
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    def(target, key, src[key]);
  }
}

Observer.prototype.walk = function(obj){
	var keys = Object.keys(obj),
		_self = this;
	keys.forEach(function(v, i){
		_self.convert(keys[i], obj[keys[i]]);
	});
};

Observer.prototype.convert = function(key, val){
	defineReactive(this.value, key, val);
};

function observe(value){
	if(!value || typeof value != 'object'){
		return;
	};
	return new Observer(value);
}

function defineReactive(obj, key, val){
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
			var value = getter ? getter.call(obj) : val;
			if(newVal === value){
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

;['push','pop','shift','unshift','splice','sort','reverse'].forEach(function (method) {
	var original = arrayProto[method];
	def(arrayMethods, method, function mutator () {
		var i = arguments.length;
		var args = new Array(i);
		while (i--) {
		  args[i] = arguments[i];
		}
		console.log('数组变动');
		return original.apply(this, args);
	})
});

function Watcher(vm, expOrFn, cb) {
    this.vm = vm;
    this.cb = cb;
    this.depIds = {};
    if (typeof expOrFn === 'function') {
        this.getter = expOrFn;
    } else {
        this.getter = this.parseExpression(expOrFn);
    }
    this.value = this.get();
};

Watcher.prototype.get = function () {
    Dep.target = this;
    var value = this.getter.call(this.vm, this.vm);
    Dep.target = null;
    return value;
};

Watcher.prototype.addDep = function (dep) {
    if (!this.depIds.hasOwnProperty(dep.id)) {
        dep.addSub(this);
        this.depIds[dep.id] = dep;
    };
};

Watcher.prototype.update = function () {
    this.run()
}

Watcher.prototype.run = function () {
    var value = this.get();
    if (value !== this.value) {
        var oldValue = this.value;
        this.value = value;
        this.cb.call(this.vm, value, oldValue);
    };
};

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

var uid = 0;

function Dep() {
    this.id = uid++;
    this.subs = [];
}

Dep.target = null;

Dep.prototype.addSub = function (sub) {
    this.subs.push(sub);
}

Dep.prototype.removeSub = function (sub) {
    var index = this.subs.indexOf(sub);
    if (index !== -1) {
        this.subs.splice(index, 1);
    }
}

Dep.prototype.depend = function () {
    Dep.target.addDep(this);
}

Dep.prototype.notify = function () {
    var subs = toArray(this.subs);
    for (var i = 0, l = subs.length; i < l; i++) {
        subs[i].update();
    }
}
