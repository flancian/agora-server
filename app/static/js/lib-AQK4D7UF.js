import {
  __commonJS,
  __require
} from "./chunk-MBB4SMMY.js";

// node_modules/audio-loader/lib/base64.js
var require_base64 = __commonJS({
  "node_modules/audio-loader/lib/base64.js"(exports, module) {
    "use strict";
    function b64ToUint6(nChr) {
      return nChr > 64 && nChr < 91 ? nChr - 65 : nChr > 96 && nChr < 123 ? nChr - 71 : nChr > 47 && nChr < 58 ? nChr + 4 : nChr === 43 ? 62 : nChr === 47 ? 63 : 0;
    }
    function decode(sBase64, nBlocksSize) {
      var sB64Enc = sBase64.replace(/[^A-Za-z0-9\+\/]/g, "");
      var nInLen = sB64Enc.length;
      var nOutLen = nBlocksSize ? Math.ceil((nInLen * 3 + 1 >> 2) / nBlocksSize) * nBlocksSize : nInLen * 3 + 1 >> 2;
      var taBytes = new Uint8Array(nOutLen);
      for (var nMod3, nMod4, nUint24 = 0, nOutIdx = 0, nInIdx = 0; nInIdx < nInLen; nInIdx++) {
        nMod4 = nInIdx & 3;
        nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << 18 - 6 * nMod4;
        if (nMod4 === 3 || nInLen - nInIdx === 1) {
          for (nMod3 = 0; nMod3 < 3 && nOutIdx < nOutLen; nMod3++, nOutIdx++) {
            taBytes[nOutIdx] = nUint24 >>> (16 >>> nMod3 & 24) & 255;
          }
          nUint24 = 0;
        }
      }
      return taBytes;
    }
    module.exports = { decode };
  }
});

// node_modules/audio-loader/lib/fetch.js
var require_fetch = __commonJS({
  "node_modules/audio-loader/lib/fetch.js"(exports, module) {
    "use strict";
    module.exports = function(url, type) {
      return new Promise(function(done, reject) {
        var req = new XMLHttpRequest();
        if (type)
          req.responseType = type;
        req.open("GET", url);
        req.onload = function() {
          req.status === 200 ? done(req.response) : reject(Error(req.statusText));
        };
        req.onerror = function() {
          reject(Error("Network Error"));
        };
        req.send();
      });
    };
  }
});

