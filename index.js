var chaconEmitter = require('./chaconEmitter');
var Service;
var Characteristic;
var noInitDone = true;

module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-rpi-chacon", "Chacon", ChaconAccessory);
}

function ChaconAccessory(log, config) {
  this.log          = log;
  this.deviceId     = config['deviceId'];
  this.emitterId    = config['emitterId'];
  this.isDimmable   = config['dimmable'];
  this.isInverted   = config['invert']
  if (noInitDone) {
    chaconEmitter.init();
    noInitDone = false;
  }
}

ChaconAccessory.prototype = {
  setPowerState: function(powerOn, callback) {
    var that = this;
    var order = chaconEmitter.buildOrder(this.emitterId, this.deviceId, this.isInverted == "true" ? !powerOn : powerOn);
    chaconEmitter.transmit(order);
    callback(null);
  },
  
  setBrightness: function(level, callback) {
    var that = this;
    var order = chaconEmitter.buildDimOrder(this.emitterId, this.deviceId, level);
    chaconEmitter.transmit(order, true);
    callback(null);
  },
  
  getServices: function() {
    var switchService = new Service.Switch(this.name);
    var lightBulb = new Service.Lightbulb(this.name);
    
    switchService
      .getCharacteristic(Characteristic.On)
      .on('set', this.setPowerState.bind(this));
    if(this.isInverted == "true") {
      switchService.setCharacteristic(Characteristic.On, true)
    }
    lightBulb
      .getCharacteristic(Characteristic.On)
      .on('set', this.setPowerState.bind(this));
    lightBulb
      .getCharacteristic(Characteristic.Brightness)
      .on('set', this.setBrightness.bind(this))
    if (this.isDimmable === "true") {
      return [lightBulb];
    }
    else {
      return [switchService];
    }
  }
}

module.exports.accessory = ChaconAccessory;