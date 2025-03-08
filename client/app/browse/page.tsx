"use client";

import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StarIcon } from "lucide-react";

const prompts = [
  {
    id: 1,
    title: "AI-Powered Resume Builder",
    description: "Generate professional resumes with AI-driven suggestions, optimized formatting, and ATS compatibility for job seekers.",
    price: "0.12",
    category: "Productivity",
    rating: 4.9,
  },
  {
    id: 2,
    title: "E-Commerce Personalization Engine",
    description: "Boost sales with an AI-driven recommendation system that suggests products based on user behavior and market trends.",
    price: "0.2",
    category: "E-Commerce",
    rating: 4.8,
  },
  {
    id: 3,
    title: "AI Code Reviewer",
    description: "Improve code quality with automatic reviews, security checks, and performance optimizations for cleaner and efficient coding.",
    price: "0.18",
    category: "Programming",
    rating: 4.7,
  },
  {
    id: 4,
    title: "Blockchain-Powered Document Verification",
    description: "Securely verify and authenticate documents using blockchain technology for immutable record-keeping.",
    price: "0.25",
    category: "Blockchain",
    rating: 4.9,
  },
  {
    id: 5,
    title: "AI-Based Social Media Content Generator",
    description: "Generate high-quality social media posts, captions, and hashtags with AI-driven insights and trend analysis.",
    price: "0.1",
    category: "Marketing",
    rating: 4.8,
  }
];

export default function BrowsePage() {
  const [selectedPrompt, setSelectedPrompt] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filteredPrompts, setFilteredPrompts] = useState(prompts);

  const categories = ["All", ...new Set(prompts.map((prompt) => prompt.category))];

  // Handle Search Button Click
  const handleSearch = () => {
    const filtered = prompts.filter(
      (prompt) =>
        (prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prompt.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedCategory === "All" || prompt.category === selectedCategory)
    );
    setFilteredPrompts(filtered);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* <Navigation /> */}
      <main className="flex-1 container py-8">
        <div className="flex flex-col gap-8">
          {/* Search and Filter Bar */}
          <div className="flex items-center gap-4">
            <Input
              placeholder="Search for freelancers or projects..."
              className="max-w-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="p-2 border rounded-md"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category, index) => (
                <option key={index} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <Button className="rounded-full" onClick={handleSearch}>
              Search
            </Button>
          </div>

          {/* Prompts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPrompts.length > 0 ? (
              filteredPrompts.map((prompt) => (
                <Card key={prompt.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start gap-2">
                      <span>{prompt.title}</span>
                      <Badge className="flex" variant="secondary">{prompt.category}</Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {prompt.description.slice(0, 129)}...
                    </p>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex items-center gap-2">
                      <StarIcon className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                      <span className="text-sm">{prompt.rating}</span>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <span className="text-lg font-bold">
                      {prompt.price} ETH
                    </span>
                    <Button className="rounded-full" onClick={() => setSelectedPrompt(prompt)}>
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <p className="text-gray-500 text-center col-span-full">
                No results found.
              </p>
            )}
          </div>
        </div>
      </main>
      <Footer />

      {/* Large Layover (Full-Screen Modal) */}
      {selectedPrompt && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-md"
          onClick={() => setSelectedPrompt(null)}
        >
          <div
            className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-4xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-lg"
              onClick={() => setSelectedPrompt(null)}
            >
              ✖
            </button>
            <h2 className="text-2xl font-bold">{selectedPrompt.title}</h2>
            <p className="text-gray-600 mt-2">{selectedPrompt.description}</p>

            <div className="grid grid-cols-2 gap-6 mt-6">
              <div>
                <p>
                  <strong>Category:</strong> {selectedPrompt.category}
                </p>
              </div>
              <div>
                <p>
                  <strong>Rating:</strong> {selectedPrompt.rating} ⭐
                </p>
                <p>
                  <strong>Price:</strong> {selectedPrompt.price} ETH
                </p>
              </div>
            </div>

            <div className="mt-6">
              <Button className="w-full text-lg">Apply</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
