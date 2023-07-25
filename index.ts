import type { AstroIntegration } from "astro";

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
                console.log(moduleContent)
                return moduleContent
            }
        }
    }
}

let pluginConfig: {
    publicDir: string,
    base: string,
    site?: string | undefined,
    outDir: URL
} | undefined


export default function makePlugin(): AstroIntegration {
    return {
        name: PKG_NAME,
        hooks: {
            // The astro:build:done Hook is not needed because the public-Folder gets simply copied over into dist anyways
            // Taken from starlight (compare with https://github.com/withastro/starlight/blob/main/packages/starlight/index.ts#L42-L57)
            "astro:config:setup": ({config, updateConfig}) => {
                const vitePlugins = config?.vite?.plugins ?? []
                const pubDir = config.publicDir
                console.log(pubDir.protocol)
                pluginConfig = {
                    publicDir: config.publicDir.toString().replace(pubDir.protocol+"//", ""),
                    base: config.base,
                    site: config.site,
                    outDir: config.outDir
                }

                console.log(pluginConfig)

                vitePlugins.push(makeVitePlugin(pluginConfig))
                
                const viteConfig = config.vite
                viteConfig.plugins = vitePlugins

                updateConfig({
                    ...config,
                    vite: viteConfig
                })
                
            }
        }
    };
}
