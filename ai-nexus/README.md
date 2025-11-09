# AI-NEXUS
## From Subjective to Objective

An AI-powered interview platform that transforms subjective interviews into objective, data-driven assessments.

## Project Architecture

### Tech Stack
- **Frontend**: Next.js (React)
- **Backend API**: Node.js (Express, WebSockets)
- **ML API**: Python (Flask/FastAPI)
- **Database**: MongoDB
- **Video Platform**: LiveKit
- **Real-time STT**: Chrome Web Speech API

### Project Structure

```
ai-nexus/
├── frontend/              # Next.js application
│   ├── app/              # Next.js app router
│   ├── components/       # React components
│   └── lib/              # Utilities and helpers
├── backend/              # Node.js API server
│   ├── src/
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   ├── websocket/   # WebSocket handlers
│   │   └── models/      # MongoDB models
│   └── server.js
├── ml-api/               # Python ML service
│   ├── app/             # FastAPI/Flask app
│   ├── services/        # ML analysis services
│   └── requirements.txt
└── README.md
```

## Features

### User Roles
- **HR_Recruiter**: Schedule interviews, manage candidates, view scorecards
- **Student_Candidate**: Practice interviews, view performance reports

### Key Views
1. **Public Landing Page**: Marketing and value proposition
2. **Authentication**: Unified login/register for both roles
3. **HR Dashboard**: Job postings, schedule interviews, analytics
4. **Student Dashboard**: Upcoming interviews, performance history
5. **Live Interview Interface**: Real-time video/audio with LiveKit
6. **Interview Reports**: AI-generated scorecards and feedback

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB
- LiveKit account

### Installation

1. **Frontend**:
```bash
cd frontend
npm install
npm run dev
```

2. **Backend**:
```bash
cd backend
npm install
npm run dev
```

3. **ML API**:
```bash
cd ml-api
pip install -r requirements.txt
python app/main.py
```

## Environment Variables

See `.env.example` files in each directory for required environment variables.

## License

MIT

