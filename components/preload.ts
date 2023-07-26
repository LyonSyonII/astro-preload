/**
 * This module is responsible for fetching the images in prod mode (during build)
 * and storing them under the $publicDir/preloaded/[...] directory 
 * 
 * The main export also can be used during dev mode, in which case the passed url is just returned.
 */

import { createHash } from "crypto"
import { existsSync } from "fs"
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
     * By default the preloaded name will be ${fileNameWithoutExtension}-${shorthashOfFile}.${extension}
     * This can be overriden with this property
     */
    overrideName?: string | undefined

}

let PUBLIC_DIRECTORYNAME = publicDir
if(PUBLIC_DIRECTORYNAME.endsWith("/")) {
    PUBLIC_DIRECTORYNAME = PUBLIC_DIRECTORYNAME.slice(0, -1)
}
const PRELOAD_PATH_SEGMENT = `/assets/preloaded/`
const PRELOAD_DIRECTORY = PUBLIC_DIRECTORYNAME+PRELOAD_PATH_SEGMENT

function interpretFileEnding(mimeType: string | null ,fallback: string | undefined ) {
    if (mimeType) {
        switch(mimeType.trim()) {
            // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types
            case "image/avif" : return ".avif";
            case "image/bmp" : return ".bmp";
            case "image/gif" : return ".gif";
            case "image/jpeg" : return ".jpeg";
            case "image/png" : return ".png";
            case "image/svg+xml" : return ".svg";
            case "image/tiff" : return ".tiff";
            case "image/webp" : return ".webp";
        }
    }
    if(!fallback) {
        return ""
    }
    return "."+fallback
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

        const response = await fetch(url);
        const fileEnding = interpretFileEnding(response.headers.get("content-type"), (url.toString().split("/").pop()??"").split(".").pop())

        if(!response.body) {
            throw new Error("The Server responded with an empty body. As a result no file can be preloaded.")
        }

        
        const responseBuffer = new Uint8Array(await (await response.blob()).arrayBuffer())
        if(!responseBuffer) {
            throw new Error("Response Buffer is empty!")
        }
        const hash = createHash("md5").update(responseBuffer).digest("hex")

        const fileName = opts?.overrideName ?? `${hash}${fileEnding}`

        let host = ""
        if(opts?.site) {
            if(opts.site === true) {
                host = site
            } else {
                host = opts.site
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


        
        const serverFilePath = `${host}${PRELOAD_PATH_SEGMENT}${fileName}`

        await writeFile(join(PRELOAD_DIRECTORY, fileName), responseBuffer)    
        console.log(
            `[astro-preload]: Downloaded image to ${PUBLIC_DIRECTORYNAME}${PRELOAD_PATH_SEGMENT}${fileName}`
            );
        return serverFilePath;
    }
    catch(err) {
        console.log(
            `[astro-preload]: Failed to load image, fallback to using '${url}'`
        );
        return url.toString()
    }


}