// node_modules/audio-loader/lib/index.js
var require_lib = __commonJS({
  "node_modules/audio-loader/lib/index.js"(exports, module) {
    "use strict";
    var base64 = require_base64();
    var fetch = require_fetch();
    function fromRegex(r) {
      return function(o) {
        return typeof o === "string" && r.test(o);
      };
    }
    function prefix(pre, name) {
      return typeof pre === "string" ? pre + name : typeof pre === "function" ? pre(name) : name;
    }
    function load(ac, source, options, defVal) {
      var loader = isArrayBuffer(source) ? loadArrayBuffer : isAudioFileName(source) ? loadAudioFile : isPromise(source) ? loadPromise : isArray(source) ? loadArrayData : isObject(source) ? loadObjectData : isJsonFileName(source) ? loadJsonFile : isBase64Audio(source) ? loadBase64Audio : isJsFileName(source) ? loadMidiJSFile : null;
      var opts = options || {};
      return loader ? loader(ac, source, opts) : defVal ? Promise.resolve(defVal) : Promise.reject("Source not valid (" + source + ")");
    }
    load.fetch = fetch;
    function isArrayBuffer(o) {
      return o instanceof ArrayBuffer;
    }
    function loadArrayBuffer(ac, array, options) {
      return new Promise(function(done, reject) {
        ac.decodeAudioData(array, function(buffer) {
          done(buffer);
        }, function() {
          reject("Can't decode audio data (" + array.slice(0, 30) + "...)");
        });
      });
    }
    var isAudioFileName = fromRegex(/\.(mp3|wav|ogg)(\?.*)?$/i);
    function loadAudioFile(ac, name, options) {
      var url = prefix(options.from, name);
      return load(ac, load.fetch(url, "arraybuffer"), options);
    }
    function isPromise(o) {
      return o && typeof o.then === "function";
    }
    function loadPromise(ac, promise, options) {
      return promise.then(function(value) {
        return load(ac, value, options);
      });
    }
    var isArray = Array.isArray;
    function loadArrayData(ac, array, options) {
      return Promise.all(array.map(function(data) {
        return load(ac, data, options, data);
      }));
    }
    function isObject(o) {
      return o && typeof o === "object";
    }
    function loadObjectData(ac, obj, options) {
      var dest = {};
      var promises = Object.keys(obj).map(function(key) {
        if (options.only && options.only.indexOf(key) === -1)
          return null;
        var value = obj[key];
        return load(ac, value, options, value).then(function(audio) {
          dest[key] = audio;
        });
      });
      return Promise.all(promises).then(function() {
        return dest;
      });
    }
    var isJsonFileName = fromRegex(/\.json(\?.*)?$/i);
    function loadJsonFile(ac, name, options) {
      var url = prefix(options.from, name);
      return load(ac, load.fetch(url, "text").then(JSON.parse), options);
    }
    var isBase64Audio = fromRegex(/^data:audio/);
    function loadBase64Audio(ac, source, options) {
      var i = source.indexOf(",");
      return load(ac, base64.decode(source.slice(i + 1)).buffer, options);
    }
    var isJsFileName = fromRegex(/\.js(\?.*)?$/i);
    function loadMidiJSFile(ac, name, options) {
      var url = prefix(options.from, name);
      return load(ac, load.fetch(url, "text").then(midiJsToJson), options);
    }
    function midiJsToJson(data) {
      var begin = data.indexOf("MIDI.Soundfont.");
      if (begin < 0)
        throw Error("Invalid MIDI.js Soundfont format");
      begin = data.indexOf("=", begin) + 2;
      var end = data.lastIndexOf(",");
      return JSON.parse(data.slice(begin, end) + "}");
    }
    if (typeof module === "object" && module.exports)
      module.exports = load;
    if (typeof window !== "undefined")
      window.loadAudio = load;
  }
});

// node_modules/adsr/index.js
var require_adsr = __commonJS({
  "node_modules/adsr/index.js"(exports, module) {
    module.exports = ADSR;
    function ADSR(audioContext) {
      var node = audioContext.createGain();
      var voltage = node._voltage = getVoltage(audioContext);
      var value = scale(voltage);
      var startValue = scale(voltage);
      var endValue = scale(voltage);
      node._startAmount = scale(startValue);
      node._endAmount = scale(endValue);
      node._multiplier = scale(value);
      node._multiplier.connect(node);
      node._startAmount.connect(node);
      node._endAmount.connect(node);
      node.value = value.gain;
      node.startValue = startValue.gain;
      node.endValue = endValue.gain;
      node.startValue.value = 0;
      node.endValue.value = 0;
      Object.defineProperties(node, props);
      return node;
    }
    var props = {
      attack: { value: 0, writable: true },
      decay: { value: 0, writable: true },
      sustain: { value: 1, writable: true },
      release: { value: 0, writable: true },
      getReleaseDuration: {
        value: function() {
          return this.release;
        }
      },
      start: {
        value: function(at) {
          var target = this._multiplier.gain;
          var startAmount = this._startAmount.gain;
          var endAmount = this._endAmount.gain;
          this._voltage.start(at);
          this._decayFrom = this._decayFrom = at + this.attack;
          this._startedAt = at;
          var sustain = this.sustain;
          target.cancelScheduledValues(at);
          startAmount.cancelScheduledValues(at);
          endAmount.cancelScheduledValues(at);
          endAmount.setValueAtTime(0, at);
          if (this.attack) {
            target.setValueAtTime(0, at);
            target.linearRampToValueAtTime(1, at + this.attack);
            startAmount.setValueAtTime(1, at);
            startAmount.linearRampToValueAtTime(0, at + this.attack);
          } else {
            target.setValueAtTime(1, at);
            startAmount.setValueAtTime(0, at);
          }
          if (this.decay) {
            target.setTargetAtTime(sustain, this._decayFrom, getTimeConstant(this.decay));
          }
        }
      },
      stop: {
        value: function(at, isTarget) {
          if (isTarget) {
            at = at - this.release;
          }
          var endTime = at + this.release;
          if (this.release) {
            var target = this._multiplier.gain;
            var startAmount = this._startAmount.gain;
            var endAmount = this._endAmount.gain;
            target.cancelScheduledValues(at);
            startAmount.cancelScheduledValues(at);
            endAmount.cancelScheduledValues(at);
            var expFalloff = getTimeConstant(this.release);
            if (this.attack && at < this._decayFrom) {
              var valueAtTime = getValue(0, 1, this._startedAt, this._decayFrom, at);
              target.linearRampToValueAtTime(valueAtTime, at);
              startAmount.linearRampToValueAtTime(1 - valueAtTime, at);
              startAmount.setTargetAtTime(0, at, expFalloff);
            }
            endAmount.setTargetAtTime(1, at, expFalloff);
            target.setTargetAtTime(0, at, expFalloff);
          }
          this._voltage.stop(endTime);
          return endTime;
        }
      },
      onended: {
        get: function() {
          return this._voltage.onended;
        },
        set: function(value) {
          this._voltage.onended = value;
        }
      }
    };
    var flat = new Float32Array([1, 1]);
    function getVoltage(context) {
      var voltage = context.createBufferSource();
      var buffer = context.createBuffer(1, 2, context.sampleRate);
      buffer.getChannelData(0).set(flat);
      voltage.buffer = buffer;
      voltage.loop = true;
      return voltage;
    }
    function scale(node) {
      var gain = node.context.createGain();
      node.connect(gain);
      return gain;
    }
    function getTimeConstant(time) {
      return Math.log(time + 1) / Math.log(100);
    }
    function getValue(start, end, fromTime, toTime, at) {
      var difference = end - start;
      var time = toTime - fromTime;
      var truncateTime = at - fromTime;
      var phase = truncateTime / time;
      var value = start + phase * difference;
      if (value <= start) {
        value = start;
      }
      if (value >= end) {
        value = end;
      }
      return value;
    }
  }
});

