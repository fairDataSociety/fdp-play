const FS = require('fs')
const Path = require('path')
const contractAddressesPath = Path.join(__dirname, '..', 'contract-addresses.json')

function saveContractAddresses(jsonData) {
    FS.writeFileSync(contractAddressesPath, JSON.stringify(jsonData, null, 2))
}

function loadContractAddresses() {
    return JSON.parse(FS.readFileSync(contractAddressesPath))
}

module.exports = {
    saveContractAddresses,
    loadContractAddresses,
}