import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Use microlink API to scrape the metadata (title, image) of the Instagram Reel URL
    // It's a free and reliable API for parsing Open Graph tags
    const microlinkUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`
    
    const response = await fetch(microlinkUrl)
    const data = await response.json()

    if (data.status === 'success') {
      return NextResponse.json({
        title: data.data.title || 'Instagram Reel',
        thumbnail_url: data.data.image?.url || '',
        description: data.data.description || ''
      })
    } else {
      return NextResponse.json({ error: 'Failed to fetch metadata. The link might be private.' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error parsing reel URL:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