// node_modules/sample-player/lib/player.js
var require_player = __commonJS({
  "node_modules/sample-player/lib/player.js"(exports, module) {
    "use strict";
    var ADSR = require_adsr();
    var EMPTY = {};
    var DEFAULTS = {
      gain: 1,
      attack: 0.01,
      decay: 0.1,
      sustain: 0.9,
      release: 0.3,
      loop: false,
      cents: 0,
      loopStart: 0,
      loopEnd: 0
    };
    function SamplePlayer(ac, source, options) {
      var connected = false;
      var nextId = 0;
      var tracked = {};
      var out = ac.createGain();
      out.gain.value = 1;
      var opts = Object.assign({}, DEFAULTS, options);
      var player = { context: ac, out, opts };
      if (source instanceof AudioBuffer)
        player.buffer = source;
      else
        player.buffers = source;
      player.start = function(name, when, options2) {
        if (player.buffer && name !== null)
          return player.start(null, name, when);
        var buffer = name ? player.buffers[name] : player.buffer;
        if (!buffer) {
          console.warn("Buffer " + name + " not found.");
          return;
        } else if (!connected) {
          console.warn("SamplePlayer not connected to any node.");
          return;
        }
        var opts2 = options2 || EMPTY;
        when = Math.max(ac.currentTime, when || 0);
        player.emit("start", when, name, opts2);
        var node = createNode(name, buffer, opts2);
        node.id = track(name, node);
        node.env.start(when);
        node.source.start(when);
        player.emit("started", when, node.id, node);
        if (opts2.duration)
          node.stop(when + opts2.duration);
        return node;
      };
      player.play = function(name, when, options2) {
        return player.start(name, when, options2);
      };
      player.stop = function(when, ids) {
        var node;
        ids = ids || Object.keys(tracked);
        return ids.map(function(id) {
          node = tracked[id];
          if (!node)
            return null;
          node.stop(when);
          return node.id;
        });
      };
      player.connect = function(dest) {
        connected = true;
        out.connect(dest);
        return player;
      };
      player.emit = function(event, when, obj, opts2) {
        if (player.onevent)
          player.onevent(event, when, obj, opts2);
        var fn = player["on" + event];
        if (fn)
          fn(when, obj, opts2);
      };
      return player;
      function track(name, node) {
        node.id = nextId++;
        tracked[node.id] = node;
        node.source.onended = function() {
          var now = ac.currentTime;
          node.source.disconnect();
          node.env.disconnect();
          node.disconnect();
          player.emit("ended", now, node.id, node);
        };
        return node.id;
      }
      function createNode(name, buffer, options2) {
        var node = ac.createGain();
        node.gain.value = 0;
        node.connect(out);
        node.env = envelope(ac, options2, opts);
        node.env.connect(node.gain);
        node.source = ac.createBufferSource();
        node.source.buffer = buffer;
        node.source.connect(node);
        node.source.loop = options2.loop || opts.loop;
        node.source.playbackRate.value = centsToRate(options2.cents || opts.cents);
        node.source.loopStart = options2.loopStart || opts.loopStart;
        node.source.loopEnd = options2.loopEnd || opts.loopEnd;
        node.stop = function(when) {
          var time = when || ac.currentTime;
          player.emit("stop", time, name);
          var stopAt = node.env.stop(time);
          node.source.stop(stopAt);
        };
        return node;
      }
    }
    function isNum(x) {
      return typeof x === "number";
    }
    var PARAMS = ["attack", "decay", "sustain", "release"];
    function envelope(ac, options, opts) {
      var env = ADSR(ac);
      var adsr = options.adsr || opts.adsr;
      PARAMS.forEach(function(name, i) {
        if (adsr)
          env[name] = adsr[i];
        else
          env[name] = options[name] || opts[name];
      });
      env.value.value = isNum(options.gain) ? options.gain : isNum(opts.gain) ? opts.gain : 1;
      return env;
    }
    function centsToRate(cents) {
      return cents ? Math.pow(2, cents / 1200) : 1;
    }
    module.exports = SamplePlayer;
  }
});

