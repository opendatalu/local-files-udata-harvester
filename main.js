import { readdir, readFile } from 'fs/promises';
import * as dotenv from 'dotenv'
import {  getDataset, uploadResource } from './odp.js'


// get the udata string for a given input file name
function toODPNames(name) {
  return name.toLowerCase().replaceAll(' ', '-').replaceAll('_', '-').replace(/--+/g,'-').normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

async function main() {
  dotenv.config()

  console.log((new Date()).toLocaleString(), 'Syncing starts...')

  // udata is transforming all file names to its own format
  const fileNamesOnDisk = await readdir(process.env.docRoot)

  const caseInsensitiveFilesOnDisk = fileNamesOnDisk.map(e => toODPNames(e))
  const mapping = {}
  fileNamesOnDisk.forEach(e => {
    mapping[toODPNames(e)] = e
  });

  const dataset = await getDataset(process.env.odpDatasetId)
  const filesOnODP = new Set(dataset.resources.map(e => e.title))

  let toAdd = [... new Set(caseInsensitiveFilesOnDisk.filter(x => !filesOnODP.has(x)))]

  if (process.env.nameRegex !== undefined) {
    toAdd = toAdd.filter(x => x.match(process.env.nameRegex))
  }
  // sort files by modification date
  console.log("Files to be uploaded:", toAdd)
  for (const e of toAdd) {
    // get file
    const file = await readFile(process.env.docRoot+'/'+mapping[e])
    // upload file
    const result = await uploadResource(e, file, process.env.odpDatasetId, process.env.mimeType)

    // display status
    const status = (Object.keys(result).length !== 0)
    console.log('Resource upload', (result)?'succeeded': 'failed', 'for', e)
  }
}


main().then(() => {console.log((new Date()).toLocaleString(), 'Sync successful')}).catch(e => {console.error(e)})
