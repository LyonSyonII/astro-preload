# Astro Preload
Easily download images at build time!  
Supports [Iconify](https://icon-sets.iconify.design/) icons and arbitrary images.

## What does it do?
At build time, Astro Preload downloads the images from the provided urls and saves them to `public/assets/preloaded/`.

Can be useful in combination with tools like [astro-compress](https://github.com/astro-community/astro-compress) or to avoid including foreign assets.

> In `development` mode Astro Preload will forward the urls directly, to avoid downloading the files multiple times.

## Install
```bash
npm install -i https://github.com/lyonsyonii/astro-preload
#or
yarn add https://github.com/lyonsyonii/astro-preload
```

## Usage
Get icon from Iconify:
```astro
---
import { Icon } from "astro-preload";
---
<!-- Automatically fetches and downloads Material Design Icon's "github" SVG -->
<Icon pack="mdi" name="github" />

<!-- Equivalent shorthand -->
<Icon name="mdi:github" />

```

Get image from arbitrary URL:

```astro
---
import { Image } from "astro-preload";
---
<!-- Automatically fetches and downloads image -->
<Image name="cat.png" url="https://examplecat.com/cat.png" />
```

## API
The **Icon** component accepts the following props:
- `name`: The name of the icon.
- `pack`: The pack of the icon.
- `size`: The size of the icon, applied to both `width` and `height`.
- `url`: The URL of the icon, overrides default Iconify URL.

The **Image** component accepts the following props:
- `name`: The name of the image.
- `url`: The URL of the image.
- `size`: The size of the image, applied to both `width` and `height`.
- `width`: The width of the image.
- `height`: The height of the image.

Any other props are passed to the wrapped `<img>` tag.