// node_modules/sample-player/lib/events.js
var require_events = __commonJS({
  "node_modules/sample-player/lib/events.js"(exports, module) {
    module.exports = function(player) {
      player.on = function(event, cb) {
        if (arguments.length === 1 && typeof event === "function")
          return player.on("event", event);
        var prop = "on" + event;
        var old = player[prop];
        player[prop] = old ? chain(old, cb) : cb;
        return player;
      };
      return player;
    };
    function chain(fn1, fn2) {
      return function(a, b, c, d) {
        fn1(a, b, c, d);
        fn2(a, b, c, d);
      };
    }
  }
});

// node_modules/sample-player/node_modules/note-parser/index.js
var require_note_parser = __commonJS({
  "node_modules/sample-player/node_modules/note-parser/index.js"(exports, module) {
    "use strict";
    var REGEX = /^([a-gA-G])(#{1,}|b{1,}|x{1,}|)(-?\d*)\s*(.*)\s*$/;
    function regex() {
      return REGEX;
    }
    var SEMITONES = [0, 2, 4, 5, 7, 9, 11];
    function parse(str, isTonic, tuning) {
      if (typeof str !== "string")
        return null;
      var m = REGEX.exec(str);
      if (!m || !isTonic && m[4])
        return null;
      var p = { letter: m[1].toUpperCase(), acc: m[2].replace(/x/g, "##") };
      p.pc = p.letter + p.acc;
      p.step = (p.letter.charCodeAt(0) + 3) % 7;
      p.alt = p.acc[0] === "b" ? -p.acc.length : p.acc.length;
      p.chroma = SEMITONES[p.step] + p.alt;
      if (m[3]) {
        p.oct = +m[3];
        p.midi = p.chroma + 12 * (p.oct + 1);
        p.freq = midiToFreq(p.midi, tuning);
      }
      if (isTonic)
        p.tonicOf = m[4];
      return p;
    }
    function midiToFreq(midi, tuning) {
      return Math.pow(2, (midi - 69) / 12) * (tuning || 440);
    }
    var parser = { parse, regex, midiToFreq };
    var FNS = ["letter", "acc", "pc", "step", "alt", "chroma", "oct", "midi", "freq"];
    FNS.forEach(function(name) {
      parser[name] = function(src) {
        var p = parse(src);
        return p && typeof p[name] !== "undefined" ? p[name] : null;
      };
    });
    module.exports = parser;
  }
});

// node_modules/sample-player/lib/notes.js
var require_notes = __commonJS({
  "node_modules/sample-player/lib/notes.js"(exports, module) {
    "use strict";
    var note = require_note_parser();
    var isMidi = function(n) {
      return n !== null && n !== [] && n >= 0 && n < 129;
    };
    var toMidi = function(n) {
      return isMidi(n) ? +n : note.midi(n);
    };
    module.exports = function(player) {
      if (player.buffers) {
        var map = player.opts.map;
        var toKey = typeof map === "function" ? map : toMidi;
        var mapper = function(name) {
          return name ? toKey(name) || name : null;
        };
        player.buffers = mapBuffers(player.buffers, mapper);
        var start = player.start;
        player.start = function(name, when, options) {
          var key = mapper(name);
          var dec = key % 1;
          if (dec) {
            key = Math.floor(key);
            options = Object.assign(options || {}, { cents: Math.floor(dec * 100) });
          }
          return start(key, when, options);
        };
      }
      return player;
    };
    function mapBuffers(buffers, toKey) {
      return Object.keys(buffers).reduce(function(mapped, name) {
        mapped[toKey(name)] = buffers[name];
        return mapped;
      }, {});
    }
  }
});

// node_modules/sample-player/lib/scheduler.js
var require_scheduler = __commonJS({
  "node_modules/sample-player/lib/scheduler.js"(exports, module) {
    "use strict";
    var isArr = Array.isArray;
    var isObj = function(o) {
      return o && typeof o === "object";
    };
    var OPTS = {};
    module.exports = function(player) {
      player.schedule = function(time, events) {
        var now = player.context.currentTime;
        var when = time < now ? now : time;
        player.emit("schedule", when, events);
        var t, o, note, opts;
        return events.map(function(event) {
          if (!event)
            return null;
          else if (isArr(event)) {
            t = event[0];
            o = event[1];
          } else {
            t = event.time;
            o = event;
          }
          if (isObj(o)) {
            note = o.name || o.key || o.note || o.midi || null;
            opts = o;
          } else {
            note = o;
            opts = OPTS;
          }
          return player.start(note, when + (t || 0), opts);
        });
      };
      return player;
    };
  }
});

// node_modules/midimessage/dist/index.min.js
var require_index_min = __commonJS({
  "node_modules/midimessage/dist/index.min.js"(exports, module) {
    (function(e) {
      if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = e();
      } else if (typeof define === "function" && define.amd) {
        define([], e);
      } else {
        var t;
        if (typeof window !== "undefined") {
          t = window;
        } else if (typeof global !== "undefined") {
          t = global;
        } else if (typeof self !== "undefined") {
          t = self;
        } else {
          t = this;
        }
        t.midimessage = e();
      }
    })(function() {
      var e, t, s;
      return function o(e2, t2, s2) {
        function a(n2, i) {
          if (!t2[n2]) {
            if (!e2[n2]) {
              var l = typeof __require == "function" && __require;
              if (!i && l)
                return l(n2, true);
              if (r)
                return r(n2, true);
              var h = new Error("Cannot find module '" + n2 + "'");
              throw h.code = "MODULE_NOT_FOUND", h;
            }
            var c = t2[n2] = { exports: {} };
            e2[n2][0].call(c.exports, function(t3) {
              var s3 = e2[n2][1][t3];
              return a(s3 ? s3 : t3);
            }, c, c.exports, o, e2, t2, s2);
          }
          return t2[n2].exports;
        }
        var r = typeof __require == "function" && __require;
        for (var n = 0; n < s2.length; n++)
          a(s2[n]);
        return a;
      }({ 1: [function(e2, t2, s2) {
        "use strict";
        Object.defineProperty(s2, "__esModule", { value: true });
        s2["default"] = function(e3) {
          function t3(e4) {
            this._event = e4;
            this._data = e4.data;
            this.receivedTime = e4.receivedTime;
            if (this._data && this._data.length < 2) {
              console.warn("Illegal MIDI message of length", this._data.length);
              return;
            }
            this._messageCode = e4.data[0] & 240;
            this.channel = e4.data[0] & 15;
            switch (this._messageCode) {
              case 128:
                this.messageType = "noteoff";
                this.key = e4.data[1] & 127;
                this.velocity = e4.data[2] & 127;
                break;
              case 144:
                this.messageType = "noteon";
                this.key = e4.data[1] & 127;
                this.velocity = e4.data[2] & 127;
                break;
              case 160:
                this.messageType = "keypressure";
                this.key = e4.data[1] & 127;
                this.pressure = e4.data[2] & 127;
                break;
              case 176:
                this.messageType = "controlchange";
                this.controllerNumber = e4.data[1] & 127;
                this.controllerValue = e4.data[2] & 127;
                if (this.controllerNumber === 120 && this.controllerValue === 0) {
                  this.channelModeMessage = "allsoundoff";
                } else if (this.controllerNumber === 121) {
                  this.channelModeMessage = "resetallcontrollers";
                } else if (this.controllerNumber === 122) {
                  if (this.controllerValue === 0) {
                    this.channelModeMessage = "localcontroloff";
                  } else {
                    this.channelModeMessage = "localcontrolon";
                  }
                } else if (this.controllerNumber === 123 && this.controllerValue === 0) {
                  this.channelModeMessage = "allnotesoff";
                } else if (this.controllerNumber === 124 && this.controllerValue === 0) {
                  this.channelModeMessage = "omnimodeoff";
                } else if (this.controllerNumber === 125 && this.controllerValue === 0) {
                  this.channelModeMessage = "omnimodeon";
                } else if (this.controllerNumber === 126) {
                  this.channelModeMessage = "monomodeon";
                } else if (this.controllerNumber === 127) {
                  this.channelModeMessage = "polymodeon";
                }
                break;
              case 192:
                this.messageType = "programchange";
                this.program = e4.data[1];
                break;
              case 208:
                this.messageType = "channelpressure";
                this.pressure = e4.data[1] & 127;
                break;
              case 224:
                this.messageType = "pitchbendchange";
                var t4 = e4.data[2] & 127;
                var s3 = e4.data[1] & 127;
                this.pitchBend = (t4 << 8) + s3;
                break;
            }
          }
          return new t3(e3);
        };
        t2.exports = s2["default"];
      }, {}] }, {}, [1])(1);
    });
  }
});

