import { NextRequest, NextResponse } from 'next/server'

const RENOVATION_PROMPT = `A professional photorealistic architectural exterior renovation of the provided house, 
strict preservation of the original structural shape, windows, roofline, and layout. 
No structural changes. AI-selected modern color palette featuring sophisticated charcoal grey, 
warm cedar wood accents, and clean off-white stucco. Updated premium materials, 
modern minimalist landscaping with neat shrubs and elegant outdoor lighting, 
bright daylight, 8k resolution, highly detailed, architectural photography style.`

const NEGATIVE_PROMPT = `cartoon, illustration, anime, unrealistic, blurry, low quality, 
deformed, structural changes, demolished, interior, different building`

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const imageFile = formData.get('image') as File

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const hfToken = process.env.HF_TOKEN
    if (!hfToken) {
      return NextResponse.json({ error: 'HF_TOKEN not set in .env.local' }, { status: 500 })
    }

    // Convert file to base64
    const arrayBuffer = await imageFile.arrayBuffer()
    const base64Image = Buffer.from(arrayBuffer).toString('base64')
    const dataUrl = `data:${imageFile.type};base64,${base64Image}`

    // Call HuggingFace Inference API - img2img with ControlNet
    const response = await fetch(
      'https://api-inference.huggingface.co/models/lllyasviel/control_v11p_sd15_canny',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${hfToken}`,
          'Content-Type': 'application/json',
          'X-Wait-For-Model': 'true',
        },
        body: JSON.stringify({
          inputs: dataUrl,
          parameters: {
            prompt: RENOVATION_PROMPT,
            negative_prompt: NEGATIVE_PROMPT,
            num_inference_steps: 30,
            guidance_scale: 7.5,
            strength: 0.75,
          },
        }),
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      // Model loading (503) — tell frontend to retry
      if (response.status === 503) {
        return NextResponse.json(
          { error: 'Model loading on HuggingFace, retry in 30 seconds', retry: true },
          { status: 503 }
        )
      }
      return NextResponse.json({ error: `HF API error: ${errText}` }, { status: 500 })
    }

    // HF returns raw image bytes
    const imageBuffer = await response.arrayBuffer()
    const resultBase64 = Buffer.from(imageBuffer).toString('base64')

    return NextResponse.json({
      success: true,
      image: `data:image/png;base64,${resultBase64}`,
    })
  } catch (err) {
    console.error('Renovation API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export const config = {
  api: { bodyParser: false },
}
