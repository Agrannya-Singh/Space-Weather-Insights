import { Dashboard } from "@/components/app/dashboard";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-10 border-b border-border/50 bg-background/90 backdrop-blur-sm">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
                    <div
                        style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: '#0B3D91',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
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
                    Space Weather Dashboard
                </h1>
            </div>
        </header>
        <main className="container mx-auto p-4 md:p-8">
            <Dashboard />
        </main>
    </div>
  );
}
