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
          background: '#0B3D91',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '50%',
        }}
      >
        <svg
            width="28"
            height="28"
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="50" cy="50" r="48" fill="#0B3D91" stroke="#FFFFFF" strokeWidth="2" />

            <text
                x="50"
                y="58"
                fontFamily="serif"
                fontSize="38"
                fill="white"
                textAnchor="middle"
                fontWeight="bold"
            >
                SW
            </text>
            
            <path
                d="M20,55 Q50,45 80,55"
                stroke="white"
                strokeWidth="2"
                fill="none"
                transform="rotate(-10, 50, 50)"
            />

            <path
                d="M15 45 L 85 45"
                stroke="#FC3D21"
                strokeWidth="8"
                strokeLinecap="round"
                transform="rotate(15, 50, 50)"
            />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
