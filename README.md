# BitHoliocs-Team
virtual police station
Virtual Police Station is a secure, responsive web platform designed to modernize and digitize the FIR (First Information Report) filing process in India. It empowers citizens—especially those in remote or vulnerable areas—to report crimes and track cases transparently and efficiently using a digital-first approach.

🔍 Key Features

✅ Aadhaar-based OTP & Digital Signature Authentication
Secure login system with Aadhaar integration for identity verification via OTP and optional digital signatures.

✅ Anonymous FIR Reporting
Report crimes without revealing identity, with the option to verify identity at a later stage if needed.

✅ FIR Draft Preview & Final Submission
Users can review and edit FIRs before final submission to ensure accuracy.

✅ Case Tracking Dashboard
Real-time status updates of filed FIRs, including investigation progress, officer notes, and closure reports.

✅ Digital Evidence Upload
Upload images, videos, or documents with metadata stamping for integrity and chain-of-custody validation.

✅ CCTNS Integration (Mock/Prototype)
Simulated routing of FIRs to SHOs based on location using a mock version of India’s CCTNS (Crime and Criminal Tracking Network & Systems).

✅ Appointment Scheduling
Users can schedule an in-person police visit for verification, if required.

✅ Role-based User Access
Separate dashboards and privileges for Citizens, Police Officers, and Administrators.

✅ Responsive UI
Built with HTML, Tailwind CSS, and JavaScript for a mobile-friendly, modern user interface inspired by Indian police department branding.

💻 Tech Stack

Frontend:

    HTML5

    Tailwind CSS

    JavaScript (Vanilla)

Backend:

    Node.js

    Express.js

    EJS Templating Engine

    MongoDB + Mongoose

    Passport.js (for authentication)

    connect-flash (for session messages)

🔐 Security

    Input validation using express-validator

    Data encryption and secured file uploads

    OTP and Aadhaar verification (simulated/mocked)

    CSRF protection and secure headers

📁 Project Structure

/ ├── public/ → Static assets (CSS, JS, images)
├── views/ → EJS templates (FIR form, dashboard, login pages, etc.)
├── routes/ → Route definitions (auth, FIRs, tracking)
├── controllers/ → Logic handlers for each route
├── models/ → Mongoose schemas (User, FIR, Evidence)
├── middleware/ → Auth and validation middleware
├── config/ → Database and passport setup
├── uploads/ → Secure storage for digital evidence
├── app.js → Entry point
└── package.json → Project metadata and dependencies
