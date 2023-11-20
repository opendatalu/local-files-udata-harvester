import { readdir, readFile } from 'fs/promises'
import * as path from 'path'
import * as dotenv from 'dotenv'
import process from 'node:process'
import * as odp from './odp.js'
import { log } from './utils.js'

let crypto
try {
  crypto = await import('node:crypto')
} catch (err) {
  console.error('crypto support is disabled!')
} 

// get the udata string for a given input file name
function toODPNames(name) {
  return name.toLowerCase().replaceAll(' ', '-').replaceAll('_', '-').replace(/--+/g,'-').normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

function getFilenameFromURL(url) {
  const pathName =  new URL(url).pathname;
  return pathName.substring(pathName.lastIndexOf('/')+1)  
}

function getResourceMeta(filename, resources) {
  let resource = resources.filter(e => { return getFilenameFromURL(e.url) == filename})
  if (resource.length === 0) {
    throw new Error('Metadata not found for the file: '+ filename)
  }
  if (resource.length !== 1) {
    throw new Error('Multiple metadata found for the file: '+ filename)
  }
  return resource[0]
}


async function main() {
  dotenv.config()

  log((new Date()).toLocaleString(), 'Syncing starts for the dataset:', process.env.odpDatasetId)

  // udata is transforming all file names to its own format
  let fileNamesOnDisk = await readdir(process.env.docRoot)
  if (process.env.nameRegex !== undefined) {
    fileNamesOnDisk = fileNamesOnDisk.filter(x => x.match(process.env.nameRegex))
  }
  const caseInsensitiveFilesOnDisk = fileNamesOnDisk.map(e => toODPNames(e))
  const mapping = {}
  fileNamesOnDisk.forEach(e => {
    mapping[toODPNames(e)] = e
  })

  const dataset = await odp.getDataset(process.env.odpDatasetId)
  const filesOnODP = new Set(dataset.resources.map(e => getFilenameFromURL(e.url)))
  
  let toAdd = [... new Set(caseInsensitiveFilesOnDisk.filter(x => !filesOnODP.has(x)))]
  let toUpdate = []
  if (process.env.overwrite === "true") {
    toUpdate = [... new Set(caseInsensitiveFilesOnDisk.filter(x => filesOnODP.has(x)))]
  }
  
  log("Files to add:", toAdd)
  log("Files to update:", toUpdate)
  for (const e of toAdd) {
    // get file
    const file = await readFile(process.env.docRoot+path.sep+mapping[e])
    // upload file
    const result = await odp.createResource(e, file, process.env.odpDatasetId, process.env.mimeType)

    // display status
    const status = (Object.keys(result).length !== 0)
    log('Resource creation', (result)?'succeeded': 'failed', 'for', e)
  }
  for (const e of toUpdate) {
    // get file
    const file = await readFile(process.env.docRoot+path.sep+mapping[e])
    // get Meta
    const meta = getResourceMeta(e, dataset.resources)

    // check if the file needs to be updated
    const algo = meta.checksum.type 
    const odpHash = meta.checksum.value 

    let update = true

    try {
      const hash = crypto.createHash(algo);
      hash.update(file)
      if (odpHash == hash.digest('hex')) {
        update = false
        console.log('File '+e+' is already up to date.')
      }
    } catch (err) {
      console.error(err)
    }
    
    if (update) {
      // upload file
      const result = await odp.updateResource(e, file, process.env.odpDatasetId, meta.id, process.env.mimeType)

      // update meta (udata bug?)
      const resultMeta = await odp.updateResourceMeta(process.env.odpDatasetId, meta.id, meta.title, meta.description)

      // display status
      const status = (Object.keys(result).length !== 0) && (Object.keys(resultMeta).length !== 0)
      log('Resource update', (result)?'succeeded': 'failed', 'for', e)
    }
  }

}


main().then(() => {log((new Date()).toLocaleString(), 'Sync successful')}).catch(e => {console.error(e); process.exitCode = 1;})
