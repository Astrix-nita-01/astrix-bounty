'use client';

import React, { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Avatar } from "@radix-ui/react-avatar";
import { StarIcon, UserCircle } from "lucide-react";
import axios from "axios";
import { Button } from "./ui/button";
// import Image from "next/image";

interface ApplicationInterface {
  id: number;
  applicantUsername: string;
  resume: string;
  status: "pending" | "accepted" | "rejected";
  rating: number;
  submittedAt: string;
  bountyId: number;
  coverLetter: string;
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

const StatusBadge = ({
  status,
}: {
  status: ApplicationInterface["status"];
}) => {
  const variants = {
    pending: "bg-yellow-100 text-yellow-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };

  const labels = {
    pending: "Pending",
    accepted: "Accepted",
    rejected: "Rejected",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium ${variants[status]}`}
    >
      {labels[status]}
    </span>
  );
};

function Application({ application, updateApplicationStatus }: { application: ApplicationInterface, updateApplicationStatus: (status: string, username: string, applicationId: number) => void }) {
  const [userDetails, setUserDetails] = useState<UserDetailsInterface | null>(
    null
  );

  const getUser = async () => {
    try {
      const response = await axios.post(`/api/user/getuser`, {
        username: application.applicantUsername,
      });

      console.log("user: ", response.data);
      if (response.data.success) {
        setUserDetails(response.data.user);
      }
    } catch (error) {
      console.log("Can not get bounties: ", error);
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  return (
    <Card key={application.id} className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              {userDetails ? (
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
                {application.applicantUsername}
              </h2>
              <div className="flex items-center space-x-4 mt-1">
                <div className="flex items-center text-yellow-500">
                  <StarIcon className="w-4 h-4 fill-current" />
                  <span className="ml-1 text-sm">{userDetails ? userDetails.ratings.toFixed(2) : 0.0}</span>
                </div>
              </div>
            </div>
          </div>
          <StatusBadge status={application.status} />
        </div>

        {/* Cover Letter */}
        <div>
          <h3 className="font-medium mb-2">Cover Letter</h3>
          <p className="text-muted-foreground">{application.coverLetter}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-6">
            <div>
              <span className="text-sm text-muted-foreground">Submitted</span>
              <p className="font-semibold">
                {new Date(application.submittedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {application.status === "pending" && (
              <>
                <Button variant="destructive" onClick={() => updateApplicationStatus("rejected", application.applicantUsername, application.id)}>Reject</Button>
                <Button onClick={() => updateApplicationStatus("accepted", application.applicantUsername, application.id)}>Accept</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default Application;
