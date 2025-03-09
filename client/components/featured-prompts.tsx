"use client";

import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react";
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

export function FeaturedPrompts() {
  const router = useRouter();

  const [fetureBounties, setfetureBounties] = useState<BountyInterface[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getAllBounties = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/bounty/getAll");

      console.log("all bounties: ", response.data);
      
      if (response.data.success) {
        const requiredBounties = response.data.allBounties.slice(0, 8);
        setfetureBounties(requiredBounties);
      }

    } catch (error) {
      console.log("Can not get bounties: ", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(()=> {
    getAllBounties();
  }, []);

  return (
    <section className="py-16 px-6">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold tracking-tight text-center mb-12">Featured Prompts</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {
            fetureBounties.length > 0 ? (
              fetureBounties.map((bounty) => (
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
              isLoading ? (
                <p className="text-gray-500 text-center col-span-full">
                  Loading...
                </p>
              ) : (
                <p className="text-gray-500 text-center col-span-full">
                  No results found.
                </p>
              )
            )
          }
        </div>
      </div>
    </section>
  )
}