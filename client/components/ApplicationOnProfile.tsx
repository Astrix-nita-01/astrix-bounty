import React, { useEffect, useState } from 'react';
import { Badge } from './ui/badge';
import axios from 'axios';

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

function ApplicationOnProfile({ application }: { application: ApplicationInterface }) {
    const [bounty, setBounty] = useState<BountyInterface | null>(null);

    const getTimeAgo = (date: string) => {
        const now = new Date();
        const postedDate = new Date(date);
        const diffInMilliseconds = now.getTime() - postedDate.getTime();
        const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 0) {
          const diffInHours = Math.floor(diffInMilliseconds / (1000 * 60 * 60));
          if (diffInHours === 0) {
            const diffInMinutes = Math.floor(diffInMilliseconds / (1000 * 60));
            return `${diffInMinutes} minutes ago`;
          }
          return `${diffInHours} hours ago`;
        }
        if (diffInDays === 1) return 'yesterday';
        return `${diffInDays} days ago`;
    };

    const getBountyByApplication = async () => {
        try {
            const res = await axios.post("/api/bounty/getbyid", { bountyId: application.bountyId });
            setBounty(res.data.bounty);
        } catch (error) {
            console.log("can not get bounty: ", error);
        }
    }

    useEffect(() => {
        getBountyByApplication();
    }, []);

    return (
        <div key={application.id} className="flex justify-between items-center py-2 border-b">
            <div>
            <p className="font-medium">
                Applied to {bounty?.title}
            </p>
            <p className="text-sm text-muted-foreground">
                {bounty?.postedOn ? getTimeAgo(bounty.postedOn) : 'Loading...'}
            </p>
            </div>
            <Badge className="text-white">{bounty?.budget} HIVE</Badge>
        </div>
    )
}

export default ApplicationOnProfile