// node_modules/sample-player/lib/midi.js
var require_midi = __commonJS({
  "node_modules/sample-player/lib/midi.js"(exports, module) {
    var midimessage = require_index_min();
    module.exports = function(player) {
      player.listenToMidi = function(input, options) {
        var started = {};
        var opts = options || {};
        var gain = opts.gain || function(vel) {
          return vel / 127;
        };
        input.onmidimessage = function(msg) {
          var mm = msg.messageType ? msg : midimessage(msg);
          if (mm.messageType === "noteon" && mm.velocity === 0) {
            mm.messageType = "noteoff";
          }
          if (opts.channel && mm.channel !== opts.channel)
            return;
          switch (mm.messageType) {
            case "noteon":
              started[mm.key] = player.play(mm.key, 0, { gain: gain(mm.velocity) });
              break;
            case "noteoff":
              if (started[mm.key]) {
                started[mm.key].stop();
                delete started[mm.key];
              }
              break;
          }
        };
        return player;
      };
      return player;
    };
  }
});

// node_modules/sample-player/lib/index.js
var require_lib2 = __commonJS({
  "node_modules/sample-player/lib/index.js"(exports, module) {
    "use strict";
    var player = require_player();
    var events = require_events();
    var notes = require_notes();
    var scheduler = require_scheduler();
    var midi = require_midi();
    function SamplePlayer(ac, source, options) {
      return midi(scheduler(notes(events(player(ac, source, options)))));
    }
    if (typeof module === "object" && module.exports)
      module.exports = SamplePlayer;
    if (typeof window !== "undefined")
      window.SamplePlayer = SamplePlayer;
  }
});

