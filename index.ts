import { AstroIntegration } from "astro";
import fs from "fs/promises";

export {default as Icon} from "./components/Icon.astro";
export {default as Image} from "./components/Image.astro";

const PKG_NAME = "astro-preload";

export default function integration(): AstroIntegration {
    return {
        name: PKG_NAME,
        hooks: {
            "astro:build:start": async () => {
                const files = await fs.readdir("public/assets/preloaded");
                await Promise.all(files.map(async file => fs.copyFile(`public/assets/preloaded/${file}`, `dist/assets/preloaded/${file}`, fs.constants.COPYFILE_EXCL)));
            }
        }
    };
}