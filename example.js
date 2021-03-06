const Plugin = require('ilp-plugin-bells')
const Frog = require('clp-frog')
const Cat = require('.')
const ClpPacket = require('clp-packet')
const IlpPacket = require('ilp-packet')

const plugin = new Plugin({ account: 'https://red.ilpdemo.org/ledger/accounts/alice', password: 'alice' })
const frog = new Frog({ clp: { version: 1, listen:8000 }, plugin })
const cat = new Cat({ clp: { version: 1, name: 'alice', upstreams: [ { url: 'ws://localhost:8000/frog/clp/v1', token: 'alice' } ] } })

frog.start().then(() => {
  return cat.start()
}).then(() => {
  let responses = 0
  const requests = [
     {
       type: ClpPacket.TYPE_MESSAGE,
       requestId: 1,
       data: [
         {
           protocolName: 'balance',
           contentType: ClpPacket.MIME_APPLICATION_OCTET_STREAM,
           data: Buffer.from([ 0 ])
         }
       ]
     },
     {
       type: ClpPacket.TYPE_MESSAGE,
       requestId: 2,
       data: [
         {
           protocolName: 'info',
           contentType: ClpPacket.MIME_APPLICATION_OCTET_STREAM,
           data: Buffer.from([ 0 ])
         }
       ]
     },
     {
       type: ClpPacket.TYPE_MESSAGE,
       requestId: 3,
       data: [
         {
           protocolName: 'info',
           contentType: ClpPacket.MIME_APPLICATION_OCTET_STREAM,
           data: Buffer.from([ 2 ])
         }
       ]
     },
    {
      type: ClpPacket.TYPE_MESSAGE,
      requestId: 4,
      data: [
        {
          protocolName: 'ilp',
          contentType: ClpPacket.MIME_APPLICATION_OCTET_STREAM,
          data: IlpPacket.serializeIlqpByDestinationRequest({
            destinationAccount: 'de.eur.blue.bob',
            destinationAmount: '9000000000',
            destinationHoldDuration: 3000
          })
        },
        {
          protocolName: 'to',
          contentType: ClpPacket.MIME_TEXT_PLAIN_UTF8,
          data: Buffer.from('us.usd.red.connie', 'ascii')
        }
      ]
    },
  ]

  const gotResponses = new Promise((resolve) => {
    cat.on('incoming', (obj, evalString) => {
      if (++responses === requests.length) {
        resolve()
      }
    })
  })
  return Promise.all(requests.map(request => {
    cat.send(request)
  })).then(() => {
   return gotResponses
  })
}).then(() => {
   return frog.stop()
}).then(() => {
   return cat.stop()
})
