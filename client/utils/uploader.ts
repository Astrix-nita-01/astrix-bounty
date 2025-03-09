"use server";

import cloudinary from "@/lib/cloudinary";

export default async function uploadPDF(formData: FormData) {
    try {
      const file = formData.get('pdf') as File | null;
      if(!file) return JSON.stringify({ success: false, error: 'File not provided' });

      let pdfUrl = '';

      console.log(file.name);

      const fileExtension = file.name.toLowerCase().split('.')[file.name.toLowerCase().split('.').length-1];

      if (fileExtension === "pdf") {
            // Convert file to a buffer
            const fileBuffer = await fileToBuffer(file);

            // Upload the file to Cloudinary
            const uploadResult: any = await new Promise((resolve) => {
              cloudinary.uploader.upload_stream(
                {
                  folder: "ip_pdfs", // Optional: Organize pdfs in a specific folder
                  resource_type: "auto", // Specify resource type as pdf
                },
                (error, uploadResult) => {
                  return resolve(uploadResult);
              }).end(fileBuffer);
            });

            pdfUrl = uploadResult.secure_url;
      }else{
          return JSON.stringify({ success: false, error: "Only .pdf files are allowed"});
      }

      return JSON.stringify({ success: true, message: 'File uploaded to object store', pdfUrl: pdfUrl });
    } catch (error) {
      console.error("Error uploading PDF:", error);
      return JSON.stringify({ success: false, error: error });
    }
}

// Helper function to convert a File to a Buffer
async function fileToBuffer(file: File): Promise<Buffer> {
  return Buffer.from(await file.arrayBuffer());
}