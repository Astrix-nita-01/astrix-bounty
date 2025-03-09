"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "@radix-ui/react-progress";
import { Button } from "./ui/button";
import axios from "axios";
import { Skeleton } from "./ui/skeleton";
import { Upload } from "lucide-react";
import { Input } from "./ui/input";
import uploadPDF from "@/utils/uploader";

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

function ActiveApplication({ application, account, connectWallet }: { application: ApplicationInterface, account: string | null, connectWallet: () => Promise<void> }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [bounty, setBounty] = useState<BountyInterface | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<{
    submissionDetails: string;
    submissionFile: string;
  }>({
    submissionDetails: "",
    submissionFile: ""
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [pdf, setPdf] = useState<File | null>(null);

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

  const submitBounty = async () => {
    if (!account) {
      console.log("connecting...");
      await handleConnect();
      return;
    }

    if(!bounty) {
      return console.log("bounty is undefined");
    }

    try {
      setIsSubmitting(true);

      let pdf_url = '';
      
      const formDataForFile = new FormData();
      if(pdf) {
        formDataForFile.append('pdf', pdf);
      }

      const uploadPdfRes = await uploadPDF(formDataForFile);
      const uploadPdfResObj = JSON.parse(uploadPdfRes);

      if(!uploadPdfResObj.success){
          return console.log("error uploading image: ", uploadPdfResObj.error);
      }
      
      pdf_url = uploadPdfResObj.pdfUrl;

      const payload = {
        applicantUsername: account,
        applicationId: application.id,
        bountyId: bounty.id, 
        submissionFile: pdf_url,
        submissionDetails: formData.submissionDetails
      };
      const response = await axios.post("/api/submission/submit", payload);

      console.log(response.data);

      if (!response.data.success) {
        console.log(`Can not post bounty: ${response.data.message}`);
      }

      setFormData({
        submissionDetails: "",
        submissionFile: ""
      });
      setIsSubmitted(true);
      setIsOpen(false);
    } catch (err) {
      console.log(`Failed to create bounty ${err}`);
    } finally {
      setIsLoading(false);
    }
  }

  const getBountyById = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`/api/bounty/getbyid`, {
        bountyId: application.bountyId
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

  const getIsSubmitted = async () => {
    try {
      const response = await axios.post(`/api/submission/getbyapplication`, {
        applicationId: application.id,
        username: account
      });

      console.log("submission: ", response.data);
      if (response.data.success) {
        if(response.data.submission) {
          setIsSubmitted(true);
        }
      }
    } catch (error) {
      console.log("Can not get submission: ", error);
    }
  }

  useEffect(() => {
    getBountyById();
    getIsSubmitted();
  }, []);

  return (
    <div>
      <Card key={application.id}>
        <CardHeader>
          <div className="flex justify-between items-start">
            {
              bounty ? (
                <div>
                  <CardTitle>{bounty.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    {bounty.description}
                  </p>
                </div>
              ) : (
                isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-6 w-[250px]" />
                    <Skeleton className="h-4 w-[350px]" />
                  </div>
                ) : (
                  <p>No such bounty found</p>
                )
              )
            }
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-end text-sm">
              <span className="mr-2">Budget:</span>
              <span>{bounty?.budget} HIVE</span>
            </div>
            <Progress value={75} />
            <div className="flex gap-2">
              <Button className="flex-1" variant="outline" onClick={() => setIsOpen(true)} disabled={!bounty || isSubmitting}>
                {isSubmitted ? "Already Submited" : isSubmitting ? "Submitting..." : "Submit"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Large Layover (Full-Screen Modal) */}
      {isOpen && (
        <div
          style={{ zIndex: 1000 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
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

            {bounty ? (
              <div>
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
                    Submission Details
                  </label>
                  <textarea
                    value={formData.submissionDetails}
                    onChange={(e) => setFormData({ ...formData, submissionDetails: e.target.value })}
                    className="w-full h-40 p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Write your submission details here..."
                  ></textarea>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Upload Submission File</p>
                  <label htmlFor="pdf-input" className="border-2 border-dashed rounded-lg p-6 text-center">
                      {
                        pdf ? (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {formData.submissionFile}
                          </p>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">
                              Drag and drop your submission file here, or click to browse
                            </p>
                          </>
                        )
                      }
                      <Input
                        type="file"
                        id="pdf-input"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFormData((prev) => ({
                              ...prev,
                              submissionFile: file.name,
                            }));
                            setPdf(file);
                          }
                        }}
                      />
                  </label>
                </div>

                <div className="mt-6">
                  <Button
                    className="w-full text-lg"
                    onClick={submitBounty}
                    disabled={isSubmitting || !formData.submissionDetails.trim()}
                  >
                    {isSubmitted ? "Already Submited" : isSubmitting ? "Submitting..." : "Submit"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Skeleton className="h-8 w-[300px]" />
                <Skeleton className="h-20 w-full" />
                <div className="grid grid-cols-2 gap-6">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}
    </div>
  );
}

export default ActiveApplication;
