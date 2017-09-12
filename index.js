const ClpNode = require('../clp-node')
const ClpPacket = require('clp-packet')
// const IlpPacket = require('ilp-packet')

function Cat (config) {
  this.handlers = {}
  this.node = new ClpNode(config.clp, (ws) => {
    this.ws = ws
    this.registerWebSocketMessageHandler()
  })
}

Cat.prototype = {
  send (obj) {
    this.ws.send(ClpPacket.serialize(obj))
    return Promise.resolve()
  },

  on (eventName, eventHandler) {
    if (!this.handlers[eventName]) {
      this.handlers[eventName] = []
    }
    this.handlers[eventName].push(eventHandler)
  },

  registerWebSocketMessageHandler () {
    this.ws.on('message', (buf) => {
      const obj = ClpPacket.deserialize(buf)
      console.log('cat handles message!', buf, obj)
      this.handlers['incoming'].map(handler => {
        handler(obj, obj)
      })
    })
  },

  start() {
    return this.node.start()
  },

  stop() {
    console.log('stopping cat node')
    return this.node.stop()
  }
}

module.exports = Cat
