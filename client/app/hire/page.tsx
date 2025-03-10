"use client";

import React, { useState } from "react";
import { useHiveWallet } from "@/wallet/HIveKeychainAdapter";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@radix-ui/react-select";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import uploadPDF from "@/utils/uploader";

export default function SellPage() {
  const { isConnected, account, signTransaction } = useHiveWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    promptFile: "",
    budget: 0,
    skillsRequired: [] as string[],
  });
  const [pdf, setPdf] = useState<File | null>(null);
  const [showPaymentOverlay, setShowPaymentOverlay] = useState(false);

  console.log("SellPage - isConnected:", isConnected);
  console.log("SellPage - account:", account);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !account) {
      alert("Please connect your wallet first");
      return;
    }
    setShowPaymentOverlay(true);
  };

  const handlePay = async () => {
    if (!isConnected || !account) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      const operation = [
        "transfer",
        {
          from: account,
          to: "cyph37",
          amount: formData.budget.toFixed(3),
          memo: "Payment for service submission",
        },
      ];

      console.log("Initiating real transaction:", operation);
      const result = await signTransaction(operation, "Active");

      if(result.success){
        console.log("Transaction successful:", result);
        setShowPaymentOverlay(false);
        //   alert(`Payment of ${formData.budget.toString()} HIVE to cyph37 completed successfully!`);
        handlePost(result.result.id);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error("Transaction failed:", err.message);
        alert("Transaction failed: " + err.message);
      } else {
        console.error("Transaction failed: An unknown error occurred");
        alert("Transaction failed: An unknown error occurred");
      }
    }
    
  };

  const handlePost = async (transactionId: string) => {
    try {
      setIsLoading(true);

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
        username: account,
        title: formData.title,
        description: formData.description,
        category: formData.category,
        promptFile: pdf_url,
        budget: formData.budget,
        skillsRequired: formData.skillsRequired,
        transactionId: transactionId,
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
    } catch (err) {
      console.log(`Failed to create bounty ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Post a bounty</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div className="space-y-3">
  <label className="text-sm font-semibold text-gray-700">Category</label>
  <div className="relative">
    <select
      value={formData.category}
      onChange={(e) =>
        setFormData((prev) => ({ ...prev, category: e.target.value }))
      }
      className="w-full border-2 border-gray-500 py-2"
    >
      <option className="w-full" value="">Select a category</option>
      <option className="w-full" value="Creative Writing">Creative Writing</option>
      <option className="w-full" value="Coding">Coding</option>
      <option className="w-full" value="Digital Marketing">Digital Marketing</option>
      <option className="w-full" value="Design">Design</option>
      <option className="w-full" value="Web Development">Web Development</option>
      <option className="w-full" value="UI/UX">UI/UX</option>
      <option className="w-full" value="AI/ML">AI/ML</option>
      {/* <SelectTrigger className="w-full px-4 py-2 border rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 bg-white">
        <SelectValue placeholder="Select category" />
      </SelectTrigger> */}
      {/* <SelectContent className="bg-white z-50 shadow-lg w-full rounded-lg p-3 border">
        <SelectItem value="creative" className="hover:bg-gray-100 px-3 py-2 rounded-md">
          Creative Writing
        </SelectItem>
        <SelectItem value="coding" className="hover:bg-gray-100 px-3 py-2 rounded-md">
          Coding
        </SelectItem>
        <SelectItem value="marketing" className="hover:bg-gray-100 px-3 py-2 rounded-md">
          Digital Marketing
        </SelectItem>
        <SelectItem value="business" className="hover:bg-gray-100 px-3 py-2 rounded-md">
          Design
        </SelectItem>
      </SelectContent> */}
    </select>
  </div>
</div>


        <div className="space-y-2">
          <label className="text-sm font-medium">Required Skills</label>
          <div className="flex gap-2">
            <Input
              placeholder="Add a skill"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSkillAdd()}
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
              onChange={(e) =>
                setFormData({
                  ...formData,
                  budget: parseFloat(e.target.value),
                })
              }
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Upload Bounty File</p>
          <label htmlFor="file-inp" className="border-2 border-dashed rounded-lg p-6 h-full text-center">
              {
                pdf ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {formData.promptFile}
                    </p>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Drag and drop your bounty file here, or click to browse
                    </p>
                  </>
                )
              }
              <Input
                type="file"
                className="hidden"
                id="file-inp"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData((prev) => ({
                      ...prev,
                      promptFile: file.name,
                    }));
                    setPdf(file);
                  }
                }}
              />
          </label>
        </div>

        <Button
          type="submit"
          disabled={!isConnected || isLoading}
          className={`px-4 w-full py-2 rounded-md text-white ${
            isConnected
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          { isLoading ? "posting..." : "Pay and Submit" }
        </Button>
      </form>

      {/* Payment Overlay */}
      {showPaymentOverlay && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              padding: "20px",
              borderRadius: "5px",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                marginBottom: "1rem",
              }}
            >
              Complete Your Payment
            </h2>
            <p>Pay {formData.budget} HIVE to submit your service.</p>
            <button
              onClick={handlePay}
              style={{
                marginTop: "1rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#4CAF50",
                color: "white",
                borderRadius: "5px",
                border: "none",
                cursor: "pointer",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#45a049")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#4CAF50")
              }
            >
              Pay {formData.budget} HIVE
            </button>
            <button
              onClick={() => setShowPaymentOverlay(false)}
              style={{
                marginTop: "0.5rem",
                padding: "0.5rem 1rem",
                backgroundColor: "#ddd",
                color: "black",
                borderRadius: "5px",
                border: "none",
                cursor: "pointer",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.backgroundColor = "#ccc")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.backgroundColor = "#ddd")
              }
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
