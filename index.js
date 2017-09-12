const ClpNode = require('clp-node')
const ClpPacket = require('clp-packet')
const IlpPacket = require('ilp-packet')
const chalk = require('chalk')

function bufferToEvalStr(buf) {
  let byteStrArr = []
  for (let i = 0; i < buf.length; i++) {
    byteStrArr.push(buf[i].toString())
  }
  return `new Buffer([ ${byteStrArr.join(', ')} ])`
}

function protocolDataToEvalStr(arr) {
  const mimeStrMap = {
    0: 'ClpPacket.MIME_APPLICATION_OCTET_STRING',
    1: 'ClpPacket.MIME_TEXT_PLAIN_UTF8',
    2: 'ClpPacket.MIME_APPLICATION_JSON'
  }
  const strArr = arr.map(obj => {
    if (obj.contentType === ClpPacket.MIME_TEXT_PLAIN_UTF8) {
      dataStr = `'${obj.data.toString('ascii')}'`
    } else if (obj.contentType === ClpPacket.MIME_APPLICATION_JSON) {
      dataStr = `JSON.stringify(${JSON.stringify(JSON.parse(obj.data.toString('ascii')), null, 2).split('\n').join('\n    ')})`
    } else if (obj.protocolName === 'ilp') {
      dataStr = `IlpPacket.serializeIlpPacket(${JSON.stringify(IlpPacket.deserializeIlpPacket(obj.data), null, 2).split('\n').join('\n    ')})`
    } else {
      dataStr = bufferToEvalStr(obj.data)
    }
    return `{\n    protocolName: '${obj.protocolName}',\n    contentType: ${mimeStrMap[obj.contentType]},\n    data: ${dataStr}\n  }`
  })
  return `[ ${strArr.join(', ')} ]`
}

function fieldsToEvalStrs(obj) {
  let ret = []
  for (let name in obj) {
    if (name === 'protocolData') {
      continue
    }
    // binary fields
    if (['executionCondition', 'fulfillment'].indexOf(name) !== -1) {
      ret.push(`${name}: ${bufferToEvalStr(obj[name])}`)

    // string fields:
    } else if (['transferId'].indexOf(name) !== -1) {
      ret.push(`${name}: '${obj[name]}'`)
    } else {
      ret.push(`${name}: ${obj[name]}`)
    }
  }
  return ret
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
    `  type: ${typeStrMap[obj.type]}, \n` +
    `  requestId: ${obj.requestId}, \n` +
    `  data: {\n` +
    `    ${fieldsToEvalStrs(obj.data).join(',\n    ')}\n` +
    `    protocolData: ${protocolDataToEvalStr(obj.data.protocolData)}\n` +
    `  }\n` +
    `}\n`
}

function Cat (config) {
  this.logName = config.clp.name
  this.handlers = {
    incoming: [
      (obj, evalStr) => {
        console.log(chalk.bold.red(this.logName), chalk.red(evalStr))
      }
    ]
  }
  this.node = new ClpNode(config.clp, (ws) => {
    this.ws = ws
    this.registerWebSocketMessageHandler()
  })
}

Cat.prototype = {
  send (obj) {
    this.ws.send(ClpPacket.serialize(obj))
    console.log(chalk.bold.green(this.logName), chalk.green(toEvalStr(obj)))
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
