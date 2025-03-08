"use client";

import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/badge";
import { Wallet, History, Settings } from "lucide-react";
import { useHiveWallet } from "@/wallet/HIveKeychainAdapter";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import axios from 'axios';

interface UserProfile {
  skills: string[]
  projects: {
    title: string
    description: string
    link: string
  }[]
  resume: string
  description: string
  profilePicture: string
}

export default function ProfilePage() {
  const { account, connectWallet } = useHiveWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    skills: [],
    projects: [],
    resume: "",
    description: "",
    profilePicture: "",
  });
  const [newSkill, setNewSkill] = useState("");
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    link: "",
  });

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

  const handleAddSkill = () => {
    if (newSkill && !profile.skills.includes(newSkill)) {
      setProfile((prev) => ({
        ...prev,
        skills: [...prev.skills, newSkill],
      }));
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleAddProject = () => {
    if (newProject.title && newProject.description) {
      setProfile((prev) => ({
        ...prev,
        projects: [...prev.projects, newProject],
      }));
      setNewProject({ title: "", description: "", link: "" });
    }
  };

  const handleRemoveProject = (index: number) => {
    setProfile((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!account) {
      console.log("connecting...");
      await handleConnect();
      return;
    }

    try {
      setIsLoading(true); 
      const response = await axios.post("/api/user/upsertuser", {
        username: account, ...profile,
      });

      console.log("response: ", response.data);

      if(!response.data.success) {
        return console.log("err : ", response.data);
      }

      setProfile(response.data.user);
      
      console.log("Profile saved successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      if (!account) return;
      
      try {
        const userDataResponse = await axios.post("/api/user/getuser", { username: account });
        console.log("user response: ", userDataResponse.data);

        if(userDataResponse.data.success) {
          const userDetails = userDataResponse.data.user;
          setProfile({
            skills: userDetails.skills || [],
            projects: userDetails.projects || [],
            resume: userDetails.resume || "",
            description: userDetails.description || "",
            profilePicture: userDetails.profilePicture || "",
          });
        }
      } catch (error) {
        console.log("Error loading profile:", error);
      }
    };
    
    loadProfile();
  }, [account]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* <Navigation /> */}
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-6 mb-8">
            <Avatar className="h-24 w-24">
              <AvatarImage src={profile.profilePicture || "/placeholder.svg"} />
              <AvatarFallback>{account ? account.slice(0, 2).toUpperCase() : 'HD'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{account || "Connect Wallet"}</h1>
              <p className="text-muted-foreground">
                {profile.description ? profile.description.substring(0, 100) + "..." : "No description yet"}
              </p>
            </div>
            {!account ? (
              <Button onClick={handleConnect} className="rounded-full">
                {isLoading ? "Connecting..." : "Connect Wallet"}
              </Button>
            ) : (
              <Button onClick={() => document.getElementById('settings-tab')?.click()} className="rounded-full">
                Edit Profile
              </Button>
            )}
          </div>

          <Tabs defaultValue="activity">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="wallet">Wallet</TabsTrigger>
              <TabsTrigger id="settings-tab" value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="mt-6">
              <div className="grid gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Activity Items */}
                      <div className="flex justify-between items-center py-2 border-b">
                        <div>
                          <p className="font-medium">
                            Purchased {"SEO Content Optimizer"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            2 days ago
                          </p>
                        </div>
                        <Badge className="text-white">0.08 ETH</Badge>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b">
                        <div>
                          <p className="font-medium">
                            Sold {"Creative Story Generator"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            5 days ago
                          </p>
                        </div>
                        <Badge className="text-white">0.1 ETH</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="wallet" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Wallet Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Connected Wallet
                      </p>
                      <p className="font-mono">0x1234...5678</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className="text-2xl font-bold">2.5 ETH</p>
                    </div>
                    <Button className="w-full">Withdraw Funds</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Profile Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label>Profile Picture URL</label>
                      <Input
                        type="url"
                        value={profile.profilePicture}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            profilePicture: e.target.value,
                          }))
                        }
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>

                    <div className="space-y-2">
                      <label>Description</label>
                      <Textarea
                        value={profile.description}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Tell us about yourself..."
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label>Resume/Portfolio Link</label>
                      <Input
                        type="url"
                        value={profile.resume}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            resume: e.target.value,
                          }))
                        }
                        placeholder="https://example.com/resume"
                      />
                    </div>

                    <div className="space-y-2">
                      <label>Skills</label>
                      <div className="flex gap-2">
                        <Input
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          placeholder="Add a skill"
                        />
                        <Button type="button" onClick={handleAddSkill}>
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.skills.map((skill) => (
                          <Badge
                            key={skill}
                            className="flex items-center gap-1"
                          >
                            {skill}
                            <button
                              onClick={() => handleRemoveSkill(skill)}
                              className="ml-1 hover:text-red-500"
                            >
                              ×
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 border-2 rounded-xl p-5">
                      <label>Projects</label>
                      <div className="space-y-4">
                        <div className="grid gap-4">
                          <Input
                            placeholder="Project Title"
                            value={newProject.title}
                            onChange={(e) =>
                              setNewProject((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                          />
                          <Input
                            placeholder="Project Link"
                            value={newProject.link}
                            onChange={(e) =>
                              setNewProject((prev) => ({
                                ...prev,
                                link: e.target.value,
                              }))
                            }
                          />
                          <Textarea
                            placeholder="Project Description"
                            value={newProject.description}
                            onChange={(e) =>
                              setNewProject((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                          />
                          <Button type="button" onClick={handleAddProject}>
                            Add Project
                          </Button>
                        </div>

                        <div className="space-y-4">
                          {profile.projects.map((project, index) => (
                            <Card key={index}>
                              <CardContent className="pt-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-bold">
                                      {project.title}
                                    </h4>
                                    <a
                                      href={project.link}
                                      className="text-sm text-blue-500"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {project.link}
                                    </a>
                                    <p className="text-sm mt-1">
                                      {project.description}
                                    </p>
                                  </div>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleRemoveProject(index)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleSubmit}
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}
