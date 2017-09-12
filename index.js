const ClpNode = require('clp-node')
const ClpPacket = require('clp-packet')
// const IlpPacket = require('ilp-packet')

function protocolDataToEvalStr(arr) {
  const mimeStrMap = {
    0: 'ClpPacket.MIME_APPLICATION_OCTET_STRING',
    1: 'ClpPacket.MIME_TEXT_PLAIN_UTF8',
    2: 'ClpPacket.MIME_APPLICATION_JSON'
  }
  const strArr = arr.map(obj => {
    let byteStrArr = []
    if (obj.contentType === ClpPacket.MIME_APPLICATION_OCTET_STRING) {
      for (let i = 0; i < obj.data.length; i++) {
        byteStrArr.push(obj.data[i].toString())
      }
      dataStr = `new Buffer([ ${byteStrArr.join(', ')} ])`
    } else if (obj.contentType === ClpPacket.MIME_APPLICATION_OCTET_STRING) {
      dataStr = `JSON.stringify(${obj.data.toString('ascii')})`
    } else {
      dataStr = `'${obj.data.toString('ascii')}'`
    }
    return `{ protocolName: '${obj.protocolName}', contentType: ${mimeStrMap[obj.contentType]}, data: ${dataStr} }`
  })
  return `[ ${strArr.join(', ')} ]`
}

function fieldsToEvalStr(obj) {
  let ret = []
  for (let name in obj) {
    ret.push(`${name}: ${obj[name]}`)
  }
}

function toEvalStr(obj) {
  const typeStrMap = {
    1: 'ClpPacket.TYPE_ACK',
    2: 'ClpPacket.TYPE_RESPONSE',
    3: 'ClpPacket.TYPE_ERROR',
    4: 'ClpPacket.TYPE_PREPARE',
    5: 'ClpPacket.TYPE_FULFILL',
    6: 'ClpPacket.TYPE_REJECT',
    7: 'ClpPacket.TYPE_MESSAGE'
  }
  if ([ClpPacket.TYPE_ACK, ClpPacket.TYPE_RESPONSE, ClpPacket.TYPE_MESSAGE].indexOf(obj.type) !== -1) {
    return evalStr = `{ \n` +
    `  type: ${typeStrMap[obj.type]}, \n` +
    `  requestId: ${obj.requestId}, \n` +
    `  data: ${protocolDataToEvalStr(obj.data)}\n` +
    `}\n`
  }
  return `{ \n` +
    `  type: ${typeStrMap(obj.type)}, \n` +
    `  requestId: ${obj.requestId}, \n` +
    `  data: {\n` +
    `    ${fieldsToEvalStrs(obj.data).join(',\n    ')}\n` +
    `    protocolData: ${protocolDataToEvalStr(obj.data.protocolData)}\n` +
    `  }\n` +
    `}\n`
}

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
      this.handlers['incoming'].map(handler => {
        handler(obj, toEvalStr(obj))
      })
    })
  },

  start() {
    return this.node.start()
  },

  stop() {
    return this.node.stop()
  }
}

module.exports = Cat
