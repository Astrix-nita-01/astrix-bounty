'use client';

import Application from '@/components/Application';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import {
  CheckCircle2Icon,
  ClockIcon,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ApplicationInterface {
  id: number;
  applicantUsername: string;
  resume: string;
  status: 'pending' | 'accepted' | 'rejected';
  rating: number;
  submittedAt: string;
  bountyId: number;
  coverLetter: string;
}


export default function BountyApplications() {
    const { id } = useParams();
    const [requiredApplications, setRequiredApplications] = useState<ApplicationInterface[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const getAllApplications = async () => {
        if (!id) return console.log("page id not found");
        console.log(id);
        setIsLoading(true);
        try {
            const response = await axios.post(`/api/application/getByPrompts`, {
                bountyId: parseInt(id[0]),
            });

            console.log("applications: ", response.data);
            if (response.data.success) {
                setRequiredApplications(response.data.requiredAplications);
            }
            setIsLoading(false);
        } catch (error) {
            console.log("Can not get bounties: ", error);
            setIsLoading(false);
        }
    }

    const updateApplicationStatus = async (status: string, username: string, applicationId: number) => {
        console.log("loo")
        try {
            const payload = {
                username: username, 
                applicationId: applicationId,
                updatedstatus: status
            }
            const response = await axios.put("/api/application/updatestatus", payload);
            console.log(response.data);

            if(response.data.success) {
                getAllApplications();
            }
        } catch (error) {
            console.log("Can not update application status: ", error); 
        }
    }

    useEffect(() => {
        getAllApplications();
    }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="space-y-4">
            <h1 className="text-3xl font-bold text-foreground">Applications</h1>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="text-sm">
                <ClockIcon className="w-4 h-4 mr-1" />
                {requiredApplications.length} Applications
              </Badge>
              <Badge variant="outline" className="text-sm">
                <CheckCircle2Icon className="w-4 h-4 mr-1" />
                {requiredApplications.filter(app => app.status === 'accepted').length} Accepted
              </Badge>
            </div>
          </div>

          {/* Applications List */}
          <div className="space-y-4">
            {
                requiredApplications.length > 0 ? (
                    requiredApplications.map((application) => (
                        <Application key={application.id} application={application} updateApplicationStatus={updateApplicationStatus} />
                    ))
                ) : (
                    isLoading ? (
                        <p>Loading...</p>
                    ) : (
                        <p>No application yet</p>
                    )
                )
            }
          </div>
        </div>
      </div>
    </div>
  );
}