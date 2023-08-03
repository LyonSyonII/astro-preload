/**
 * This module is responsible for fetching the images in prod mode (during build)
 * and storing them under the $publicDir/preloaded/[...] directory 
 * 
 * The main export also can be used during dev mode, in which case the passed url is just returned.
 */

import { createHash } from "crypto"
import { existsSync, stat } from "fs"
import { mkdir, writeFile } from "fs/promises"
import { join } from "path"

import {base, publicDir, site} from "virtual:astro-preload"


export interface PreloadOptions {
    /**
     * Defines whats "left" of the path. This can be relevant if you intent to preload images for Opengraph.
     * You may also pass "true" here. In this case, the value defined in the Astro Config File gets used here
     * 
     * @example "https://example.com"
     * @example "https://example.com/some/base/path"
     * @example true
     * 
     */
    site?: string | true

    /**
     * By default the preloaded name will be ${shorthashOfUrl}.${extension}
     * This can be overriden with this property
     * 
     * **WARNING**: It is your responsibility to make sure there are no collisions in the name.
     */
    overrideName?: string | undefined,

    /**
     * Do not look up the preload-Directory for already existing files
     */
    skipCache?: true,

    /**
     * The tool will infer the file ending from the URL. 
     * In some cases however this is not possible (e.g. URL does not end with file ending), 
     * or not desirable (think: conversion of images). Use this option to define the File Ending.
     */
    overrideFileEnding?: string



}

let PUBLIC_DIRECTORYNAME = publicDir
if(PUBLIC_DIRECTORYNAME.endsWith("/")) {
    PUBLIC_DIRECTORYNAME = PUBLIC_DIRECTORYNAME.slice(0, -1)
}
const PRELOAD_PATH_SEGMENT = `/assets/preloaded/`
const PRELOAD_DIRECTORY = PUBLIC_DIRECTORYNAME+PRELOAD_PATH_SEGMENT




function getHashedFileName(url: string | URL, fileEndingOverride?: string | undefined, fileNameOverride?: string | undefined) {
    url = url.toString()
    const lastsegment = url.split("/").pop() ?? url
    const splitFile = lastsegment.split(".")
    const fileEnding = fileEndingOverride ?? splitFile[splitFile.length - 1];
    if(!fileEnding) {
        throw new Error("You must provide a File Ending Override for the URL "+url+" because the file ending could not be inferred from the URL")
    }
    const fileWithoutEnding = splitFile.length === 1 ? splitFile[0] : splitFile.slice(0, -1).join(".")
    

    const hash = createHash("md5").update(url).digest("hex")

    if(fileNameOverride) {
        return `${fileNameOverride}.${fileEnding}`
    }

    return `${fileWithoutEnding}-${hash}.${fileEnding}`


}


interface PreloadFetchOpts {
    /**
     * Set this to true to skip checking if a file with that name already exists. 
     * **WARNING**: it is your responsibility to make sure that file names are unique.   
     */
    skipCache?: true

    /**
     * Defines whats "left" of the path. This can be relevant if you intent to preload images for Opengraph.
     * You may also pass "true" here. In this case, the value defined in the Astro Config File gets used here
     * 
     * @example "https://example.com"
     * @example "https://example.com/some/base/path"
     * @example true
     * 
     */
    site?: string | true
}


/**
 * Use this Method if you wish to use any arbitrary fetch-Invocation to obtain an image.
 * This is used internally to GET images, but may also be used to, for example, send data via POST to a 
 * local server to generate Thumbnails. Note that this method expects you explicitly set the entire file name. 
 * 
 * Note that while this is intended for Images, nothing stops you from preloading anything else here. Just make sure that
 * the file ending makes sense.
 * 
 * Also do note that this 
 * 
 * @param fetchCall A fetch invocation that is expected to return a Buffer Payload. Note that this will not be executed if caching is desired and a file with the given name exists!
 * @param entireFileName The Filename, excluding the path to the preload-Directory. example: `image-123.webp`
 */
export async function preloadFetch(fetchCall: () => Promise<Response>, entireFileName: string, opts: PreloadFetchOpts) {
    const fileAlreadyExits = await new Promise<boolean>( res => {
        stat(`${PUBLIC_DIRECTORYNAME}${PRELOAD_PATH_SEGMENT}${entireFileName}`, (err) => {
            res(err === null)
        })
    } )

    if(opts.skipCache || !fileAlreadyExits) {
        // File does not yet exist. 
        // We will invoke the fetch, store the result under $preloadDir/$entireFileName
        const response = await fetchCall()
        
        if(!response.body) {
            throw new Error("The Server responded with an empty body. As a result no file can be preloaded.")
        }

        const responseBuffer = new Uint8Array(await (await response.blob()).arrayBuffer())
        if(!responseBuffer) {
            throw new Error("Response Buffer is empty!")
        }

        await writeFile(join(PRELOAD_DIRECTORY, entireFileName), responseBuffer)
        // The file is now stored in the preload dir
        console.log(
            `[astro-preload]: Downloaded image to ${PUBLIC_DIRECTORYNAME}${PRELOAD_PATH_SEGMENT}${entireFileName}`
        );
    } else {
        console.log(
            `[astro-preload]: Retrieved ${entireFileName} from cache`
        );
    }

    const serverFilePath = `${determineHost(opts.site)}${PRELOAD_PATH_SEGMENT}${entireFileName}`
    return serverFilePath
}


function determineHost(siteOverride?: string | boolean) {
    let host = ""
        if(siteOverride) {
            if(siteOverride === true) {
                host = site
            } else {
                host = siteOverride
            }
        }
        // example.com | example.com/
        if(!host.endsWith("/")) {
            host+="/"
        }
        // example.com/
        if(base) {
            // /path/ | /path | path | path/
            let baseTemp = base
            if(base.startsWith("/")) {
                baseTemp = baseTemp.slice(1)
            }
            // path/ | path
            if(!base.endsWith("/")) {
                baseTemp += "/"
            }
            // path/
            host+=baseTemp
        }
        // example.com/path/
        host = host.slice(0, -1)
        // example.com/path
        return host;
}


export default async function preload( url: string | URL , opts?: PreloadOptions) : Promise<string> {

    // If not in Prod, and if a local image, skip
    if(process.env.NODE_ENV !== "production" || url.toString().startsWith("/")) {
        return url.toString()
    }

    try {
        // Create preload directory if it does not exist yet
        if(!existsSync(PRELOAD_DIRECTORY)) {
            await mkdir(PRELOAD_DIRECTORY, { recursive: true })
        }

        const fileToLookUp = getHashedFileName(url, opts?.overrideFileEnding, opts?.overrideName)

        return await preloadFetch(() => fetch(url),fileToLookUp, opts ?? {})

    }
    catch(err) {
        console.log(
            `[astro-preload]: Failed to load image, fallback to using '${url}'`
        );
        return url.toString()
    }
}
