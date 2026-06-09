import { NextRequest, NextResponse } from 'next/server'

const RENOVATION_PROMPT = `A professional photorealistic architectural exterior renovation of the provided house. 
Strict preservation of the original structural shape, windows, roofline, and layout. 
No structural changes. Modern color palette: sophisticated charcoal grey walls, 
warm cedar wood door accents, clean off-white stucco finish. 
Updated premium materials, modern minimalist landscaping with neat shrubs, 
elegant outdoor lighting, bright daylight, 8k resolution, highly detailed, architectural photography style.`

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const imageFile = formData.get('image') as File

    if (!imageFile) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    const falKey = process.env.FAL_KEY
    if (!falKey) {
      return NextResponse.json({ error: 'FAL_KEY not set in environment' }, { status: 500 })
    }

    // Convert to base64 data URL
    const arrayBuffer = await imageFile.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const dataUrl = `data:${imageFile.type};base64,${base64}`

    // fal.ai - flux/dev/image-to-image
    const response = await fetch('https://fal.run/fal-ai/flux/dev/image-to-image', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_url: dataUrl,
        prompt: RENOVATION_PROMPT,
        strength: 0.75,
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        output_format: 'jpeg',
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Fal.ai error:', errText)
      return NextResponse.json({ error: `Fal.ai error: ${errText}` }, { status: 500 })
    }

    const data = await response.json()

    // fal returns images array with url
    const imageUrl = data?.images?.[0]?.url
    if (!imageUrl) {
      return NextResponse.json({ error: 'No image returned from fal.ai' }, { status: 500 })
    }

    return NextResponse.json({ success: true, image: imageUrl })

  } catch (err) {
    console.error('Renovation API error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}