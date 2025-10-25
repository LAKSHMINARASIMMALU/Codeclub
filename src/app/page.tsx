import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { BarChart, Layers, ShieldCheck, Terminal, Trophy } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function Home() {
  const features = [
    {
      icon: <Trophy className="h-10 w-10 text-primary" />,
      title: 'Competitive Contests',
      description: 'Engage in weekly and monthly coding challenges designed to test your limits.',
    },
    {
      icon: <ShieldCheck className="h-10 w-10 text-primary" />,
      title: 'AI Proctoring',
      description: 'Our AI-powered system ensures a fair and cheat-free environment for all participants.',
    },
    {
      icon: <BarChart className="h-10 w-10 text-primary" />,
      title: 'Live Leaderboard',
      description: 'Track your progress and see how you stack up against the competition in real-time.',
    },
    {
      icon: <Layers className="h-10 w-10 text-primary" />,
      title: 'Multiple Skill Levels',
      description: 'Contests are tailored for different skill levels, from beginner to expert.',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-2 text-sm font-medium md:flex">
             <Button variant="ghost" asChild>
                <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
                <Link href="/register">Register</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-8 px-4 sm:px-6 lg:px-8 py-12 md:py-24">
          <div className="flex flex-col items-start gap-6">
            <div className="flex items-center font-headline text-5xl font-bold tracking-tighter text-primary">
              <span>WELCOME TO</span>
              <Terminal className="h-12 w-12 mx-2" />
              <span>CODEDUEL PRO</span>
            </div>
            <p className="max-w-md text-muted-foreground">
              The ultimate coding showdown. Compete, climb, and conquer. Your journey to the top of the leaderboard starts now.
            </p>
            <Button asChild size="lg">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
          <div className="relative h-[400px] w-full md:h-[500px]">
             <Image
                src="https://i.pinimg.com/736x/e6/16/dc/e616dc1fb1b923fa0839173e2e7be049.jpg"
                alt="An illustration of a programmer sitting at a desk and coding, matching the user's provided image."
                fill
                className="object-contain"
                data-ai-hint="programmer illustration"
              />
          </div>
        </section>

        <section className="bg-muted/30 py-20">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold font-headline">Why CodeDuel Pro?</h2>
                    <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Our platform is built from the ground up to provide the best competitive programming experience.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <Card key={index} className="text-center">
                            <CardHeader>
                                <div className="mx-auto mb-4 bg-primary/10 p-3 rounded-full w-fit">
                                    {feature.icon}
                                </div>
                                <CardTitle className="font-headline">{feature.title}</CardTitle>
                                <CardDescription>{feature.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </section>

      </main>

      <footer className="py-6 md:px-8 md:py-0">
        <div className="container flex flex-col items-center justify-center gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm text-muted-foreground">
            &copy;2025 codeduel_pro
          </p>
        </div>
      </footer>
    </div>
  );
}
