import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 24,
          background: '#243A73',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#BE31EB',
          borderRadius: '50%',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a7 7 0 0 0-7 7c0 4.42 3.58 8 7 8s7-3.58 7-8a7 7 0 0 0-7-7z"/><path d="M12 12a12.3 12.3 0 0 0 6.5 4.5c-1.33 1.8-3.23 3-5.5 3-3.87 0-7-3.13-7-7 0-1.5.48-2.88 1.29-4"/></svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
