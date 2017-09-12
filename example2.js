const Plugin = require('ilp-plugin-bells')
const Frog = require('clp-frog')
const Cat = require('.')
const ClpPacket = require('clp-packet')
const IlpPacket = require('ilp-packet')
const crypto = require('crypto')
const uuid = require('uuid/v4')

const plugin1 = new Plugin({ account: 'https://red.ilpdemo.org/ledger/accounts/alice', password: 'alice' })
const frog1 = new Frog({ clp: { version: 1, listen:8000 }, plugin: plugin1 })
const cat1 = new Cat({ clp: { version: 1, name: 'alice', upstreams: [ { url: 'ws://localhost:8000/frog/clp/v1', token: 'alice' } ] } })

const plugin2 = new Plugin({ account: 'https://red.ilpdemo.org/ledger/accounts/bob', password: 'bobbob' })
const frog2 = new Frog({ clp: { version: 1, listen:8001 }, plugin: plugin2 })
const cat2 = new Cat({ clp: { version: 1, name: 'bob', upstreams: [ { url: 'ws://localhost:8001/frog/clp/v1', token: 'bobbob' } ] } })

function sha256 (fulfillment) {
}

const fulfillment = crypto.randomBytes(32)
const condition = crypto.createHash('sha256').update(fulfillment).digest()

Promise.all([
  frog1.start(),
  frog2.start(),
]).then(() => {
  return Promise.all([
    cat1.start(),
    cat2.start()
  ])
}).then(() => {
  const done1 = new Promise((resolve) => {
    cat1.on('incoming', (obj, evalString) => {
      if (obj.type === ClpPacket.TYPE_FULFILL) {
        if (fulfillment.compare(obj.data.fulfillment) === 0) {
          console.log('fulfillment ok')
          cat1.send({
            type: ClpPacket.TYPE_ACK,
            requestId: obj.requestId,
            data: []
          })
          // note that Bob may already receive an ack from the ledger
          // even before Alice receives this fulfill.
          // Alice's Frog will ignore this Ack
          console.log('cat1 ack')
          resolve()
        } else {
          console.log('fulfillment not ok')
        }
      }
    })
  })
  const done2 = new Promise((resolve) => {
    cat2.on('incoming', (obj, evalString) => {
      if (obj.type === ClpPacket.TYPE_PREPARE) {
        cat2.send({
          type: ClpPacket.TYPE_ACK,
          requestId: 1,
          data: []
        })
        cat2.send({
          type: ClpPacket.TYPE_FULFILL,
          requestId: 2,
          data: {
            transferId: obj.data.transferId,
            fulfillment,
            protocolData: [] 
          }
        })
      }
      if (obj.type === ClpPacket.TYPE_ACK) {
        console.log('cat2 ack')
        resolve()
      }
    })
  })
  return cat1.send({
    type: ClpPacket.TYPE_PREPARE,
    requestId: 1,
    data: {
      amount: 1,
      executionCondition: condition,
      expiresAt: new Date(new Date().getTime() + 100000),
      transferId: uuid(),
      protocolData: [
        {
          protocolName: 'ilp',
          contentType: ClpPacket.MIME_APPLICATION_OCTET_STREAM,
          data: IlpPacket.serializeIlpPayment({
            amount: '1234',
            account: 'example.testing.hi'
          })
        },
        {
          protocolName: 'to',
          contentType: ClpPacket.MIME_TEXT_PLAIN_UTF8,
          data: Buffer.from('us.usd.red.bob', 'ascii')
        }
      ]
    }
  }).then(() => {
   return Promise.all([ done1, done2 ])
  })
}).then(() => {
  console.log('done')
   return Promise.all([
     frog1.stop(),
     cat1.stop(),
     frog2.stop(),
     cat2.stop()
   ])
})
