const Plugin = require('ilp-plugin-bells')
const Frog = require('clp-frog')
const Cat = require('.')
const ClpPacket = require('clp-packet')

const plugin = new Plugin({ account: 'https://red.ilpdemo.org/ledger/accounts/alice', password: 'alice' })
const frog = new Frog({ clp: { version: 1, listen:8000 }, plugin })
const cat = new Cat({ clp: { version: 1, name: 'alice', upstreams: [ { url: 'ws://localhost:8000/frog/clp/v1', token: 'alice' } ] } })

frog.start().then(() => {
  console.log('frog started')
  return cat.start()
}).then(() => {
  console.log('cat started')
  const gotOneResponse = new Promise((resolve) => {
    cat.on('incoming', (obj, evalString) => {
      console.log(evalString)
      resolve()
    })
  })
  const sentOneMessage = cat.send({
    type: ClpPacket.TYPE_MESSAGE,
    requestId: 1,
    data: [
      {
        protocolName: 'balance',
        contentType: ClpPacket.MIME_APPLICATION_OCTET_STREAM,
        data: Buffer.from([ 0 ])
      }
    ]
  })
  return sentOneMessage.then(() => {
   return gotOneResponse
  })
}).then(() => {
   console.log('sent one message and got one response')
   return frog.stop()
}).then(() => {
   console.log('frog stopped')
   return cat.stop()
}).then(() => {
   console.log('cat stopped')
})
