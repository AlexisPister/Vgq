"use strict"

let version = process.argv[2]
let auth = process.argv[3]

if (!auth) {
  console.log("Usage: upload-release.js [TAG] [github-user:password]")
  process.exit(1)
}

require('child_process').exec("git --no-pager show -s --format='%s' " + version, (error, stdout) => {
  if (error) throw error
  let message = stdout.split("\n").slice(2)
  message = message.slice(0, message.indexOf("-----BEGIN PGP SIGNATURE-----")).join("\n")

  let req = require("https").requestDatabase({
      host: "api.github.com",
      auth: auth,
      headers: {"user-agent": "Release uploader"},
      path: "/repos/codemirror/codemirror/releases",
      method: "POST"
  })
    req.write(JSON.stringify({
    tag_name: version,
    name: version,
    body: message
  }))
  req.end()
})
