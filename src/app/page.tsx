import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Mail,
  FileText,
  BarChart3,
  Shield,
  Clock,
  ChevronRight,
  Brain,
  Zap,
  LineChart,
  Users,
  Lock,
} from "lucide-react";
import { auth } from "@/server/auth";

export default async function LandingPage() {
  const session = await auth();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-background sticky top-0 z-40 w-full border-b">
        <div className="container mx-auto flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <FileText className="text-primary h-6 w-6" />
            <span className="text-xl font-bold">Interprep</span>
          </div>
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="#features"
              className="hover:text-primary text-sm font-medium"
            >
              Features
            </Link>
            <Link
              href="#ai-advantage"
              className="hover:text-primary text-sm font-medium"
            >
              AI Advantage
            </Link>
            <Link
              href="#how-it-works"
              className="hover:text-primary text-sm font-medium"
            >
              How It Works
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {session?.user ? (
              <Link href="/dashboard">
                <Button>Dashboard</Button>
              </Link>
            ) : (
              <Link href="/api/auth/signin">
                <Button>Login</Button>
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <div className="bg-primary/10 text-primary inline-flex items-center rounded-full px-3 py-1 text-sm font-medium">
                  <Brain className="mr-1 h-4 w-4" /> AI-Powered Recruitment
                </div>
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  Personalized Candidate Assessment Made Simple
                </h1>
                <p className="text-muted-foreground max-w-[600px] md:text-xl">
                  Leverage advanced AI to generate custom technical and HR tests
                  tailored to each candidate, proctor remotely, analyze results,
                  and make data-driven hiring decisions—all in one platform.
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/dashboard">
                  <Button size="lg">
                    Get Started with AI-Powered Assessments
                  </Button>
                </Link>
                <Link href="#ai-advantage">
                  <Button variant="outline" size="lg">
                    Discover AI Features
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="focus:ring-ring inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Everything You Need for Effective Candidate Assessment
                </h2>
                <p className="text-muted-foreground max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Interprep provides a complete solution for creating,
                  delivering, and analyzing personalized candidate assessments
                  with the power of AI.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-6xl items-center gap-6 py-12 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="bg-primary/10 rounded-full p-3">
                  <Brain className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">AI-Generated Tests</h3>
                <p className="text-muted-foreground text-center">
                  Our AI creates tailored technical and HR assessments based on
                  job descriptions, required skills, and candidate profiles.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="bg-primary/10 rounded-full p-3">
                  <FileText className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Personalized Content</h3>
                <p className="text-muted-foreground text-center">
                  Generate role-specific questions, coding challenges, and
                  behavioral assessments customized to each candidate&apos;s
                  background.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="bg-primary/10 rounded-full p-3">
                  <Mail className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Seamless Sharing</h3>
                <p className="text-muted-foreground text-center">
                  Share tests via email with a single click, automate reminders,
                  and track candidate engagement throughout the process.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="bg-primary/10 rounded-full p-3">
                  <Shield className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">AI Proctoring</h3>
                <p className="text-muted-foreground text-center">
                  Ensure test integrity with our secure, AI-powered proctoring
                  system that monitors for suspicious activities and verifies
                  candidate identity.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="bg-primary/10 rounded-full p-3">
                  <BarChart3 className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">AI-Powered Analysis</h3>
                <p className="text-muted-foreground text-center">
                  Get AI-generated insights on candidate performance, compare
                  against benchmarks, and receive intelligent hiring
                  recommendations.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="bg-primary/10 rounded-full p-3">
                  <Lock className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Secure Environment</h3>
                <p className="text-muted-foreground text-center">
                  Protect sensitive assessment data with enterprise-grade
                  security and compliance features.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="bg-primary/10 rounded-full p-3">
                  <Clock className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Time-Saving Automation</h3>
                <p className="text-muted-foreground text-center">
                  Reduce assessment creation time by 80% and automate scoring,
                  feedback, and candidate communications.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="bg-primary/10 rounded-full p-3">
                  <CheckCircle className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Objective Evaluation</h3>
                <p className="text-muted-foreground text-center">
                  Eliminate bias with standardized AI scoring and evaluation
                  metrics that focus on skills and capabilities.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-4 rounded-lg border p-6 shadow-sm">
                <div className="bg-primary/10 rounded-full p-3">
                  <Users className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Collaborative Hiring</h3>
                <p className="text-muted-foreground text-center">
                  Enable seamless team collaboration with shared assessments,
                  comments, and structured hiring workflows.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="ai-advantage"
          className="bg-muted/30 w-full py-12 md:py-24 lg:py-32"
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="focus:ring-ring inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none">
                  AI Advantage
                </div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  How Our AI Transforms Recruitment
                </h2>
                <p className="text-muted-foreground max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Discover how Interprep&apos;s advanced AI capabilities deliver
                  smarter, faster, and more effective hiring outcomes.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-8 py-12 lg:grid-cols-2">
              <div className="flex flex-col space-y-3 rounded-lg border p-6 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 rounded-full p-2">
                    <Zap className="text-primary h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold">
                    Smart Question Generation
                  </h3>
                </div>
                <p className="text-muted-foreground">
                  Our AI analyzes job requirements and candidate profiles to
                  generate highly relevant technical questions, coding
                  challenges, and behavioral scenarios that truly assess
                  job-relevant skills.
                </p>
              </div>
              <div className="flex flex-col space-y-3 rounded-lg border p-6 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 rounded-full p-2">
                    <Brain className="text-primary h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold">Adaptive Testing</h3>
                </div>
                <p className="text-muted-foreground">
                  Our AI dynamically adjusts question difficulty based on
                  candidate responses, creating a personalized assessment
                  experience that accurately gauges skill levels.
                </p>
              </div>
              <div className="flex flex-col space-y-3 rounded-lg border p-6 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 rounded-full p-2">
                    <LineChart className="text-primary h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold">Predictive Analytics</h3>
                </div>
                <p className="text-muted-foreground">
                  Leverage machine learning to identify correlations between
                  assessment performance and on-the-job success, helping you
                  refine your hiring criteria over time.
                </p>
              </div>
              <div className="flex flex-col space-y-3 rounded-lg border p-6 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="bg-primary/10 rounded-full p-2">
                    <Users className="text-primary h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-bold">Bias Reduction</h3>
                </div>
                <p className="text-muted-foreground">
                  Our AI algorithms are designed to minimize unconscious bias in
                  assessments, focusing exclusively on skills and capabilities
                  to promote diversity and inclusion.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section
          id="how-it-works"
          className="bg-muted/50 w-full py-12 md:py-24 lg:py-32"
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="focus:ring-ring inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none">
                  How It Works
                </div>
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Simple Process, AI-Powered Results
                </h2>
                <p className="text-muted-foreground max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our streamlined AI workflow makes candidate assessment
                  effortless from start to finish.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-4">
              <div className="relative flex flex-col items-center space-y-4 p-6">
                <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold">
                  1
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Input Requirements</h3>
                  <p className="text-muted-foreground text-center">
                    Enter job details, required skills, and candidate
                    information to guide the AI.
                  </p>
                </div>
                <div className="absolute top-10 right-0 hidden lg:block">
                  <ChevronRight className="text-muted-foreground h-6 w-6" />
                </div>
              </div>
              <div className="relative flex flex-col items-center space-y-4 p-6">
                <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold">
                  2
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">AI Test Generation</h3>
                  <p className="text-muted-foreground text-center">
                    Our AI creates a custom-tailored assessment with technical
                    and soft skill questions.
                  </p>
                </div>
                <div className="absolute top-10 right-0 hidden lg:block">
                  <ChevronRight className="text-muted-foreground h-6 w-6" />
                </div>
              </div>
              <div className="relative flex flex-col items-center space-y-4 p-6">
                <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold">
                  3
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Candidate Assessment</h3>
                  <p className="text-muted-foreground text-center">
                    Candidates take the test in our secure, AI-proctored
                    environment.
                  </p>
                </div>
                <div className="absolute top-10 right-0 hidden lg:block">
                  <ChevronRight className="text-muted-foreground h-6 w-6" />
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4 p-6">
                <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold">
                  4
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">AI-Powered Insights</h3>
                  <p className="text-muted-foreground text-center">
                    Receive detailed analytics, skill evaluations, and hiring
                    recommendations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-primary text-primary-foreground w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                  Ready to Transform Your Hiring with AI?
                </h2>
                <p className="max-w-[900px] md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Join forward-thinking companies using Interprep&apos;s AI to
                  find the best talent faster, reduce hiring costs by 60%, and
                  improve retention rates.
                </p>
              </div>
              <div className="mx-auto w-full max-w-sm space-y-2">
                <Link href="/dashboard">
                  <Button variant="secondary" size="lg">
                    Get Started with AI Assessments
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-background w-full border-t py-6">
        <div className="container mx-auto flex flex-col items-center justify-center gap-4 px-4 text-center">
          <div className="flex items-center gap-2">
            <FileText className="text-primary h-6 w-6" />
            <span className="text-xl font-bold">Interprep</span>
          </div>
          <p className="text-muted-foreground max-w-md text-sm">
            AI-powered platform for generating personalized technical
            assessments and streamlining your hiring process.
          </p>
          <div className="mt-2 flex flex-col items-center gap-2">
            <p className="text-muted-foreground text-xs">
              © {new Date().getFullYear()} Interprep. All rights reserved.
            </p>
            <p className="text-muted-foreground text-xs">
              Made with ❤️ for modern recruitment teams
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
