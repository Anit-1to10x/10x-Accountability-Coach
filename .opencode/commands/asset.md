---
description: Manage your assets - images, videos, documents, and generated content
---
<context>
Active profile: Read from data/profiles/profiles.md (Owner Profile ID). If multiple profiles exist, ask which to use.
Profile data: data/profiles/{profileId}/
</context>

<cmd name="asset">Manage assets</cmd>

<input>/asset --list|--generate image|video|social</input>

<steps>
1. --list: read assets from data/profiles/{profileId}/assets/, group by type
2. --generate: use AI skills to create:
   - image → ai-image-generation skill
   - photo → ai-product-photo skill
   - video → ai-product-video skill
   - social → ai-social-graphics skill
3. Display asset details with paths
</steps>

<output>Assets grouped by type (image/video/document) with file sizes</output>