// node_modules/note-parser/dist/note-parser.js
var require_note_parser2 = __commonJS({
  "node_modules/note-parser/dist/note-parser.js"(exports, module) {
    !function(t, n) {
      "object" == typeof exports && "undefined" != typeof module ? n(exports) : "function" == typeof define && define.amd ? define(["exports"], n) : n(t.NoteParser = t.NoteParser || {});
    }(exports, function(t) {
      "use strict";
      function n(t2, n2) {
        return Array(n2 + 1).join(t2);
      }
      function r(t2) {
        return "number" == typeof t2;
      }
      function e(t2) {
        return "string" == typeof t2;
      }
      function u(t2) {
        return void 0 !== t2;
      }
      function c(t2, n2) {
        return Math.pow(2, (t2 - 69) / 12) * (n2 || 440);
      }
      function o() {
        return b;
      }
      function i(t2, n2, r2) {
        if ("string" != typeof t2)
          return null;
        var e2 = b.exec(t2);
        if (!e2 || !n2 && e2[4])
          return null;
        var u2 = { letter: e2[1].toUpperCase(), acc: e2[2].replace(/x/g, "##") };
        u2.pc = u2.letter + u2.acc, u2.step = (u2.letter.charCodeAt(0) + 3) % 7, u2.alt = "b" === u2.acc[0] ? -u2.acc.length : u2.acc.length;
        var o2 = A[u2.step] + u2.alt;
        return u2.chroma = o2 < 0 ? 12 + o2 : o2 % 12, e2[3] && (u2.oct = +e2[3], u2.midi = o2 + 12 * (u2.oct + 1), u2.freq = c(u2.midi, r2)), n2 && (u2.tonicOf = e2[4]), u2;
      }
      function f(t2) {
        return r(t2) ? t2 < 0 ? n("b", -t2) : n("#", t2) : "";
      }
      function a(t2) {
        return r(t2) ? "" + t2 : "";
      }
      function l(t2, n2, r2) {
        return null === t2 || void 0 === t2 ? null : t2.step ? l(t2.step, t2.alt, t2.oct) : t2 < 0 || t2 > 6 ? null : C.charAt(t2) + f(n2) + a(r2);
      }
      function p(t2) {
        if ((r(t2) || e(t2)) && t2 >= 0 && t2 < 128)
          return +t2;
        var n2 = i(t2);
        return n2 && u(n2.midi) ? n2.midi : null;
      }
      function s(t2, n2) {
        var r2 = p(t2);
        return null === r2 ? null : c(r2, n2);
      }
      function d(t2) {
        return (i(t2) || {}).letter;
      }
      function m(t2) {
        return (i(t2) || {}).acc;
      }
      function h(t2) {
        return (i(t2) || {}).pc;
      }
      function v(t2) {
        return (i(t2) || {}).step;
      }
      function g(t2) {
        return (i(t2) || {}).alt;
      }
      function x(t2) {
        return (i(t2) || {}).chroma;
      }
      function y(t2) {
        return (i(t2) || {}).oct;
      }
      var b = /^([a-gA-G])(#{1,}|b{1,}|x{1,}|)(-?\d*)\s*(.*)\s*$/, A = [0, 2, 4, 5, 7, 9, 11], C = "CDEFGAB";
      t.regex = o, t.parse = i, t.build = l, t.midi = p, t.freq = s, t.letter = d, t.acc = m, t.pc = h, t.step = v, t.alt = g, t.chroma = x, t.oct = y;
    });
  }
});

// node_modules/soundfont-player/lib/legacy.js
var require_legacy = __commonJS({
  "node_modules/soundfont-player/lib/legacy.js"(exports, module) {
    "use strict";
    var parser = require_note_parser2();
    function Soundfont(ctx, nameToUrl) {
      console.warn("new Soundfont() is deprected");
      console.log("Please use Soundfont.instrument() instead of new Soundfont().instrument()");
      if (!(this instanceof Soundfont))
        return new Soundfont(ctx);
      this.nameToUrl = nameToUrl || Soundfont.nameToUrl;
      this.ctx = ctx;
      this.instruments = {};
      this.promises = [];
    }
    Soundfont.prototype.onready = function(callback) {
      console.warn("deprecated API");
      console.log("Please use Promise.all(Soundfont.instrument(), Soundfont.instrument()).then() instead of new Soundfont().onready()");
      Promise.all(this.promises).then(callback);
    };
    Soundfont.prototype.instrument = function(name, options) {
      console.warn("new Soundfont().instrument() is deprecated.");
      console.log("Please use Soundfont.instrument() instead.");
      var ctx = this.ctx;
      name = name || "default";
      if (name in this.instruments)
        return this.instruments[name];
      var inst = { name, play: oscillatorPlayer(ctx, options) };
      this.instruments[name] = inst;
      if (name !== "default") {
        var promise = Soundfont.instrument(ctx, name, options).then(function(instrument) {
          inst.play = instrument.play;
          return inst;
        });
        this.promises.push(promise);
        inst.onready = function(cb) {
          console.warn("onready is deprecated. Use Soundfont.instrument().then()");
          promise.then(cb);
        };
      } else {
        inst.onready = function(cb) {
          console.warn("onready is deprecated. Use Soundfont.instrument().then()");
          cb();
        };
      }
      return inst;
    };
    function loadBuffers(ac, name, options) {
      console.warn("Soundfont.loadBuffers is deprecate.");
      console.log("Use Soundfont.instrument(..) and get buffers properties from the result.");
      return Soundfont.instrument(ac, name, options).then(function(inst) {
        return inst.buffers;
      });
    }
    Soundfont.loadBuffers = loadBuffers;
    function oscillatorPlayer(ctx, defaultOptions) {
      defaultOptions = defaultOptions || {};
      return function(note, time, duration, options) {
        console.warn("The oscillator player is deprecated.");
        console.log("Starting with version 0.9.0 you will have to wait until the soundfont is loaded to play sounds.");
        var midi = note > 0 && note < 129 ? +note : parser.midi(note);
        var freq = midi ? parser.midiToFreq(midi, 440) : null;
        if (!freq)
          return;
        duration = duration || 0.2;
        options = options || {};
        var destination = options.destination || defaultOptions.destination || ctx.destination;
        var vcoType = options.vcoType || defaultOptions.vcoType || "sine";
        var gain = options.gain || defaultOptions.gain || 0.4;
        var vco = ctx.createOscillator();
        vco.type = vcoType;
        vco.frequency.value = freq;
        var vca = ctx.createGain();
        vca.gain.value = gain;
        vco.connect(vca);
        vca.connect(destination);
        vco.start(time);
        if (duration > 0)
          vco.stop(time + duration);
        return vco;
      };
    }
    Soundfont.noteToMidi = parser.midi;
    module.exports = Soundfont;
  }
});

// node_modules/soundfont-player/lib/index.js
var require_lib3 = __commonJS({
  "node_modules/soundfont-player/lib/index.js"(exports, module) {
    var load = require_lib();
    var player = require_lib2();
    function instrument(ac, name, options) {
      if (arguments.length === 1)
        return function(n, o) {
          return instrument(ac, n, o);
        };
      var opts = options || {};
      var isUrl = opts.isSoundfontURL || isSoundfontURL;
      var toUrl = opts.nameToUrl || nameToUrl;
      var url = isUrl(name) ? name : toUrl(name, opts.soundfont, opts.format);
      return load(ac, url, { only: opts.only || opts.notes }).then(function(buffers) {
        var p = player(ac, buffers, opts).connect(opts.destination ? opts.destination : ac.destination);
        p.url = url;
        p.name = name;
        return p;
      });
    }
    function isSoundfontURL(name) {
      return /\.js(\?.*)?$/i.test(name);
    }
    function nameToUrl(name, sf, format) {
      format = format === "ogg" ? format : "mp3";
      sf = sf === "FluidR3_GM" ? sf : "MusyngKite";
      return "https://gleitz.github.io/midi-js-soundfonts/" + sf + "/" + name + "-" + format + ".js";
    }
    var Soundfont = require_legacy();
    Soundfont.instrument = instrument;
    Soundfont.nameToUrl = nameToUrl;
    if (typeof module === "object" && module.exports)
      module.exports = Soundfont;
    if (typeof window !== "undefined")
      window.Soundfont = Soundfont;
  }
});
export default require_lib3();
