"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import axios from "axios";
import { BriefcaseIcon, TagIcon, UserCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useHiveWallet } from "@/wallet/HIveKeychainAdapter";

interface BountyInterface {
  budget: number;
  category: string;
  description: string;
  id: number;
  postedByUsername: string;
  promptFile: string;
  skillsRequired: string[];
  title: string;
  postedOn: string;
}

interface ApplicationInterface {
  id: number;
  applicantUsername: string;
  resume: string;
  status: 'pending' | 'accepted' | 'rejected';
  rating: number;
  submittedAt: string;
  bountyId: number;
  coverLetter: string;
  appliedOn: string;
}

export default function BountyDetails() {
  const { account, connectWallet, isConnected } = useHiveWallet();
  const { id } = useParams();

  const [bounty, setBounty] = useState<BountyInterface | null>(null);
  const [isAppliedByUser, setIsAppliedByUser] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingApply, setIsLoadingApply] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [coverLetter, setCoverLetter] = useState<string>("");

  const getBountyById = async () => {
    if (!id) return console.log("page id not found");

    if (!isConnected || !account) {
      alert("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`/api/bounty/getbyid`, {
        bountyId: parseInt(id[0]),
      });

      console.log("bounty: ", response.data);
      if (response.data.success) {
        setBounty(response.data.bounty);
      }
      setIsLoading(false);
    } catch (error) {
      console.log("Can not get bounties: ", error);
      setIsLoading(false);
    }
  };

  const getApplicationsByUser = async () => {
    if (!id) return console.log("page id not found");
    
    if (!isConnected || !account) {
      return;
    }

    try {
      const response = await axios.post(`/api/application/getAppliedbyuser`, {
        username: account,
      });

      console.log("applications by user: ", response.data);
      if (response.data.success) {
        setIsAppliedByUser(response.data.applicationsByUser.filter((application: ApplicationInterface) => application.bountyId.toString() === id[0]).length > 0)
      }
      setIsLoading(false);
    } catch (error) {
      console.log("Can not get bounties: ", error);
      setIsLoading(false);
    }
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

  const applyToPrompt = async () => {
    if (!id) return console.log("page id not found");
    if (!account) {
      console.log("connecting...");
      await handleConnect();
      return;
    }

    try {
      setIsLoadingApply(true);

      const payload = {
        bountyId: parseInt(id[0]),
        coverLetter: coverLetter,
        username: account,
      };
      const response = await axios.post("/api/application/create", payload);

      console.log(response.data);

      if (!response.data.success) {
        console.log(`Can not apply to bounty: ${response.data.message}`);
      }

      setCoverLetter("");
      setIsOpen(false);
      setIsAppliedByUser(true);
    } catch (err) {
      console.log(`Failed to create bounty ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getBountyById();
    getApplicationsByUser();
  }, [account]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {bounty ? (
          <div className="space-y-8">
            {/* Header Section */}
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-foreground">
                {bounty.title}
              </h1>
              <div className="flex items-center space-x-4">
                <Badge variant="secondary" className="text-sm">
                  <TagIcon className="w-4 h-4 mr-1" />
                  {bounty.category}
                </Badge>
                <Badge variant="outline" className="text-sm">
                  <BriefcaseIcon className="w-4 h-4 mr-1" />${bounty.budget}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Description</h2>
                  <p className="text-muted-foreground">{bounty.description}</p>
                </Card>

                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4">
                    Required Skills
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {bounty.skillsRequired.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <UserCircle className="w-10 h-10 text-muted-foreground" />
                    <div>
                      <h3 className="font-medium">Posted by</h3>
                      <p className="text-sm text-muted-foreground">
                        {bounty.postedByUsername}
                      </p>
                    </div>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => setIsOpen(true)}
                    disabled={bounty.postedByUsername === account ||isAppliedByUser}
                  >
                    Apply Now
                  </Button>
                </Card>

                <Card className="p-6">
                  <h3 className="font-medium mb-2">Prompt File</h3>
                  {bounty.promptFile === "" ? (
                    <p className="text-gray-400 font-semibold italic">
                      no prompt file
                    </p>
                  ) : (
                    <a
                      href="#"
                      className="text-sm text-primary hover:underline flex items-center"
                    >
                      {bounty.promptFile}
                    </a>
                  )}
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <p>{isLoading ? <p>Loading....</p> : <p>No such bounty</p>}</p>
        )}
      </div>

      {/* Large Layover (Full-Screen Modal) */}
      {isOpen && bounty && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-4xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-lg"
              onClick={() => setIsOpen(false)}
            >
              ✖
            </button>
            <h2 className="text-2xl font-bold mb-4">{bounty.title}</h2>
            <p className="text-gray-600 mb-6">{bounty.description}</p>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="font-semibold text-gray-700">Category:</p>
                <p className="text-gray-600">{bounty.category}</p>
              </div>
              <div>
                <p className="font-semibold text-gray-700">Budget:</p>
                <p className="text-gray-600">{bounty.budget} HIVE</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block font-semibold text-gray-700">
                Cover Letter
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="w-full h-40 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Write your cover letter here..."
              ></textarea>
            </div>

            <div className="mt-6">
              <Button
                className="w-full text-lg"
                onClick={applyToPrompt}
                disabled={isLoadingApply || !coverLetter.trim()}
              >
                {isLoadingApply ? "Applying..." : "Submit Application"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
