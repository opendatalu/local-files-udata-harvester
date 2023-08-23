import { readdir, readFile } from 'fs/promises';
import * as dotenv from 'dotenv'
import *as odp from './odp.js'


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

  console.log((new Date()).toLocaleString(), 'Syncing starts for the dataset:', process.env.odpDatasetId)

  // udata is transforming all file names to its own format
  let fileNamesOnDisk = await readdir(process.env.docRoot)
  if (process.env.nameRegex !== undefined) {
    fileNamesOnDisk = fileNamesOnDisk.filter(x => x.match(process.env.nameRegex))
  }
  const caseInsensitiveFilesOnDisk = fileNamesOnDisk.map(e => toODPNames(e))
  const mapping = {}
  fileNamesOnDisk.forEach(e => {
    mapping[toODPNames(e)] = e
  });

  const dataset = await odp.getDataset(process.env.odpDatasetId)
  const filesOnODP = new Set(dataset.resources.map(e => getFilenameFromURL(e.url)))

  let toAdd = [... new Set(caseInsensitiveFilesOnDisk.filter(x => !filesOnODP.has(x)))]
  let toUpdate = []
  if (process.env.overwrite) {
    toUpdate = [... new Set(caseInsensitiveFilesOnDisk.filter(x => filesOnODP.has(x)))]
  }
  
  console.log("Files to add:", toAdd)
  console.log("Files to update:", toUpdate)
  for (const e of toAdd) {
    // get file
    const file = await readFile(process.env.docRoot+'/'+mapping[e])
    // upload file
    const result = await odp.createResource(e, file, process.env.odpDatasetId, process.env.mimeType)

    // display status
    const status = (Object.keys(result).length !== 0)
    console.log('Resource creation', (result)?'succeeded': 'failed', 'for', e)
  }
  for (const e of toUpdate) {
    // get file
    const file = await readFile(process.env.docRoot+'/'+mapping[e])

    // get Meta
    const meta = getResourceMeta(e, dataset.resources)
    // upload file
    const result = await odp.updateResource(e, file, process.env.odpDatasetId, meta.id, process.env.mimeType)

    // update meta (udata bug?)
    const resultMeta = await odp.updateResourceMeta(process.env.odpDatasetId, meta.id, meta.title, meta.description)

    // display status
    const status = (Object.keys(result).length !== 0) && (Object.keys(resultMeta).length !== 0)
    console.log('Resource update', (result)?'succeeded': 'failed', 'for', e)
  }

}


main().then(() => {console.log((new Date()).toLocaleString(), 'Sync successful')}).catch(e => {console.error(e)})
