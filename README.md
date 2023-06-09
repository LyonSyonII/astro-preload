# Astro Prefetch
Download images at build time! Supports [Iconify](https://icon-sets.iconify.design/) icons and arbitrary images.

## Install
```bash
npm install -i https://github.com/lyonsyonii/astro-prefetch
#or
yarn add https://github.com/lyonsyonii/astro-prefetch
```

## Usage
Get icon from Iconify:
```astro
---
import { Icon } from "astro-prefetch";
---

<!-- Automatically fetches and downloads Material Design Icon's "github" SVG -->
<Icon pack="mdi" name="github" />

<!-- Equivalent shorthand -->
<Icon name="mdi:github" />

```

Get image from arbitrary URL:

```astro
---
import { Image } from "astro-prefetch";
---
<!-- Automatically fetches and downloads image -->
<Image name="cat.png" url="https://examplecat.com/cat.png" />
```

## What does it do?
At build time, Astro Prefetch downloads the images from the provided urls and saves them to "public/assets/prefetched/".

Can be useful in combination with tools like [astro-compress](https://github.com/astro-community/astro-compress) or to avoid including foreign assets.

> In `development` mode Astro Prefetch will forward the urls directly, to avoid downloading the files multiple times.