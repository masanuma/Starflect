const [major, minor, patch] = process.versions.node.split('.').map(Number)
if (major !== 24 || minor < 22 || (minor === 22 && patch < 1)) {
  console.error(`Node.js ${process.versions.node} is unsupported. Use Node.js >=24.22.1 <25. On Windows, run scripts/local.ps1.`)
  process.exit(1)
}
