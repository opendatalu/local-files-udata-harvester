import dotenv from 'dotenv'
import { fetchThrottle } from './utils.js'
import { FormData, File, fileFromSync  } from 'node-fetch'

dotenv.config()

const odpURL = process.env.odpURL
const odpAPIKey = process.env.odpAPIKey

async function getDataset(id) {
    try {
        const res = await fetchThrottle(odpURL+"/datasets/"+id+"/", {
        "headers": {
            "Accept": "application/json, text/plain, */*",
            "Content-Type": "application/json;charset=utf-8",
            'X-API-KEY': odpAPIKey
        },
        "method": "GET"
        })
        if (!res.ok) {
            res.text().then(t => { throw t})
        }

        return res.json()
    } catch(e) {
        console.error(e)
        return {}
    }    
}

async function createResource(filename, data, ds_id, mime) {
    try {
        // uuid, filename, size, file*
        const formData = new FormData()
        const file = new File([data], filename, {'type': mime})

        formData.set('filename', filename)
        formData.set('file', file, filename)

        const res = await fetchThrottle(odpURL+'/datasets/'+ds_id+'/upload/', {
        "headers": {
            "Accept": "application/json",
            "Cache-Control": "no-cache",
            'X-API-KEY': odpAPIKey
        },
        "body": formData,
        "method": "POST"
        })
        if (!res.ok) {
            res.text().then(t => { throw t})
        }
        return res.json()
    } catch (e) {
        console.error(e)
        return {}
    }
}

async function updateResource(filename, data, ds_id, resource_id, mime) {
    try {
        // uuid, filename, size, file*
        const formData = new FormData()
        const file = new File([data], filename, {'type': mime})

        formData.set('filename', filename)
        formData.set('file', file, filename)

        const res = await fetchThrottle(`${odpURL}/datasets/${ds_id}/resources/${resource_id}/upload/`, {
        "headers": {
            "Accept": "application/json",
            "Cache-Control": "no-cache",
            'X-API-KEY': odpAPIKey
        },
        "body": formData,
        "method": "POST"
        })
        if (!res.ok) {
            res.text().then(t => { throw t})
        }
        return res.json()
    } catch (e) {
        console.error(e)
        return {}
    }
}

async function updateResourceMeta(ds_id, res_id, title, desc) {
    try {
        const body = {'title': title, 'description': desc}
        const res = await fetchThrottle(`${odpURL}/datasets/${ds_id}/resources/${res_id}/`, {
            "headers": {
                "Accept": "application/json",
                "Content-Type": "application/json",
                'X-API-KEY': odpAPIKey
            },
            "body": JSON.stringify(body),
            "method": "PUT"
        })
        if (!res.ok) {
            res.text().then(t => { throw t})
        }
        return res.json()        
    } catch (e) {
        console.error(e)
        return {}
    }
}

export {  getDataset, createResource, updateResource, updateResourceMeta}


