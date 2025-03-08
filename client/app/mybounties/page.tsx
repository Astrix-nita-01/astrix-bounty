"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useHiveWallet } from "@/wallet/HIveKeychainAdapter";
import axios from "axios";
import {
  BriefcaseIcon,
  ChevronRightIcon,
  PlusCircleIcon,
  TagIcon,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface BountyInterface {
  budget: number;
  category: string;
  description: string;
  id: number;
  postedByUsername: string;
  promptFile: string;
  skillsRequired: string[];
  title: string;
}

// Mock data - replace with actual API call
// const mockBounties: BountyInterface[] = [
//   {
//     budget: 500,
//     category: 'Creative Writing',
//     description: 'Looking for an experienced writer to create engaging AI prompts for a storytelling application.',
//     id: 1,
//     postedByUsername: 'creativeMind',
//     promptFile: 'prompt_requirements.pdf',
//     skillsRequired: ['Creative Writing', 'AI Prompt Engineering', 'Storytelling'],
//     title: 'AI Prompt Writing for Storytelling Application'
//   },
//   {
//     budget: 800,
//     category: 'Development',
//     description: 'Need a developer to create custom GPT prompts for a code generation tool.',
//     id: 2,
//     postedByUsername: 'creativeMind',
//     promptFile: 'technical_specs.pdf',
//     skillsRequired: ['Programming', 'AI Development', 'Technical Writing'],
//     title: 'GPT Code Generation Prompts'
//   },
//   {
//     budget: 300,
//     category: 'Marketing',
//     description: 'Seeking marketing expert to develop AI prompts for social media content generation.',
//     id: 3,
//     postedByUsername: 'creativeMind',
//     promptFile: 'marketing_brief.pdf',
//     skillsRequired: ['Marketing', 'Social Media', 'Content Strategy'],
//     title: 'Social Media AI Prompt Development'
//   }
// ];

interface BountyInterface {
  budget: number;
  category: string;
  description: string;
  id: number;
  postedByUsername: string;
  promptFile: string;
  skillsRequired: string[];
  title: string;
}

export default function UserBounties() {
  const { isConnected, account } = useHiveWallet();
  const [bounties, setBounties] = useState<BountyInterface[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const getBountyById = async () => {
    if (!isConnected || !account) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      const response = await axios.post(`/api/bounty/getbyuser`, {
        username: account,
      });

      console.log("bounty: ", response.data);
      if (response.data.success) {
        setBounties(response.data.requiredBounties);
      }
      setIsLoading(false);
    } catch (error) {
      console.log("Can not get bounties: ", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getBountyById();
  }, [account]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-foreground">My Bounties</h1>
            <Link
              href="/bounties/create"
              className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <PlusCircleIcon className="w-5 h-5 mr-2" />
              Create New Bounty
            </Link>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-6">
              <h3 className="text-sm font-medium text-muted-foreground">
                Total Bounties
              </h3>
              <p className="text-2xl font-bold">{bounties.length}</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-sm font-medium text-muted-foreground">
                Active Bounties
              </h3>
              <p className="text-2xl font-bold">{bounties.length}</p>
            </Card>
            <Card className="p-6">
              <h3 className="text-sm font-medium text-muted-foreground">
                Total Budget
              </h3>
              <p className="text-2xl font-bold">
                ${bounties.reduce((sum, bounty) => sum + bounty.budget, 0)}
              </p>
            </Card>
          </div>

          {/* Bounties List */}
          <div className="space-y-4">
            {bounties.length > 0
              ? bounties.map((bounty) => (
                  <Link
                    key={bounty.id}
                    href={`/mybounties/${bounty.id}`}
                    className="my-3"
                  >
                    <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div className="space-y-4">
                          <div>
                            <h2 className="text-xl font-semibold mb-2">
                              {bounty.title}
                            </h2>
                            <p className="text-muted-foreground line-clamp-2">
                              {bounty.description}
                            </p>
                          </div>

                          <div className="flex items-center space-x-4">
                            <Badge variant="secondary" className="text-sm">
                              <TagIcon className="w-4 h-4 mr-1" />
                              {bounty.category}
                            </Badge>
                            <Badge variant="outline" className="text-sm">
                              <BriefcaseIcon className="w-4 h-4 mr-1" />$
                              {bounty.budget}
                            </Badge>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {bounty.skillsRequired.map((skill) => (
                              <Badge
                                key={skill}
                                variant="secondary"
                                className="bg-secondary/50"
                              >
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <ChevronRightIcon className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </Card>
                  </Link>
                ))
              : isLoading
              ? "Loading..."
              : "No bounties Posted by you"}
          </div>
        </div>
      </div>
    </div>
  );
}
