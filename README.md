# Astro Preload
Easily download images at build time!  
Supports [Iconify](https://icon-sets.iconify.design/) icons and arbitrary images.

## What does it do?
At build time, Astro Preload downloads the images from the provided urls and saves them to `public/assets/preloaded/`.

Can be useful in combination with tools like [astro-compress](https://github.com/astro-community/astro-compress) or to avoid including remote assets at runtime.

> In `development` mode Astro Preload will forward the urls directly, to avoid downloading the files multiple times.

## Install
```bash
npm run astro install astro-preload
# or
yarn astro add astro-preload
```

Remember to move the integration import function before any other imports.

```mjs
import { defineConfig } from "astro/config";
import compress from "astro-compress";
import preload from "astro-preload";

export default defineConfig({
  integrations: [preload(), compress()]
});
```

## Usage
Get icon from Iconify:
```astro
---
import { Icon } from "astro-preload/components";
---
<!-- Automatically fetches and downloads Material Design Icon's "github" SVG -->
<Icon pack="mdi" name="github" />

<!-- Equivalent shorthand -->
<Icon name="mdi:github" />

```

Get image from arbitrary URL:

```astro
---
import { Image } from "astro-preload/components";
---
<!-- Automatically fetches and downloads image -->
<Image url="https://examplecat.com/cat.png" />
```

## API
The **Icon** component accepts the following props:
- `name`: The name of the icon. Follows the format `<pack>:<name>`.
- `pack`: The pack of the icon. Can be skipped if a name with shorthand is provided.
- `size`: The size of the icon. Applied to both `width` and `height`.
- `url`: The URL of the icon. Overrides default Iconify URL.

The **Image** component accepts the following props:
- `name`: The name of the image. If not provided it will try to inferred from the url.
- `url`: The URL of the image.
- `size`: The size of the image. Applied to both `width` and `height`.

Any other props are passed to the wrapped `<img>` tag.