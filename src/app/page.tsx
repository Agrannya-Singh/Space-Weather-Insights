import { Dashboard } from "@/components/app/dashboard";
import { EdaLinkButton } from "@/components/app/eda-link";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-10 glass-header interactive">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <h1 className="text-2xl font-bold font-headline flex items-center gap-2">
                    <div
                        style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #0B3D91 0%, #34d399 100%)',
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
                            <circle cx="50" cy="50" r="48" fill="transparent" stroke="#FFFFFF" strokeWidth="2" />
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
                                stroke="#f59e0b"
                                strokeWidth="8"
                                strokeLinecap="round"
                                transform="rotate(15, 50, 50)"
                            />
                        </svg>
                    </div>
                    Space Weather Dashboard
                </h1>
                <EdaLinkButton />
            </div>
        </header>
        <main className="container mx-auto p-4 md:p-8">
            <Dashboard />
        </main>
    </div>
  );
}
