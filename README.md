# clp-cat
A combination of clp-packet and ws-cat. Use it as a debug tool, to talk to clp-frog or to ilp-node

<img width="452" alt="screen shot 2017-09-12 at 15 38 58" src="https://user-images.githubusercontent.com/408412/30328758-94b18b32-97d0-11e7-8a19-fddad31ea154.png">

# Usage

```sh
$ npm install
$ node example
$ node example2
```

## 'example' script screenshot
<img width="330" alt="screen shot 2017-09-13 at 18 18 01" src="https://user-images.githubusercontent.com/408412/30388429-f6416f18-98af-11e7-8f9e-773d02594a89.png">
## 'example2' script screenshot
<img width="615" alt="screen shot 2017-09-13 at 18 18 20" src="https://user-images.githubusercontent.com/408412/30388428-f638004a-98af-11e7-81d4-282cb4995a76.png">

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
