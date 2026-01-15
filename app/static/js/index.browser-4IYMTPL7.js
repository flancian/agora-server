import {
  __esm
} from "./chunk-MBB4SMMY.js";

// node_modules/midi-player-js/build/index.browser.js
function _typeof(obj) {
  "@babel/helpers - typeof";
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function(obj2) {
      return typeof obj2;
    };
  } else {
    _typeof = function(obj2) {
      return obj2 && typeof Symbol === "function" && obj2.constructor === Symbol && obj2 !== Symbol.prototype ? "symbol" : typeof obj2;
    };
  }
  return _typeof(obj);
}
function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}
function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor)
      descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}
function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps)
    _defineProperties(Constructor.prototype, protoProps);
  if (staticProps)
    _defineProperties(Constructor, staticProps);
  return Constructor;
}
var Constants, allNotes, counter, _loop, i, Utils, Track, Player, index;
var init_index_browser = __esm({
  "node_modules/midi-player-js/build/index.browser.js"() {
    Constants = {
      VERSION: "2.0.16",
      NOTES: [],
      HEADER_CHUNK_LENGTH: 14,
      CIRCLE_OF_FOURTHS: ["C", "F", "Bb", "Eb", "Ab", "Db", "Gb", "Cb", "Fb", "Bbb", "Ebb", "Abb"],
      CIRCLE_OF_FIFTHS: ["C", "G", "D", "A", "E", "B", "F#", "C#", "G#", "D#", "A#", "E#"]
    };
    allNotes = [["C"], ["C#", "Db"], ["D"], ["D#", "Eb"], ["E"], ["F"], ["F#", "Gb"], ["G"], ["G#", "Ab"], ["A"], ["A#", "Bb"], ["B"]];
    counter = 0;
    _loop = function _loop2(i) {
      allNotes.forEach(function(noteGroup) {
        noteGroup.forEach(function(note) {
          return Constants.NOTES[counter] = note + i;
        });
        counter++;
      });
    };
    for (i = -1; i <= 9; i++) {
      _loop(i);
    }
    Utils = /* @__PURE__ */ function() {
      function Utils2() {
        _classCallCheck(this, Utils2);
      }
      _createClass(Utils2, null, [{
        key: "byteToHex",
        value: function byteToHex(_byte) {
          return ("0" + _byte.toString(16)).slice(-2);
        }
      }, {
        key: "bytesToHex",
        value: function bytesToHex(byteArray) {
          var hex = [];
          byteArray.forEach(function(_byte2) {
            return hex.push(Utils2.byteToHex(_byte2));
          });
          return hex.join("");
        }
      }, {
        key: "hexToNumber",
        value: function hexToNumber(hexString) {
          return parseInt(hexString, 16);
        }
      }, {
        key: "bytesToNumber",
        value: function bytesToNumber(byteArray) {
          return Utils2.hexToNumber(Utils2.bytesToHex(byteArray));
        }
      }, {
        key: "bytesToLetters",
        value: function bytesToLetters(byteArray) {
          var letters = [];
          byteArray.forEach(function(_byte3) {
            return letters.push(String.fromCharCode(_byte3));
          });
          return letters.join("");
        }
      }, {
        key: "decToBinary",
        value: function decToBinary(dec) {
          return (dec >>> 0).toString(2);
        }
      }, {
        key: "getVarIntLength",
        value: function getVarIntLength(byteArray) {
          var currentByte = byteArray[0];
          var byteCount = 1;
          while (currentByte >= 128) {
            currentByte = byteArray[byteCount];
            byteCount++;
          }
          return byteCount;
        }
      }, {
        key: "readVarInt",
        value: function readVarInt(byteArray) {
          var result = 0;
          byteArray.forEach(function(number) {
            var b = number;
            if (b & 128) {
              result += b & 127;
              result <<= 7;
            } else {
              result += b;
            }
          });
          return result;
        }
      }, {
        key: "atob",
        value: function(_atob) {
          function atob2(_x) {
            return _atob.apply(this, arguments);
          }
          atob2.toString = function() {
            return _atob.toString();
          };
          return atob2;
        }(function(string) {
          if (typeof atob === "function")
            return atob(string);
          return Buffer.from(string, "base64").toString("binary");
        })
      }]);
      return Utils2;
    }();
    Track = /* @__PURE__ */ function() {
      function Track2(index2, data) {
        _classCallCheck(this, Track2);
        this.enabled = true;
        this.eventIndex = 0;
        this.pointer = 0;
        this.lastTick = 0;
        this.lastStatus = null;
        this.index = index2;
        this.data = data;
        this.delta = 0;
        this.runningDelta = 0;
        this.events = [];
        var lastThreeBytes = this.data.subarray(this.data.length - 3, this.data.length);
        if (!(lastThreeBytes[0] === 255 && lastThreeBytes[1] === 47 && lastThreeBytes[2] === 0)) {
          throw "Invalid MIDI file; Last three bytes of track " + this.index + "must be FF 2F 00 to mark end of track";
        }
      }
      _createClass(Track2, [{
        key: "reset",
        value: function reset() {
          this.enabled = true;
          this.eventIndex = 0;
          this.pointer = 0;
          this.lastTick = 0;
          this.lastStatus = null;
          this.delta = 0;
          this.runningDelta = 0;
          return this;
        }
      }, {
        key: "enable",
        value: function enable() {
          this.enabled = true;
          return this;
        }
      }, {
        key: "disable",
        value: function disable() {
          this.enabled = false;
          return this;
        }
      }, {
        key: "setEventIndexByTick",
        value: function setEventIndexByTick(tick) {
          tick = tick || 0;
          for (var i in this.events) {
            if (this.events[i].tick >= tick) {
              this.eventIndex = i;
              return this;
            }
          }
        }
      }, {
        key: "getCurrentByte",
        value: function getCurrentByte() {
          return this.data[this.pointer];
        }
      }, {
        key: "getDeltaByteCount",
        value: function getDeltaByteCount() {
          return Utils.getVarIntLength(this.data.subarray(this.pointer));
        }
      }, {
        key: "getDelta",
        value: function getDelta() {
          return Utils.readVarInt(this.data.subarray(this.pointer, this.pointer + this.getDeltaByteCount()));
        }
      }, {
        key: "handleEvent",
        value: function handleEvent(currentTick, dryRun) {
          dryRun = dryRun || false;
          if (dryRun) {
            var elapsedTicks = currentTick - this.lastTick;
            var delta = this.getDelta();
            var eventReady = elapsedTicks >= delta;
            if (this.pointer < this.data.length && (dryRun || eventReady)) {
              var _event = this.parseEvent();
              if (this.enabled)
                return _event;
            }
          } else {
            if (this.events[this.eventIndex] && this.events[this.eventIndex].tick <= currentTick) {
              this.eventIndex++;
              if (this.enabled)
                return this.events[this.eventIndex - 1];
            }
          }
          return null;
        }
      }, {
        key: "getStringData",
        value: function getStringData(eventStartIndex) {
          var varIntLength = Utils.getVarIntLength(this.data.subarray(eventStartIndex + 2));
          var varIntValue = Utils.readVarInt(this.data.subarray(eventStartIndex + 2, eventStartIndex + 2 + varIntLength));
          var letters = Utils.bytesToLetters(this.data.subarray(eventStartIndex + 2 + varIntLength, eventStartIndex + 2 + varIntLength + varIntValue));
          return letters;
        }
      }, {
        key: "parseEvent",
        value: function parseEvent() {
          var eventStartIndex = this.pointer + this.getDeltaByteCount();
          var eventJson = {};
          var deltaByteCount = this.getDeltaByteCount();
          eventJson.track = this.index + 1;
          eventJson.delta = this.getDelta();
          this.lastTick = this.lastTick + eventJson.delta;
          this.runningDelta += eventJson.delta;
          eventJson.tick = this.runningDelta;
          eventJson.byteIndex = this.pointer;
          if (this.data[eventStartIndex] == 255) {
            switch (this.data[eventStartIndex + 1]) {
              case 0:
                eventJson.name = "Sequence Number";
                break;
              case 1:
                eventJson.name = "Text Event";
                eventJson.string = this.getStringData(eventStartIndex);
                break;
              case 2:
                eventJson.name = "Copyright Notice";
                break;
              case 3:
                eventJson.name = "Sequence/Track Name";
                eventJson.string = this.getStringData(eventStartIndex);
                break;
              case 4:
                eventJson.name = "Instrument Name";
                eventJson.string = this.getStringData(eventStartIndex);
                break;
              case 5:
                eventJson.name = "Lyric";
                eventJson.string = this.getStringData(eventStartIndex);
                break;
              case 6:
                eventJson.name = "Marker";
                break;
              case 7:
                eventJson.name = "Cue Point";
                eventJson.string = this.getStringData(eventStartIndex);
                break;
              case 9:
                eventJson.name = "Device Name";
                eventJson.string = this.getStringData(eventStartIndex);
                break;
              case 32:
                eventJson.name = "MIDI Channel Prefix";
                break;
              case 33:
                eventJson.name = "MIDI Port";
                eventJson.data = Utils.bytesToNumber([this.data[eventStartIndex + 3]]);
                break;
              case 47:
                eventJson.name = "End of Track";
                break;
              case 81:
                eventJson.name = "Set Tempo";
                eventJson.data = Math.round(6e7 / Utils.bytesToNumber(this.data.subarray(eventStartIndex + 3, eventStartIndex + 6)));
                this.tempo = eventJson.data;
                break;
              case 84:
                eventJson.name = "SMTPE Offset";
                break;
              case 88:
                eventJson.name = "Time Signature";
                eventJson.data = this.data.subarray(eventStartIndex + 3, eventStartIndex + 7);
                eventJson.timeSignature = "" + eventJson.data[0] + "/" + Math.pow(2, eventJson.data[1]);
                break;
              case 89:
                eventJson.name = "Key Signature";
                eventJson.data = this.data.subarray(eventStartIndex + 3, eventStartIndex + 5);
                if (eventJson.data[0] >= 0) {
                  eventJson.keySignature = Constants.CIRCLE_OF_FIFTHS[eventJson.data[0]];
                } else if (eventJson.data[0] < 0) {
                  eventJson.keySignature = Constants.CIRCLE_OF_FOURTHS[Math.abs(eventJson.data[0])];
                }
                if (eventJson.data[1] == 0) {
                  eventJson.keySignature += " Major";
                } else if (eventJson.data[1] == 1) {
                  eventJson.keySignature += " Minor";
                }
                break;
              case 127:
                eventJson.name = "Sequencer-Specific Meta-event";
                break;
              default:
                eventJson.name = "Unknown: " + this.data[eventStartIndex + 1].toString(16);
                break;
            }
            var varIntLength = Utils.getVarIntLength(this.data.subarray(eventStartIndex + 2));
            var length = Utils.readVarInt(this.data.subarray(eventStartIndex + 2, eventStartIndex + 2 + varIntLength));
            this.pointer += deltaByteCount + 3 + length;
          } else if (this.data[eventStartIndex] === 240) {
            eventJson.name = "Sysex";
            var varQuantityByteLength = Utils.getVarIntLength(this.data.subarray(eventStartIndex + 1));
            var varQuantityByteValue = Utils.readVarInt(this.data.subarray(eventStartIndex + 1, eventStartIndex + 1 + varQuantityByteLength));
            eventJson.data = this.data.subarray(eventStartIndex + 1 + varQuantityByteLength, eventStartIndex + 1 + varQuantityByteLength + varQuantityByteValue);
            this.pointer += deltaByteCount + 1 + varQuantityByteLength + varQuantityByteValue;
          } else if (this.data[eventStartIndex] === 247) {
            eventJson.name = "Sysex (escape)";
            var _varQuantityByteLength = Utils.getVarIntLength(this.data.subarray(eventStartIndex + 1));
            var _varQuantityByteValue = Utils.readVarInt(this.data.subarray(eventStartIndex + 1, eventStartIndex + 1 + _varQuantityByteLength));
            eventJson.data = this.data.subarray(eventStartIndex + 1 + _varQuantityByteLength, eventStartIndex + 1 + _varQuantityByteLength + _varQuantityByteValue);
            this.pointer += deltaByteCount + 1 + _varQuantityByteLength + _varQuantityByteValue;
          } else {
            if (this.data[eventStartIndex] < 128) {
              eventJson.running = true;
              eventJson.noteNumber = this.data[eventStartIndex];
              eventJson.noteName = Constants.NOTES[this.data[eventStartIndex]];
              eventJson.velocity = this.data[eventStartIndex + 1];
              if (this.lastStatus <= 143) {
                eventJson.name = "Note off";
                eventJson.channel = this.lastStatus - 128 + 1;
                this.pointer += deltaByteCount + 2;
              } else if (this.lastStatus <= 159) {
                eventJson.name = "Note on";
                eventJson.channel = this.lastStatus - 144 + 1;
                this.pointer += deltaByteCount + 2;
              } else if (this.lastStatus <= 175) {
                eventJson.name = "Polyphonic Key Pressure";
                eventJson.channel = this.lastStatus - 160 + 1;
                eventJson.note = Constants.NOTES[this.data[eventStartIndex + 1]];
                eventJson.pressure = event[1];
                this.pointer += deltaByteCount + 2;
              } else if (this.lastStatus <= 191) {
                eventJson.name = "Controller Change";
                eventJson.channel = this.lastStatus - 176 + 1;
                eventJson.number = this.data[eventStartIndex + 1];
                eventJson.value = this.data[eventStartIndex + 2];
                this.pointer += deltaByteCount + 2;
              } else if (this.lastStatus <= 207) {
                eventJson.name = "Program Change";
                eventJson.channel = this.lastStatus - 192 + 1;
                eventJson.value = this.data[eventStartIndex + 1];
                this.pointer += deltaByteCount + 1;
              } else if (this.lastStatus <= 223) {
                eventJson.name = "Channel Key Pressure";
                eventJson.channel = this.lastStatus - 208 + 1;
                this.pointer += deltaByteCount + 1;
              } else if (this.lastStatus <= 239) {
                eventJson.name = "Pitch Bend";
                eventJson.channel = this.lastStatus - 224 + 1;
                eventJson.value = this.data[eventStartIndex + 2];
                this.pointer += deltaByteCount + 2;
              } else {
                throw "Unknown event (running): ".concat(this.lastStatus);
              }
            } else {
              this.lastStatus = this.data[eventStartIndex];
              if (this.data[eventStartIndex] <= 143) {
                eventJson.name = "Note off";
                eventJson.channel = this.lastStatus - 128 + 1;
                eventJson.noteNumber = this.data[eventStartIndex + 1];
                eventJson.noteName = Constants.NOTES[this.data[eventStartIndex + 1]];
                eventJson.velocity = Math.round(this.data[eventStartIndex + 2] / 127 * 100);
                this.pointer += deltaByteCount + 3;
              } else if (this.data[eventStartIndex] <= 159) {
                eventJson.name = "Note on";
                eventJson.channel = this.lastStatus - 144 + 1;
                eventJson.noteNumber = this.data[eventStartIndex + 1];
                eventJson.noteName = Constants.NOTES[this.data[eventStartIndex + 1]];
                eventJson.velocity = Math.round(this.data[eventStartIndex + 2] / 127 * 100);
                this.pointer += deltaByteCount + 3;
              } else if (this.data[eventStartIndex] <= 175) {
                eventJson.name = "Polyphonic Key Pressure";
                eventJson.channel = this.lastStatus - 160 + 1;
                eventJson.note = Constants.NOTES[this.data[eventStartIndex + 1]];
                eventJson.pressure = event[2];
                this.pointer += deltaByteCount + 3;
              } else if (this.data[eventStartIndex] <= 191) {
                eventJson.name = "Controller Change";
                eventJson.channel = this.lastStatus - 176 + 1;
                eventJson.number = this.data[eventStartIndex + 1];
                eventJson.value = this.data[eventStartIndex + 2];
                this.pointer += deltaByteCount + 3;
              } else if (this.data[eventStartIndex] <= 207) {
                eventJson.name = "Program Change";
                eventJson.channel = this.lastStatus - 192 + 1;
                eventJson.value = this.data[eventStartIndex + 1];
                this.pointer += deltaByteCount + 2;
              } else if (this.data[eventStartIndex] <= 223) {
                eventJson.name = "Channel Key Pressure";
                eventJson.channel = this.lastStatus - 208 + 1;
                this.pointer += deltaByteCount + 2;
              } else if (this.data[eventStartIndex] <= 239) {
                eventJson.name = "Pitch Bend";
                eventJson.channel = this.lastStatus - 224 + 1;
                this.pointer += deltaByteCount + 3;
              } else {
                throw "Unknown event: ".concat(this.data[eventStartIndex]);
              }
            }
          }
          this.delta += eventJson.delta;
          this.events.push(eventJson);
          return eventJson;
        }
      }, {
        key: "endOfTrack",
        value: function endOfTrack() {
          if (this.data[this.pointer + 1] == 255 && this.data[this.pointer + 2] == 47 && this.data[this.pointer + 3] == 0) {
            return true;
          }
          return false;
        }
      }]);
      return Track2;
    }();
    if (!Uint8Array.prototype.forEach) {
      Object.defineProperty(Uint8Array.prototype, "forEach", {
        value: Array.prototype.forEach
      });
    }
    Player = /* @__PURE__ */ function() {
      function Player2(eventHandler, buffer) {
        _classCallCheck(this, Player2);
        this.sampleRate = 5;
        this.startTime = 0;
        this.buffer = buffer || null;
        this.midiChunksByteLength = null;
        this.division;
        this.format;
        this.setIntervalId = false;
        this.tracks = [];
        this.instruments = [];
        this.defaultTempo = 120;
        this.tempo = null;
        this.startTick = 0;
        this.tick = 0;
        this.lastTick = null;
        this.inLoop = false;
        this.totalTicks = 0;
        this.events = [];
        this.totalEvents = 0;
        this.eventListeners = {};
        if (typeof eventHandler === "function")
          this.on("midiEvent", eventHandler);
      }
      _createClass(Player2, [{
        key: "loadFile",
        value: function loadFile(path) {
          {
            throw "loadFile is only supported on Node.js";
          }
        }
      }, {
        key: "loadArrayBuffer",
        value: function loadArrayBuffer(arrayBuffer) {
          this.buffer = new Uint8Array(arrayBuffer);
          return this.fileLoaded();
        }
      }, {
        key: "loadDataUri",
        value: function loadDataUri(dataUri) {
          var byteString = Utils.atob(dataUri.split(",")[1]);
          var ia = new Uint8Array(byteString.length);
          for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          this.buffer = ia;
          return this.fileLoaded();
        }
      }, {
        key: "getFilesize",
        value: function getFilesize() {
          return this.buffer ? this.buffer.length : 0;
        }
      }, {
        key: "fileLoaded",
        value: function fileLoaded() {
          if (!this.validate())
            throw "Invalid MIDI file; should start with MThd";
          return this.setTempo(this.defaultTempo).getDivision().getFormat().getTracks().dryRun();
        }
      }, {
        key: "validate",
        value: function validate() {
          return Utils.bytesToLetters(this.buffer.subarray(0, 4)) === "MThd";
        }
      }, {
        key: "getFormat",
        value: function getFormat() {
          this.format = Utils.bytesToNumber(this.buffer.subarray(8, 10));
          return this;
        }
      }, {
        key: "getTracks",
        value: function getTracks() {
          this.tracks = [];
          var trackOffset = 0;
          while (trackOffset < this.buffer.length) {
            if (Utils.bytesToLetters(this.buffer.subarray(trackOffset, trackOffset + 4)) == "MTrk") {
              var trackLength = Utils.bytesToNumber(this.buffer.subarray(trackOffset + 4, trackOffset + 8));
              this.tracks.push(new Track(this.tracks.length, this.buffer.subarray(trackOffset + 8, trackOffset + 8 + trackLength)));
            }
            trackOffset += Utils.bytesToNumber(this.buffer.subarray(trackOffset + 4, trackOffset + 8)) + 8;
          }
          var trackChunksByteLength = 0;
          this.tracks.forEach(function(track) {
            trackChunksByteLength += 8 + track.data.length;
          });
          this.midiChunksByteLength = Constants.HEADER_CHUNK_LENGTH + trackChunksByteLength;
          return this;
        }
      }, {
        key: "enableTrack",
        value: function enableTrack(trackNumber) {
          this.tracks[trackNumber - 1].enable();
          return this;
        }
      }, {
        key: "disableTrack",
        value: function disableTrack(trackNumber) {
          this.tracks[trackNumber - 1].disable();
          return this;
        }
      }, {
        key: "getDivision",
        value: function getDivision() {
          this.division = Utils.bytesToNumber(this.buffer.subarray(12, Constants.HEADER_CHUNK_LENGTH));
          return this;
        }
      }, {
        key: "playLoop",
        value: function playLoop(dryRun) {
          if (!this.inLoop) {
            this.inLoop = true;
            this.tick = this.getCurrentTick();
            this.tracks.forEach(function(track, index2) {
              if (!dryRun && this.endOfFile()) {
                this.triggerPlayerEvent("endOfFile");
                this.stop();
              } else {
                var event2 = track.handleEvent(this.tick, dryRun);
                if (dryRun && event2) {
                  if (event2.hasOwnProperty("name") && event2.name === "Set Tempo") {
                    this.defaultTempo = event2.data;
                    this.setTempo(event2.data);
                  }
                  if (event2.hasOwnProperty("name") && event2.name === "Program Change") {
                    if (!this.instruments.includes(event2.value)) {
                      this.instruments.push(event2.value);
                    }
                  }
                } else if (event2) {
                  if (event2.hasOwnProperty("name") && event2.name === "Set Tempo") {
                    this.setTempo(event2.data);
                    if (this.isPlaying()) {
                      this.pause().play();
                    }
                  }
                  this.emitEvent(event2);
                }
              }
            }, this);
            if (!dryRun)
              this.triggerPlayerEvent("playing", {
                tick: this.tick
              });
            this.inLoop = false;
          }
        }
      }, {
        key: "setTempo",
        value: function setTempo(tempo) {
          this.tempo = tempo;
          return this;
        }
      }, {
        key: "setStartTime",
        value: function setStartTime(startTime) {
          this.startTime = startTime;
          return this;
        }
      }, {
        key: "play",
        value: function play() {
          if (this.isPlaying())
            throw "Already playing...";
          if (!this.startTime)
            this.startTime = new Date().getTime();
          this.setIntervalId = setInterval(this.playLoop.bind(this), this.sampleRate);
          return this;
        }
      }, {
        key: "loop",
        value: function loop() {
          setTimeout(function() {
            this.playLoop();
            this.loop();
          }.bind(this), this.sampleRate);
        }
      }, {
        key: "pause",
        value: function pause() {
          clearInterval(this.setIntervalId);
          this.setIntervalId = false;
          this.startTick = this.tick;
          this.startTime = 0;
          return this;
        }
      }, {
        key: "stop",
        value: function stop() {
          clearInterval(this.setIntervalId);
          this.setIntervalId = false;
          this.startTick = 0;
          this.startTime = 0;
          this.resetTracks();
          return this;
        }
      }, {
        key: "skipToTick",
        value: function skipToTick(tick) {
          this.stop();
          this.startTick = tick;
          this.tracks.forEach(function(track) {
            track.setEventIndexByTick(tick);
          });
          return this;
        }
      }, {
        key: "skipToPercent",
        value: function skipToPercent(percent) {
          if (percent < 0 || percent > 100)
            throw "Percent must be number between 1 and 100.";
          this.skipToTick(Math.round(percent / 100 * this.totalTicks));
          return this;
        }
      }, {
        key: "skipToSeconds",
        value: function skipToSeconds(seconds) {
          var songTime = this.getSongTime();
          if (seconds < 0 || seconds > songTime)
            throw seconds + " seconds not within song time of " + songTime;
          this.skipToPercent(seconds / songTime * 100);
          return this;
        }
      }, {
        key: "isPlaying",
        value: function isPlaying() {
          return this.setIntervalId > 0 || _typeof(this.setIntervalId) === "object";
        }
      }, {
        key: "dryRun",
        value: function dryRun() {
          this.resetTracks();
          while (!this.endOfFile()) {
            this.playLoop(true);
          }
          this.events = this.getEvents();
          this.totalEvents = this.getTotalEvents();
          this.totalTicks = this.getTotalTicks();
          this.startTick = 0;
          this.startTime = 0;
          this.resetTracks();
          this.triggerPlayerEvent("fileLoaded", this);
          return this;
        }
      }, {
        key: "resetTracks",
        value: function resetTracks() {
          this.tracks.forEach(function(track) {
            return track.reset();
          });
          return this;
        }
      }, {
        key: "getEvents",
        value: function getEvents() {
          return this.tracks.map(function(track) {
            return track.events;
          });
        }
      }, {
        key: "getTotalTicks",
        value: function getTotalTicks() {
          return Math.max.apply(null, this.tracks.map(function(track) {
            return track.delta;
          }));
        }
      }, {
        key: "getTotalEvents",
        value: function getTotalEvents() {
          return this.tracks.reduce(function(a, b) {
            return {
              events: {
                length: a.events.length + b.events.length
              }
            };
          }, {
            events: {
              length: 0
            }
          }).events.length;
        }
      }, {
        key: "getSongTime",
        value: function getSongTime() {
          return this.totalTicks / this.division / this.tempo * 60;
        }
      }, {
        key: "getSongTimeRemaining",
        value: function getSongTimeRemaining() {
          return Math.round((this.totalTicks - this.getCurrentTick()) / this.division / this.tempo * 60);
        }
      }, {
        key: "getSongPercentRemaining",
        value: function getSongPercentRemaining() {
          return Math.round(this.getSongTimeRemaining() / this.getSongTime() * 100);
        }
      }, {
        key: "bytesProcessed",
        value: function bytesProcessed() {
          return Constants.HEADER_CHUNK_LENGTH + this.tracks.length * 8 + this.tracks.reduce(function(a, b) {
            return {
              pointer: a.pointer + b.pointer
            };
          }, {
            pointer: 0
          }).pointer;
        }
      }, {
        key: "eventsPlayed",
        value: function eventsPlayed() {
          return this.tracks.reduce(function(a, b) {
            return {
              eventIndex: a.eventIndex + b.eventIndex
            };
          }, {
            eventIndex: 0
          }).eventIndex;
        }
      }, {
        key: "endOfFile",
        value: function endOfFile() {
          if (this.isPlaying()) {
            return this.totalTicks - this.tick <= 0;
          }
          return this.bytesProcessed() >= this.midiChunksByteLength;
        }
      }, {
        key: "getCurrentTick",
        value: function getCurrentTick() {
          if (!this.startTime)
            return this.startTick;
          return Math.round((new Date().getTime() - this.startTime) / 1e3 * (this.division * (this.tempo / 60))) + this.startTick;
        }
      }, {
        key: "emitEvent",
        value: function emitEvent(event2) {
          this.triggerPlayerEvent("midiEvent", event2);
          return this;
        }
      }, {
        key: "on",
        value: function on(playerEvent, fn) {
          if (!this.eventListeners.hasOwnProperty(playerEvent))
            this.eventListeners[playerEvent] = [];
          this.eventListeners[playerEvent].push(fn);
          return this;
        }
      }, {
        key: "triggerPlayerEvent",
        value: function triggerPlayerEvent(playerEvent, data) {
          if (this.eventListeners.hasOwnProperty(playerEvent))
            this.eventListeners[playerEvent].forEach(function(fn) {
              return fn(data || {});
            });
          return this;
        }
      }]);
      return Player2;
    }();
    index = {
      Player,
      Utils,
      Constants
    };
  }
});
init_index_browser();
export {
  index as default
};
