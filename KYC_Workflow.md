
# KYC Process Documentation

This document outlines the frontend implementation of the Know Your Customer (KYC) process. It details how the system manages KYC statuses, handles document uploads, and interacts with the backend.

## Overview

The KYC process is designed to verify a user's identity by collecting and reviewing their personal documents. The system supports the following KYC statuses:

- **`NOT_SUBMITTED`**: The user has not yet submitted any documents.
- **`PENDING`**: The user has submitted their documents, and they are awaiting review.
- **`VERIFIED`**: The user's identity has been successfully verified.
- **`REJECTED`**: The user's submission was rejected, and a reason is provided.

## Document Requirements

The following documents are required for the KYC process:

- **Aadhaar Card (Front)**: `AADHAAR_FRONT`
- **Aadhaar Card (Back)**: `AADHAAR_BACK`
- **PAN Card**: `PAN`
- **Additional Document** (optional): `OTHER`

All documents can be uploaded in `image/*` or `.pdf` format.

## Workflow

The KYC workflow is as follows:

1. **Fetching KYC Status**:
   - When the user navigates to the KYC page, the system fetches the current KYC status from the backend using the `getKycStatus` function.
   - If the status is `VERIFIED` or `PENDING`, a status display is shown to the user.
   - If the status is `NOT_SUBMITTED` or `REJECTED`, the user is presented with the document upload interface.

2. **Document Upload**:
   - The user can select and upload each required document individually.
   - The `handleFileChange` function captures the selected file and generates a preview if it's an image.
   - The `handleUpload` function sends the document to the backend using the `uploadKycDocument` function. The document is sent as `formData` with the `docType`.
   - After a successful upload, the KYC status is updated, and the uploaded document is marked as complete.

3. **Submission for Review**:
   - Once at least one document has been uploaded, the user can submit their application for review.
   - The `handleFinalSubmit` function calls the `submitKycForReview` function to notify the backend that the submission is ready for review.
   - The KYC status is then updated to `PENDING`.

4. **Status Updates**:
   - The system periodically checks for status updates.
   - If the submission is rejected, the user is notified with a reason and can re-upload their documents.
   - If the submission is verified, the user is notified of the successful verification.

## State Management

The KYC page manages the following state variables:

- **`kycStatus`**: Stores the user's current KYC status.
- **`loading`**: Indicates whether the KYC status is being fetched.
- **`files`**: An array of files that the user has selected for upload.
- **`previews`**: An array of preview URLs for the selected image files.
- **`uploading`**: Tracks the index of the document that is currently being uploaded.
- **`submitting`**: Indicates whether the KYC submission is in progress.
- **`message`**: Displays success or error messages to the user.

## Backend Integration

The frontend communicates with the backend through the following API functions:

- **`getKycStatus()`**: Fetches the current KYC status.
- **`uploadKycDocument(formData)`**: Uploads a single document.
- **`submitKycForReview()`**: Submits the uploaded documents for review.

These functions are essential for the proper functioning of the KYC process and must be implemented correctly in the backend.
