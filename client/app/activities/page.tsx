"use client"

import { Footer } from "@/components/footer"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"
import axios from "axios"
import { useHiveWallet } from "@/wallet/HIveKeychainAdapter"
import ActiveApplication from "@/components/ActiveApplication"
import SubmissionsToReview from "@/components/SubmissionsToReview"

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

interface SubmissionInterface {
  id: number;
  submissionFile: string;
  submissionDetails: string;
  applicationId: number;
  bountyId: number;
  applicantUsername: string;
  submittedOn: string;
}

export default function GovernancePage() {
  const { isConnected, account, connectWallet } = useHiveWallet();
  const [activeApplications, setActiveApplications] = useState<ApplicationInterface[]>([]);
  const [submissionToReview, setSubmissionsToReview] = useState<SubmissionInterface[]>([]);
  const [isLoading, setIsloading] = useState<boolean>(false);
  const [isLoadingSubmission, setIsloadingSubmission] = useState<boolean>(false);

  const getActiveApplicationByUser = async () => {
    setIsloading(true);
    if (!isConnected || !account) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      const response = await axios.post("/api/application/getactivebyuser", { username: account });
      console.log(response.data)
      if(response.data.success) {
        setActiveApplications(response.data.activeApplications);
      } else {
        console.log("can not get active application by user: ", response.data.message);
      }
    } catch (error) {
      console.log("can not get active application by user: ", error);
    } finally {
      setIsloading(false);
    }
  }

  const getSubmissionsToReview = async () => {
    setIsloadingSubmission(true);
    if (!isConnected || !account) {
      return setIsloadingSubmission(false);;
    }

    try {
      const response = await axios.post("/api/submission/getallbybountycreator", { username: account });
      console.log(response.data)
      if(response.data.success) {
        setSubmissionsToReview(response.data.allSubmissionToReview);
      } else {
        console.log("can not get submissions to review by user: ", response.data.message);
        setIsloadingSubmission(false);
      }
    } catch (error) {
      console.log("can not get submissions to review by user: ", error);
    } finally {
      setIsloadingSubmission(false);
    }
  }

  const acceptSubmission = async (submissionId: number, applicantname: string) => {
    if (!isConnected || !account) {
      alert("Please connect your wallet first");
      return; 
    }

    try {
        const response = await axios.post(`/api/submission/accept`, {
          submissionId: submissionId,
          username: account,
          applicantname: applicantname
        });

        console.log("accept response: ", response.data);

        if(response.data.success) {
          getSubmissionsToReview();
        }
    } catch (error) {
        console.log("can not accept submission: ", error);
    }
  }

  const rejectSubmission = async (submissionId: number) => {
    if (!isConnected || !account) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      console.log("first")
        const response = await axios.post(`/api/submission/reject`, {
          submissionId: submissionId,
          username: account
        });

        console.log("reject response: ", response.data);

        if(response.data.success) {
          getSubmissionsToReview();
        }
    } catch (error) {
        console.log("can not accept submission: ", error);
    }
  }

  useEffect(() => {
    getActiveApplicationByUser();
    getSubmissionsToReview();
  }, [account]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* <Navigation /> */}
      <main className="flex-1 container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Activity</h1>
            <p className="text-muted-foreground">
              Review submissions on your bounty or do submission to your application
            </p>
          </div>

          <Tabs defaultValue="active-proposals">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active-proposals">Active Proposals</TabsTrigger>
              <TabsTrigger value="review-submission">Review Submission</TabsTrigger>
            </TabsList>

            <TabsContent value="active-proposals" className="mt-6">
              <div className="grid gap-6">
                {
                  activeApplications.length > 0 ? (
                    activeApplications.map((application) => {
                      return (
                        <ActiveApplication application={application} key={application.id} account={account} connectWallet={connectWallet} />
                      );
                    })
                  ) : (
                    isLoading ? (
                      <p>Loading...</p>
                    ) : (
                      <p>No active proposal of you was found</p>
                    )
                  )
                }
              </div>
            </TabsContent>

            <TabsContent value="review-submission" className="mt-6">
              <div className="grid gap-6">
                {
                  submissionToReview.length > 0 ? (
                    submissionToReview.map((submission) => {
                      return (
                        <SubmissionsToReview key={submission.id} submission={submission} acceptSubmission={acceptSubmission} rejectSubmission={rejectSubmission} />
                      );
                    })
                  ) : (
                    isLoadingSubmission ? (
                      <p>Loading...</p>
                    ) : (
                      <p>No submissions to review for you</p>
                    )
                  )
                }
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  )
}

