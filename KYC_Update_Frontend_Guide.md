# Frontend Guide: Mandatory KYC Legal Agreement Integration

## Overview

The KYC verification process has been updated to include a new mandatory document: a signed **Legal Agreement**. All users, including existing ones, must complete this new step to become KYC verified.

As part of this update, the KYC status for **all existing users has been reset to `NOT_SUBMITTED`**. They will need to go through the KYC process again, which now includes uploading the new signed agreement.

## 1. Downloading the Legal Agreement Form

Users must first download the official PDF form. You should provide a clear button or link for this download.

- **Endpoint:** `GET /withdrawal-agreement-form.pdf`
- **Method:** `GET`
- **Description:** This endpoint serves the static PDF file. The user's browser will handle the download.
- **Important:** The backend has been configured to serve this file from a `public` directory. Ensure the file named `withdrawal-agreement-form.pdf` is placed there.

**User Flow:**
1. User clicks a "Download Agreement Form" button.
2. The `GET /withdrawal-agreement-form.pdf` request is initiated.
3. The browser downloads the PDF.
4. The user must then print, physically sign, and scan or photograph the document to prepare it for upload.

## 2. Uploading the Signed Document

Once the user has the signed document ready, they can upload it. This uses the same endpoint as other KYC documents but with a new `docType`.

- **Endpoint:** `POST /api/v1/kyc/document`
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Authentication:** Requires user JWT token.

### Form Data Fields:

| Field Name | Type   | Description                                           |
|------------|--------|-------------------------------------------------------|
| `document` | File   | The scanned PDF or image (JPG, PNG) of the signed form. |
| `docType`  | String | Must be the exact value: **`LEGAL_AGREEMENT`**.         |

**Example Request (using `fetch`):**
```javascript
const formData = new FormData();
formData.append('document', fileInput.files[0]);
formData.append('docType', 'LEGAL_AGREEMENT');

fetch('/api/v1/kyc/document', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${your_jwt_token}`
  },
  body: formData
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

## 3. Submitting for Review

After uploading all required documents (including the new agreement), the user can submit their entire KYC application for review.

- **Endpoint:** `POST /api/v1/kyc/submit-for-review`
- **Method:** `POST`
- **Authentication:** Requires user JWT token.

### Important Changes:

The backend now strictly enforces that the following documents have been uploaded before allowing a submission:
1.  `AADHAAR_FRONT`
2.  `AADHAAR_BACK`
3.  `PAN`
4.  `LEGAL_AGREEMENT`

If any of these documents are missing, the API will return a `400 Bad Request` error with a descriptive message.

**Example Error Response:**
```json
{
  "message": "The following documents are required before submitting for review: LEGAL_AGREEMENT, PAN"
}
```

## 4. Checking KYC Status

The endpoint for checking a user's KYC status remains unchanged. You can use it to track the user's progress and see which documents have been uploaded.

- **Endpoint:** `GET /api/v1/kyc/status`
- **Method:** `GET`
- **Authentication:** Requires user JWT token.

**Example Response:**
The `documents` array in the response will now include an entry for the legal agreement once it's uploaded.
```json
{
    "userId": "U123",
    "status": "NOT_SUBMITTED",
    "documents": [
        {
            "docType": "AADHAAR_FRONT",
            "url": "https://s3..."
        },
        {
            "docType": "AADHAAR_BACK",
            "url": "https://s3..."
        },
        {
            "docType": "PAN",
            "url": "https://s3..."
        },
        {
            "docType": "LEGAL_AGREEMENT",
            "url": "https://s3..."
        }
    ],
    // ... other fields
}
```

## Recommended Frontend Workflow

1.  **Check KYC Status:** On the KYC page, fetch the user's status using `GET /api/v1/kyc/status`.
2.  **Display Requirements:**
    - Show the list of required documents: Aadhaar (Front & Back), PAN, and Legal Agreement.
    - Provide a "Download Agreement Form" link pointing to `/withdrawal-agreement-form.pdf`.
    - For each required document, show its upload status (e.g., "Uploaded" or "Missing").
3.  **Handle Uploads:**
    - Provide file input fields for each required document.
    - When a user uploads the signed agreement, send it to `POST /api/v1/kyc/document` with `docType: 'LEGAL_AGREEMENT'`.
4.  **Enable Submission:**
    - Once the `GET /api/v1/kyc/status` response confirms that all four required documents are present in the `documents` array, enable the "Submit for Review" button.
5.  **Submit and Handle Response:**
    - When the user clicks "Submit", call `POST /api/v1/kyc/submit-for-review`.
    - On success, update the UI to show the status is now `PENDING`.
    - On failure, display the error message from the API to inform the user which documents are still missing.
