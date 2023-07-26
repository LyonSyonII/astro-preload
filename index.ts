import type { AstroIntegration } from "astro";
import { cpSync, rmSync } from "fs";
import { join } from "path";

const PKG_NAME = "astro-preload";

/**
 * A rather basic vite plugin that exposes config data needed by
 * the preload-Function.
 * @param config Config Data from the Astro config
 */
function makeVitePlugin(config: {publicDir: string, base: string}) {

    return {
        name: "vite-plugin-"+PKG_NAME,
        resolveId(id: string) : string | void {
            if(id === "virtual:astro-preload") {
                return `\0${id}`
            }
        },
        load(id: string) : string | void {
            if(id === "\0virtual:astro-preload") {
                const moduleContent = Object.entries(config).map( ([k,v]) => `export const ${k} = ${JSON.stringify(v)}`).join("\n")
                return moduleContent
            }
        }
    }
}

let pluginConfig: {
    publicDir: string,
    base: string,
    site?: string | undefined,
    outDir: string
} | undefined

interface Config {
    reuseGenerated?: boolean | undefined
}


export default function makePlugin(config?: Config): AstroIntegration {
    return {
        name: PKG_NAME,
        hooks: {
            // Taken from starlight (compare with https://github.com/withastro/starlight/blob/main/packages/starlight/index.ts#L42-L57)
            "astro:config:setup": ({config, updateConfig}) => {
                const vitePlugins = config?.vite?.plugins ?? []
                const pubDir = config.publicDir
                pluginConfig = {
                    publicDir: config.publicDir.toString().replace(pubDir.protocol+"//", ""),
                    base: config.base,
                    site: config.site,
                    outDir: config.outDir.toString().replace(pubDir.protocol+"//", "")
                }


                vitePlugins.push(makeVitePlugin(pluginConfig))
                
                const viteConfig = config.vite
                viteConfig.plugins = vitePlugins

                updateConfig({
                    ...config,
                    vite: viteConfig
                })
                
            },
            "astro:build:setup": () => {
                // Delete the generated folder in the public dir (if it exists). This is done to avoid "zombie" files accumulating
                // If this is not desired, this step can be skipped by passing { reuseGenerated: true } to the integration's config
                if(config?.reuseGenerated) {
                    return
                }

                if(!pluginConfig) {
                    throw new Error("Plugin Config not initialized")
                }
                const dirToDelete = join(pluginConfig.publicDir, "assets", "preloaded")
                rmSync(dirToDelete, {recursive: true, force: true})
            },
            "astro:build:done": () => {
                // This hook is only needed if new images got added in the current build because analyzing which
                // files need to be moved happens *before* the rendering step - so images that got added in the
                // current build step need to be moved additionally
                if(!pluginConfig) {
                    throw new Error("Plugin Config not initialized")
                }
                cpSync(join(pluginConfig.publicDir, "assets", "preloaded"), join(pluginConfig.outDir, "assets", "preloaded"), {recursive: true, force: true})
            },
        }
    };
}
