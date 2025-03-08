"use client";

import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload } from "lucide-react";
import { useState } from "react";
import PaymentOverlay from "@/components/paymentoverlay";
import { useHiveWallet } from "@/wallet/HIveKeychainAdapter";
import axios from "axios";

export default function SellPage() {
  const { account, connectWallet } = useHiveWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    promptFile: "",
    budget: 0,
    skillsRequired: [] as string[],
  });
  const [newSkill, setNewSkill] = useState("");
  const [showPayment, setShowPayment] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleSkillAdd = () => {
    if (newSkill && !formData.skillsRequired.includes(newSkill)) {
      setFormData((prev) => ({
        ...prev,
        skillsRequired: [...prev.skillsRequired, newSkill],
      }));
      setNewSkill("");
    }
  };

  const handleSkillRemove = (skillToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      skillsRequired: prev.skillsRequired.filter(
        (skill) => skill !== skillToRemove
      ),
    }));
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

  const payAmount = async () => {
    if (!account) {
      console.log("connecting...");
      await handleConnect();
      return;
    }

    setShowPayment(true);
  }

  const handleSubmit = async () => {
    if (!account) {
      console.log("connecting...");
      await handleConnect();
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const payload = {
        username: account,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        promptFile: formData.promptFile,
        budget: formData.budget,
        skillsRequired: formData.skillsRequired,
      };

      const response = await axios.post("/api/bounty/create", payload);

      console.log(response.data);

      if (!response.data.success) {
        console.log(`Can not post bounty: ${response.data.message}`);
      }

      // Reset form after successful submission
      setFormData({
        title: "",
        description: "",
        category: "",
        promptFile: "",
        budget: 0,
        skillsRequired: [],
      });
      setShowPayment(false);
    } catch (err) {
      setError(`Failed to create bounty ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* <Navigation /> */}
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="new">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">New Bounty</TabsTrigger>
              <TabsTrigger value="listings">My Listings</TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>List a New Bounty</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <Input
                      placeholder="Enter bounty title"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      placeholder="Describe your bounty..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="creative">
                          Creative Writing
                        </SelectItem>
                        <SelectItem value="coding">Coding</SelectItem>
                        <SelectItem value="marketing">Marketing</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Required Skills
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a skill"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleSkillAdd()
                        }
                      />
                      <Button type="button" onClick={handleSkillAdd}>
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.skillsRequired.map((skill) => (
                        <Badge key={skill} className="flex items-center gap-1">
                          {skill}
                          <button
                            onClick={() => handleSkillRemove(skill)}
                            className="ml-1 hover:text-red-500"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Budget (HIVE)</label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="eg. 5"
                        className="pl-9"
                        value={formData.budget}
                        onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Upload Bounty File
                    </label>
                    <div className="border-2 border-dashed rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Drag and drop your bounty file here, or click to browse
                      </p>
                      <Input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData((prev) => ({
                              ...prev,
                              promptFile: file.name,
                            }));
                          }
                        }}
                      />
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    onClick={payAmount}
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Bounty..." : "Create Bounty"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
      {/* Payment Overlay */}

      {showPayment && (
        <PaymentOverlay amount={formData.budget.toString()} onClose={() => setShowPayment(false)} handleSubmit={() => handleSubmit()} />
      )}
    </div>
  );
}
