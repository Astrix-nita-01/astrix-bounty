import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import axios from "axios";
import { StarIcon, UserCircle } from "lucide-react";
import { Avatar } from "@radix-ui/react-avatar";

interface SubmissionInterface {
  id: number;
  submissionFile: string;
  submissionDetails: string;
  applicationId: number;
  bountyId: number;
  applicantUsername: string;
  submittedOn: string;
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

interface ApplicationInterface {
  id: number;
  applicantUsername: string;
  resume: string;
  status: "pending" | "accepted" | "rejected";
  rating: number;
  submittedAt: string;
  bountyId: number;
  coverLetter: string;
  appliedOn: string;
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

function SubmissionsToReview({
  submission,
  acceptSubmission,
  rejectSubmission
}: {
  submission: SubmissionInterface;
  acceptSubmission: (submissionId: number, applicantname: string) => Promise<void>;
  rejectSubmission: (submissionId: number) => Promise<void>;
}) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [bounty, setBounty] = useState<BountyInterface | null>(null);
  const [application, setApplication] = useState<ApplicationInterface | null>(
    null
  );
  const [applicant, setApplicant] = useState<UserDetailsInterface | null>(
    null
  );
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const getBountyById = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`/api/bounty/getbyid`, {
        bountyId: submission.bountyId,
      });

      console.log("bounty: ", response.data);
      if (response.data.success) {
        setBounty(response.data.bounty);
      }
    } catch (error) {
      console.log("Can not get bounties: ", error);
    } finally {
        setIsLoading(false);
    }
  };

  const getApplicationById = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(`/api/application/getbyid`, {
        applicationId: submission.applicationId,
      });

      console.log("application: ", response.data);
      if (response.data.success) {
        setApplication(response.data.application);
      }
    } catch (error) {
      console.log("Can not get bounties: ", error);
      setIsLoading(false);
    } finally {
        setIsLoading(false);
    }
  };

  const getApplicant = async () => {
    try {
        const response = await axios.post(`/api/user/getuser`, {
            username: submission.applicantUsername,
        });

        console.log("user: ", response.data);
        if (response.data.success) {
            setApplicant(response.data.user);
        }
    } catch (error) {
        console.log("Can not get applicant: ", error);
    } finally {
        setIsLoading(false);
    }
  }

  useEffect(() => {
    getBountyById()
    .then(() => getApplicationById())
    .finally(() => getApplicant());
  }, []);

  return (
    <div>
      {
        isLoading ? (
            <p>Loading...</p>
        ) : (
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                        <CardTitle>{bounty?.title}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-2">
                            {bounty?.description}
                        </p>
                        </div>
                        <Badge variant="destructive">{bounty?.category}</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <h2 className="text-lg font-semibold my-2">Application Details</h2>
                    <div className="space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-4">
                                <Avatar className="h-12 w-12">
                                    {applicant ? (
                                        // <Image
                                        //   src={userDetails.profilePicture}
                                        //   alt={userDetails.username}
                                        //   className="rounded-full object-cover"
                                        //   width={100}
                                        //   height={100}
                                        // />
                                        <UserCircle className="h-12 w-12" />
                                    ) : (
                                        <UserCircle className="h-12 w-12" />
                                    )}
                                </Avatar>
                                <div>
                                    <h2 className="text-xl font-semibold">
                                        {application?.applicantUsername}
                                    </h2>
                                    <div className="flex items-center space-x-4 mt-1">
                                        <div className="flex items-center text-yellow-500">
                                        <StarIcon className="w-4 h-4 fill-current" />
                                        <span className="ml-1 text-sm">
                                            {applicant ? applicant.ratings.toFixed(2) : 0.0}
                                        </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="my-4">
                          {application?.coverLetter}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                    <Button className="flex-1" variant="outline" onClick={() => setIsOpen(true)}>
                        View
                    </Button>
                </CardFooter>
            </Card>
        )
      }

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

            <div>
                <h2 className="text-2xl font-bold mb-4">{bounty?.title}</h2>

                <div className="flex flex-col gap-6 mb-6 overflow-y-auto">
                    <div>
                        <p className="font-semibold text-gray-700">Submission details:</p>
                        <p className="text-gray-600">{submission.submissionDetails}</p>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-700">Submission File</p>
                        <p className="text-gray-600">{submission.submissionFile === "" ? "No Submission File" : submission.submissionFile}</p>
                    </div>
                </div>

                {
                  applicant && (
                    <CardFooter className="flex gap-2">
                        <Button className="flex-1" variant="outline" onClick={() => acceptSubmission(submission.id, applicant.username)}>
                            Accept
                        </Button>
                        <Button className="flex-1" variant="outline" onClick={() => rejectSubmission(submission.id)}>
                            Reject
                        </Button>
                    </CardFooter>
                  )
                }
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}

export default SubmissionsToReview;
