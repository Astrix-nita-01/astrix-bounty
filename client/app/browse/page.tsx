"use client";

import { useEffect, useState } from "react";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { useRouter } from "next/navigation";

interface BountyInterface {
  budget: number
  category: string
  description: string
  id: number
  postedByUsername: string
  promptFile: string
  skillsRequired: string[]
  title: string
}

export default function BrowsePage() {

  const router = useRouter();

  const [allBounties, setAllBounties] = useState<BountyInterface[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [filteredBounties, setfilteredBounties] = useState<BountyInterface[]>([]);

  const categories = ["All", ...new Set(allBounties.map((bounty) => bounty.category))];

  // Handle Search Button Click
  const handleSearch = () => {
    const filtered = allBounties.filter(
      (prompt) =>
        (prompt.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          prompt.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedCategory === "All" || prompt.category === selectedCategory)
    );
    setfilteredBounties(filtered);
  };

  const getAllBounties = async () => {
    try {
      const response = await axios.get("/api/bounty/getAll");

      console.log("all bounties: ", response.data);
      setAllBounties(response.data.allBounties);
      setfilteredBounties(response.data.allBounties);
    } catch (error) {
      console.log("Can not get bounties: ", error) ;
    }
  }

  useEffect(() => {
    getAllBounties();
  }, []);

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
            {filteredBounties.length > 0 ? (
              filteredBounties.map((bounty) => (
                <Card key={bounty.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start gap-2">
                      <span>{bounty.title}</span>
                      <Badge className="flex" variant="secondary">{bounty.category}</Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {bounty.description.slice(0, 129)}...
                    </p>
                  </CardHeader>
                  <CardFooter className="flex justify-between items-center">
                    <span className="text-lg font-bold">
                      {bounty.budget} HIVE
                    </span>
                    <Button className="rounded-full" onClick={() => router.push(`/browse/${bounty.id}`)}>
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
    </div>
  );
}
