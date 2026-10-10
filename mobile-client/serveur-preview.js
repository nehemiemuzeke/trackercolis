const http = require('http')
const httpProxy = require('http-proxy')

const PORT_PROXY = Number(process.env.PORT_PROXY ?? 8081)
const PORT_METRO = Number(process.env.PORT_METRO ?? 8082)
const PORT_API = Number(process.env.PORT_API ?? 3000)

const proxy = httpProxy.createProxyServer({ ws: true })

proxy.on('error', (erreur, requete, reponse) => {
  if (reponse && typeof reponse.writeHead === 'function') {
    reponse.writeHead(502, { 'Content-Type': 'text/plain' })
    reponse.end('Proxy indisponible')
  }
})

function estRequeteApi(chemin) {
  return chemin.startsWith('/api') || chemin.startsWith('/socket.io')
}

const serveur = http.createServer((requete, reponse) => {
  const cible = estRequeteApi(requete.url) ? `http://127.0.0.1:${PORT_API}` : `http://127.0.0.1:${PORT_METRO}`
  proxy.web(requete, reponse, { target: cible })
})

serveur.on('upgrade', (requete, socket, entete) => {
  const cible = estRequeteApi(requete.url) ? `http://127.0.0.1:${PORT_API}` : `ws://127.0.0.1:${PORT_METRO}`
  proxy.ws(requete, socket, entete, { target: cible })
})

serveur.listen(PORT_PROXY, '0.0.0.0', () => {
  process.stdout.write(`proxy_demarre port=${PORT_PROXY} api=${PORT_API} metro=${PORT_METRO}\n`)
})
