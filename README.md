# Interprep

**Interprep** is an AI-powered platform for generating personalized technical and HR assessments, proctoring candidates remotely, and streamlining the hiring process for modern recruitment teams.

## Features

- **AI-Generated Tests:** Automatically create tailored technical and HR assessments based on candidate resumes and job requirements.
- **Personalized Content:** Generate role-specific questions, coding challenges, and behavioral assessments customized to each candidate's background.
- **Seamless Sharing:** Share tests via email, automate reminders, and track candidate engagement.
- **AI Proctoring:** Ensure test integrity with secure, AI-powered proctoring that monitors for suspicious activities.
- **Automated Scoring & Analysis:** Instantly grade objective questions and provide AI-generated insights on candidate performance.
- **Secure Environment:** Protect sensitive data with enterprise-grade security and compliance features.
- **Collaborative Hiring:** Enable team collaboration with shared assessments, comments, and structured workflows.

## How It Works

1. **Add Candidates:** Upload candidate resumes (PDF/Word) and enter their details.
2. **Generate Tests:** Use AI to generate technical or HR assessments tailored to each candidate.
3. **Share & Proctor:** Send test links to candidates. Proctoring ensures test integrity via webcam and activity monitoring.
4. **Analyze Results:** Instantly review candidate responses, scores, and AI-powered analytics.
5. **Collaborate:** Share results and feedback with your team for data-driven hiring decisions.

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- PostgreSQL database
- AWS S3 bucket (for resume storage)
- Google Generative AI API key
- SMTP credentials for email notifications

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/vachanmn123/interprep.git
   cd interprep
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in the required values (see `src/env.js` for details).

4. **Run database migrations:**
   ```bash
   npx prisma migrate deploy
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Access the app:**
   - Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

- **Admin Dashboard:** Manage candidates, generate and assign tests, and review results.
- **Candidate Portal:** Candidates receive a secure test link, complete the assessment under proctoring, and submit their answers.
- **Review & Analytics:** View detailed breakdowns of candidate performance, question-level analytics, and proctoring logs.

## Technologies Used

- **Next.js** (App Router)
- **TypeScript**
- **Prisma ORM**
- **PostgreSQL**
- **AWS S3** (resume storage)
- **Google Generative AI** (question and resume parsing)
- **tRPC** (API layer)
- **Tailwind CSS** (UI)
- **Nodemailer** (email notifications)

## Security & Privacy

- All candidate data and test results are securely stored.
- Proctoring uses the candidate's webcam and browser activity but does not record or store video.
- Only authorized users can access the admin dashboard and candidate data.

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements or bug fixes.

