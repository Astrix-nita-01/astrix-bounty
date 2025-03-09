"use client";

import { useEffect, useState } from "react";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useHiveWallet } from "@/wallet/HIveKeychainAdapter";
import * as dotenv from "dotenv";

dotenv.config();

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

interface UserDetailsInterface {
  id: number;
  username: string;
  skills: string;
  projects: {
    title: string;
    description: string;
    link: string;
  }[];
  resume: string;
  description: string;
  profilePicture: string;
  ratings: number;
}

export default function BrowsePage() {
  const { isConnected, account, connectWallet } = useHiveWallet();
  const router = useRouter();

  const [allBounties, setAllBounties] = useState<BountyInterface[]>([]);
  const [userDetails, setUserDetails] = useState<UserDetailsInterface | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
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

  const handleConnect = async () => {
    try {
      setIsLoading(true);
      await connectWallet();
    } catch (err) {
      console.log(`Failed to connect wallet: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserDetails = async () => {
    if (!isConnected || !account) {
      handleConnect();
      return
    }
    setIsLoading(false);
    try {
        const response = await axios.post(`/api/user/getuser`, {
            username: account,
        });

        console.log("user: ", response.data);
        if (response.data.success) {
            setUserDetails(response.data.user);
        }
    } catch (error) {
        console.log("Can not get applicant: ", error);
    } finally {
        setIsLoading(false);
    }
  }

  const getBountyById = async (id: number) => {
    try {
      const response = await axios.post(`/api/bounty/getbyid`, {
        bountyId: id,
      });

      console.log("bounty: ", response.data);
      if (response.data.success) {
        return response.data.bounty;
      }
    } catch (error) {
      console.log("Can not get bounties: ", error);
      return null;
    }
  };

  const getAllBounties = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/bounty/getAll");

      console.log("all bounties: ", response.data);
      
      if (response.data.success) {
        if(response.data.allBounties.length > 0) {
          if(!process.env.NEXT_PUBLIC_MODEL_URL) {
            setAllBounties(response.data.allBounties);
            setfilteredBounties(response.data.allBounties);
            console.log("env is not there");
          } else {
            if(!userDetails) {
              setAllBounties(response.data.allBounties);
              setfilteredBounties(response.data.allBounties);
              console.log("user is not there");
            } else {
              console.log("env: ", process.env.NEXT_PUBLIC_MODEL_URL);
              const res = await axios.post(process.env.NEXT_PUBLIC_MODEL_URL, {
                skills: userDetails.skills,
                jobs: response.data.allBounties.map((bounty: BountyInterface) => {
                  return {
                    id: bounty.id,
                    title: bounty.title,
                    required_skills: bounty.skillsRequired,
                  }
                })
              });
    
              console.log("AI recommended job: ", res.data);

              const recommendedBounties = [];
              // Getting all bounties recommended by AI from data base
              for(const bountyId of res.data.matched_jobs) {
                const bounty = await getBountyById(bountyId);
                if(bounty) {
                  recommendedBounties.push(bounty);
                }
              }

              if (recommendedBounties.length > 0) {
                setAllBounties(recommendedBounties);
                setfilteredBounties(recommendedBounties);
              }
            }
          }
        }
      }

    } catch (error) {
      console.log("Can not get bounties: ", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    getUserDetails();
  }, [account]);

  useEffect(() => {
    getAllBounties()
  }, [userDetails]);

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
              isLoading ? (
                <p className="text-gray-500 text-center col-span-full">
                  Loading...
                </p>
              ) : (
                <p className="text-gray-500 text-center col-span-full">
                  No results found.
                </p>
              )
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
