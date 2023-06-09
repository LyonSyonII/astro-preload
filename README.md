# Astro Prefetch
Download images at build time! Supports Iconify icons and arbitrary images.

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