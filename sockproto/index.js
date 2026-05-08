var EventEmitter = require('events');
const net = require('net');

class SockProto extends EventEmitter {
	/*
	* Create SockProto
	*
	* @param {options} the input 
	*
	*/
	constructor(options,callback) {
		super();
		this._sock = null;
		this._type = 'client';
		this._callback = callback;
		if (options !== undefined) {
			if (options.sock !== undefined) {
				this._sock = sock;
			}

			if (options.port !== undefined && options.server !== null) {
				this._sock = net.CreateServer((sock1) => {
					sock1.bufferSize = 1024;
					nsock = new SockProto({						
						sock : sock1
					});
					this.emit('accept',nsock);
				});
				this._sock.listen(options.port,(err) => {
					if (err !== null && err !== undefined) {
						if (this._callback !== undefined && this._callback !== null) {
							this._callback(err);
						}
						return;
					}
				});
			}
		}
	}
}