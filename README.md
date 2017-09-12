# clp-cat
A combination of clp-packet and ws-cat. Use it as a debug tool, to talk to clp-frog or to ilp-node

![cat debugging a frog](http://i.imgur.com/6IVYUHo.jpg =250x "Cat debugging a Frog")

# Usage

```sh
$ npm install
$ node ./example
```

# Connecting the frog and the cat

The example script uses the frog as server and the cat as client:

```js
>
 const frog = new Frog({ clp: { version: 1, listen:8000 }, plugin })
 const cat = new Cat({ clp: { version: 1, name: 'alice', upstreams: [ { url: 'ws://localhost:8000/frog/clp/v1', token: 'alice' } ] } })
```

But CLP works symmetrically between WebSocket server and WebSocket client, so you can also do it the other way around:

```js
>
 const frog = new Frog({ clp: { version: 1, name: 'alice', upstreams: [ { url: 'ws://localhost:8000/cat/clp/v1', token: 'alice' } ] }, plugin })
 const cat = new Cat({ clp: { version: 1, listen:8000 } ] })
```

Clp-cat and clp-frog both depend on clp-node, which depends on greenlock to support on-the-fly LetsEncrypt registration.
So you can also put the frog on a hosted server, using the 'tls' config field:

```js
>
 const frog = new Frog({ clp: { version: 1, tls: 'frog.example.com' }, plugin })
 const cat = new Cat({ clp: { version: 1, name: 'alice', upstreams: [ { url: 'wss://frog.example.com/frog/clp/v1', token: 'alice' } ] } })
```

Or put the cat on a hosted server:

```js
>
 const frog = new Frog({ clp: { version: 1, name: 'alice', upstreams: [ { url: 'wss://cat.example.com/cat/clp/v1', token: 'alice' } ] }, plugin })
 const cat = new Cat({ clp: { version: 1,  tls: 'cat.example.com' } })
```

The example script gets Alice's balance:

```js
cat.send({ type: ClpPacket.TYPE_MESSAGE, requestId: 1, data: [ { protocolName: 'balance', contentType: ClpPacket.MIME_APPLICATION_OCTET_STREAM, data: Buffer.from([ 0 ]) } ] })
```

But you can also retrieve the ledger info:

```js
cat.send({ type: ClpPacket.TYPE_MESSAGE, requestId: 1, data: [ { protocolName: 'balance', contentType: ClpPacket.MIME_APPLICATION_OCTET_STREAM, data: Buffer.from([ 0 ]) } ] })
```

Or send an SPSP payment:
// TODO.
