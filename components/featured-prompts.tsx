import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StarIcon } from "lucide-react"

const featuredPrompts = [
    {
      id: 1,
      title: "AI-Powered Resume Builder",
      description: "Generate professional resumes with AI-driven suggestions, optimized formatting, and ATS compatibility for job seekers.",
      price: "0.12 ETH",
      category: "Productivity",
      rating: 4.9,
    },
    {
      id: 2,
      title: "E-Commerce Personalization Engine",
      description: "Boost sales with an AI-driven recommendation system that suggests products based on user behavior and market trends.",
      price: "0.2 ETH",
      category: "E-Commerce",
      rating: 4.8,
    },
    {
      id: 3,
      title: "AI Code Reviewer",
      description: "Improve code quality with automatic reviews, security checks, and performance optimizations for cleaner and efficient coding.",
      price: "0.18 ETH",
      category: "Programming",
      rating: 4.7,
    },
    {
      id: 4,
      title: "Blockchain-Powered Document Verification",
      description: "Securely verify and authenticate documents using blockchain technology for immutable record-keeping.",
      price: "0.25 ETH",
      category: "Blockchain",
      rating: 4.9,
    },
    {
      id: 5,
      title: "AI-Based Social Media Content Generator",
      description: "Generate high-quality social media posts, captions, and hashtags with AI-driven insights and trend analysis.",
      price: "0.1 ETH",
      category: "Marketing",
      rating: 4.8,
    }
  ];
  

export function FeaturedPrompts() {
  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-12">Featured Prompts</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredPrompts.map((prompt) => (
            <Card key={prompt.id} className="group relative overflow-hidden transition-all hover:shadow-lg">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{prompt.title}</CardTitle>
                    <CardDescription className="mt-2">{prompt.description}</CardDescription>
                  </div>
                  <Badge variant="secondary">{prompt.category}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-yellow-500">
                  <StarIcon className="h-4 w-4 fill-current" />
                  <span className="text-sm font-medium">{prompt.rating}</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <span className="text-lg font-bold">{prompt.price}</span>
                <Button>Buy Now</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

