import mitt from 'mitt';
import uuid from 'uuid-v4';
import fetch, { Response } from 'node-fetch';

if (!global.URL) global.URL = {};
if (!global.URL.$$objects) {
	global.URL.$$objects = new Map();
	global.URL.createObjectURL = blob => {
		let id = uuid();
		global.URL.$$objects[id] = blob;
		return `blob:http://localhost/${id}`;
	};


	try {
		var oldFetch = global.fetch || fetch__default;
		global.fetch = function (e, t) {
			return new Promise(function (t, o) {
				var n = new FileReader;
				n.onload = function () {
					var e = global.Response || fetch.Response;
					t(new e(n.result, {
						status: 200,
						statusText: "OK"
					}))
				}, n.onerror = function () {
					o(n.error)
				};
				var s = e.match(/[^/]+$/)[0];
				n.readAsText(global.URL.$$objects[s])
			})
		}
	} catch (err) { }

}

if (!global.document) {
	global.document = {};
}

function Event(type) { this.type = type; }
Event.prototype.initEvent = Object;
if (!global.document.createEvent) {
	global.document.createEvent = function (type) {
		let Ctor = global[type] || Event;
		return new Ctor(type);
	};
}


global.Worker = function Worker(url) {
	let messageQueue = [],
		inside = mitt(),
		outside = mitt(),
		scope = {
			onmessage: null,
			dispatchEvent: inside.emit,
			addEventListener: inside.on,
			removeEventListener: inside.off,
			postMessage(data) {
				outside.emit('message', { data });
			},
			fetch: global.fetch,
			importScripts(...urls) { }
		},
		getScopeVar;
	inside.on('message', e => { let f = getScopeVar('onmessage'); if (f) f.call(scope, e); });
	this.addEventListener = outside.on;
	this.removeEventListener = outside.off;
	this.dispatchEvent = outside.emit;
	outside.on('message', e => { this.onmessage && this.onmessage(e); });
	this.postMessage = data => {
		if (messageQueue != null) messageQueue.push(data);
		else inside.emit('message', { data });
	};
	this.terminate = () => {
		throw Error('Not Supported');
	};
	global.fetch(url)
		.then(r => r.text())
		.then(code => {
			let vars = 'var self=this,global=self';
			for (let k in scope) vars += `,${k}=self.${k}`;
			getScopeVar = eval('(function() {' + vars + ';\n' + code + '\nreturn function(__){return eval(__)}})').call(scope);
			let q = messageQueue;
			messageQueue = null;
			q.forEach(this.postMessage);
		})
		.catch(e => { });
};
