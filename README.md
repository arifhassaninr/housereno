# 🏠 GharBadlo AI — House Renovation Visualizer

Upload karo ghar ki photo → AI renovate karke dikhata hai (free!)

## Setup (5 minutes)

### 1. HuggingFace Free Token lao
- https://huggingface.co/join → account banao (free)
- https://huggingface.co/settings/tokens → New token → Read role → Copy karo

### 2. Local run karo
```bash
npm install
# .env.local mein apna token daalo:
# HF_TOKEN=hf_xxxxxxxxxx
npm run dev
```

### 3. Vercel Deploy karo
```bash
npm install -g vercel
vercel
# Vercel dashboard mein Environment Variable add karo:
# Key: HF_TOKEN  |  Value: hf_xxxxxxxxxx
```

## Tech Stack
- **Frontend**: Next.js 14 + TypeScript
- **AI**: HuggingFace Inference API (ControlNet SD1.5) — FREE
- **Deploy**: Vercel (free tier)

## Features
- Drag & drop image upload
- Before/After comparison slider
- Mobile responsive
- Download result button
- Auto-retry if model loading

## Notes
- HuggingFace free tier = slow (30-60 sec first request)
- Model: `lllyasviel/control_v11p_sd15_canny`
- Max file size: 10MB
