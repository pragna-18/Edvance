# EDVANCE: Comprehensive Technical Documentation

**Version**: 1.0.0  
**Project Type**: Full-Stack Web Application (MERN-based with AI Integration)  
**Created**: 2024  
**Last Updated**: April 2026  
**License**: MIT  

---

## Table of Contents

1. [Executive Technical Summary](#executive-technical-summary)
2. [Architecture Overview](#architecture-overview)
3. [Technology Stack Deep Dive](#technology-stack-deep-dive)
4. [Database Architecture](#database-architecture)
5. [API Design & Routes](#api-design--routes)
6. [AI/ML Integration](#aiml-integration)
7. [Real-Time Collaboration System](#real-time-collaboration-system)
8. [Client-Side Architecture](#client-side-architecture)
9. [Authentication & Authorization](#authentication--authorization)
10. [Data Export & Generation](#data-export--generation)
11. [Machine Learning Pipeline](#machine-learning-pipeline)
12. [Advanced Features](#advanced-features)
13. [Deployment Architecture](#deployment-architecture)
14. [Security Considerations](#security-considerations)
15. [Performance Optimization](#performance-optimization)
16. [Development Workflow](#development-workflow)

---

## Executive Technical Summary

**Edvance** is an enterprise-grade, AI-powered educational platform that combines modern full-stack web technologies with advanced machine learning and real-time collaboration capabilities. The system architecture follows a **microservices-ready design** using a separation of concerns pattern, where the frontend (React/Vite), backend (Node.js/Express), and databases (PostgreSQL) operate independently but are tightly integrated.

### Core Technical Objectives

- **AI-Driven Content Generation**: Leverage large language models (Google Gemini, Groq) to generate structured lesson plans in <30 seconds
- **Real-Time Synchronization**: Implement socket-based real-time editing with conflict resolution using Socket.IO and Liveblocks
- **Intelligent Content Analysis**: Deploy machine learning models (scikit-learn based) for lesson quality scoring and curriculum alignment verification
- **Multi-Language Support**: Implement translation layer supporting 12 Indian languages through API-driven translation engines
- **Scalable Data Model**: Use PostgreSQL with Prisma ORM for type-safe, migrations-managed database operations
- **Production-Ready Deployment**: Docker containerization with nginx reverse proxy and environment-based configuration

---

## Architecture Overview

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (SPA)                       │
│  React 18.2 + Vite Build System + Tailwind CSS Styling          │
│  ├─ Pages (Routes): Generate, Plans, Collaboration, Dashboard   │
│  ├─ Components: Reusable UI building blocks                      │
│  ├─ Context: AuthContext, SocketContext, ThemeContext           │
│  └─ HTTP/WebSocket: axios + socket.io-client                    │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   HTTP REST API            WebSocket (Socket.IO)
   (axios)                  Real-time Events
        │                         │
        └────────────┬────────────┘
                     │
┌────────────────────▼────────────────────────────────────────────┐
│                    API GATEWAY LAYER                            │
│  Express.js Middleware Stack                                    │
│  ├─ CORS & Helmet Security                                      │
│  ├─ JWT Authentication (Bearer tokens)                          │
│  ├─ Request Validation (express-validator)                      │
│  └─ Error Handling & Standardized Responses                     │
└────────────────────┬────────────────────────────────────────────┘
                     │
        ┌────────────┴─────────────────────┐
        │                                  │
        ▼                                  ▼
   Business Logic Layer          Socket.IO Server
   Express Routes:               Real-time Handlers:
   ├─ /api/auth                 ├─ join-plan
   ├─ /api/lessons              ├─ content-change
   ├─ /api/ai                   ├─ cursor-position
   ├─ /api/approval             ├─ comment-add
   ├─ /api/health               ├─ user-joined
   ├─ /api/curriculum           └─ user-left
   ├─ /api/collaboration
   └─ /api/...other routes
        │
        └─────────────────────────────┐
                                      │
┌─────────────────────────────────────▼─────────────────────────┐
│                   AI SERVICE LAYER                            │
│  ├─ Google Gemini Integration                                 │
│  │  └─ Lesson plan generation, content analysis              │
│  ├─ Groq API Integration                                      │
│  │  └─ Translation, curriculum alignment, cognitive load     │
│  ├─ ML Model Service                                         │
│  │  └─ Health score prediction (scikit-learn/Python)        │
│  └─ Utility Services                                         │
│     ├─ PDF Generation (Puppeteer)                            │
│     └─ PPTX Generation (pptxgenjs)                           │
└─────────────────────────────────────┬───────────────────────┘
                                      │
┌─────────────────────────────────────▼───────────────────────┐
│                  DATA PERSISTENCE LAYER                      │
│  PostgreSQL Database                                        │
│  ├─ Primary Database (Relational Schema)                    │
│  ├─ Prisma ORM (Type-Safe ORM)                             │
│  └─ Connection Pooling & Migration Management              │
└──────────────────────────────────────────────────────────┘
```

### Request Flow Example (Lesson Generation)

```
1. User Action (Frontend)
   └─ "Generate Lesson" button clicked with:
      - Subject: "Mathematics"
      - Grade: "10"
      - Duration: "45 mins"
      - Approach: "Interactive"

2. HTTP POST Request
   └─ axios.post('/api/ai/generatePlan', {
      subject, grade, duration, approach, aiModel: 'gemini'
   })

3. API Route Handler (/api/ai)
   └─ Input validation using express-validator
   └─ Extract AI model selection
   └─ Call aiModelSelector.generateLessonPlanWithAI()

4. AI Service Layer
   └─ Route to Gemini API with structured prompt
   └─ Receive streamed response with lesson structure
   └─ Parse JSON response

5. Response Processing
   └─ Validate response structure
   └─ Save to PostgreSQL via Prisma
   └─ Calculate health score via ML model
   └─ Return to frontend with status 201

6. Frontend Update
   └─ Store in React state
   └─ Redirect to lessons/:id
   └─ Display lesson plan with health score badge
```

---

## Technology Stack Deep Dive

### 3.1 Frontend Stack

#### **React 18.2.0**
- **Purpose**: Component-based UI library for building interactive SPAs
- **Key Implementations**:
  - Component hierarchy: App → Layout → Pages → Components
  - State management via Context API (AuthContext, SocketContext, ThemeContext)
  - Hook-based component logic (useState, useEffect, useContext, useReducer)
  - Conditional rendering for role-based access (PrivateRoute component)

```javascript
// Example: Private Route with Role-Based Access
const PrivateRoute = ({ children, allowedRoles = ['teacher', 'HOD', 'admin'] }) => {
  const { user } = useContext(AuthContext);
  
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" />;
  }
  
  return children;
};
```

#### **Vite 5.0.8**
- **Purpose**: Next-generation frontend build tool and dev server
- **Technical Features**:
  - ES modules-based dev server with Hot Module Replacement (HMR)
  - Optimized production build with code splitting and tree-shaking
  - Sub-100ms HMR for rapid development feedback
  - Native support for JSX, CSS modules, and import.meta.glob
- **Configuration**:
  ```javascript
  // vite.config.js
  export default {
    plugins: [react()],
    server: { proxy: { '/api': 'http://localhost:5000' } },
    build: { outDir: 'dist', sourcemap: false }
  };
  ```

#### **Tailwind CSS 3.3.6**
- **Purpose**: Utility-first CSS framework for rapid UI development
- **Implementation**:
  - Pre-compiled utility classes (m-4, p-4, bg-blue-500, etc.)
  - JIT (Just-In-Time) compilation in development
  - Custom color palette through tailwind.config.js
  - Dark mode support via Tailwind's dark: prefix
- **Styling Approach**:
  ```jsx
  // Utility-first approach: no custom CSS files needed
  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
    {/* Content */}
  </div>
  ```

#### **React Router DOM 6.21.1**
- **Purpose**: Client-side routing for SPA navigation
- **Route Structure**:
  ```
  / → Home (public)
  /login → Login page (public)
  /register → Registration (public)
  /dashboard → Dashboard (private, all authenticated users)
  /generate → Lesson generator (private, teachers only)
  /plans → Lesson list (private, teachers/HOD)
  /plans/:id → Lesson detail (private)
  /collaborate/:id → Real-time collaboration (private)
  /approvals → Approval workflow (private, HOD/Admin only)
  /profile → User profile (private)
  /admin/users → User management (private, admin only)
  ```

#### **Socket.io Client 4.5.4**
- **Purpose**: Real-time bidirectional communication between client and server
- **WebSocket Implementation**:
  - Connection pooling with automatic reconnection
  - Namespace-based rooms for lesson-specific collaboration
  - Event-driven architecture (emit/on patterns)
  - Fallback transports (WebSocket → HTTP long-polling)

#### **Axios 1.6.2**
- **Purpose**: Promise-based HTTP client for API requests
- **Configuration**:
  ```javascript
  // Interceptor for JWT authentication headers
  axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });
  ```

#### **Additional Client Libraries**
- **Framer Motion 10.16.16**: Animation library for smooth UI transitions
- **Recharts 2.10.3**: React charting library for health score and analytics graphs
- **React Icons 4.12.0**: Icon library (1000+ SVG icons)
- **Spline React 4.1.0**: 3D graphics integration for visual enhancements
- **Three.js 0.181.0**: WebGL 3D graphics engine
- **Liveblocks React 1.12.0**: Real-time collaboration state management

---

### 3.2 Backend Stack

#### **Node.js + Express 4.18.2**
- **Purpose**: JavaScript runtime with lightweight web framework
- **Key Features**:
  - ESM (ECMAScript Modules) support via "type": "module" in package.json
  - Middleware pattern for concerns (auth, validation, error handling)
  - Route-based organization for scalability
- **Server Initialization**:
  ```javascript
  import express from 'express';
  import { createServer } from 'http';
  import { Server } from 'socket.io';
  
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: "*", credentials: true }
  });
  
  // Middleware stack
  app.use(helmet()); // Security headers
  app.use(cors()); // CORS handling
  app.use(express.json()); // Body parsing
  
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => console.log(`Server on ${PORT}`));
  ```

#### **PostgreSQL 15-Alpine**
- **Purpose**: Production-grade relational DBMS
- **Features**:
  - ACID compliance for transaction safety
  - JSON/JSONB column support for flexible nested data
  - Full-text search capabilities
  - Indexing strategies for query optimization
- **Docker Container**:
  ```yaml
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: edvance
      POSTGRES_PASSWORD: edvance123
      POSTGRES_DB: edvance
    volumes:
      - postgres_data:/var/lib/postgresql/data
  ```

#### **Prisma ORM 5.7.1**
- **Purpose**: Next-generation ORM for type-safe database access
- **Core Concepts**:
  - **Schema Definition**: Declarative schema.prisma file defines data models
  - **Type Codegen**: Auto-generates TypeScript types matching database schema
  - **Query Builder**: Type-safe query API with IDE autocomplete
  - **Migrations**: Version control for database schema changes
- **Data Model Highlights**:
  ```prisma
  model LessonPlan {
    id                    String     @id @default(uuid())
    title                 String
    subject               String
    topic                 String?
    grade                 String
    duration              Int?
    content               Json       // Flexible nested structure
    version               Int        @default(1)
    status                PlanStatus @default(draft)
    healthScore           Float?
    curriculumAlignment   Json?
    createdAt             DateTime   @default(now())
    updatedAt             DateTime   @updatedAt
    
    // Relations
    creator               User       @relation("PlanCreator", fields: [creatorId], references: [id])
    collaborators         CollaborationPermission[]
    approvals             Approval[]
  }
  ```
- **Query Examples**:
  ```javascript
  // Type-safe queries with Prisma
  const plan = await prisma.lessonPlan.findUnique({
    where: { id: planId },
    include: {
      creator: { select: { id: true, name: true } },
      approvals: { where: { status: 'pending' } }
    }
  });
  ```

#### **JWT Authentication (jsonwebtoken 9.0.2)**
- **Purpose**: Stateless authentication using signed tokens
- **Implementation**:
  ```javascript
  // Token generation
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  // Token verification middleware
  export const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Token required' });
    
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.status(403).json({ error: 'Invalid token' });
      req.user = user;
      next();
    });
  };
  ```

#### **Password Hashing (bcryptjs 2.4.3)**
- **Purpose**: Secure one-way password encryption
- **Algorithm**: bcrypt with 10 salt rounds (configurable cost factor)
- **Implementation**:
  ```javascript
  // Registration: hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Login: compare plaintext with hash
  const isValidPassword = await bcrypt.compare(password, user.password);
  ```

#### **Input Validation (express-validator 7.0.1)**
- **Purpose**: Middleware-based validation with chainable API
- **Usage Pattern**:
  ```javascript
  router.post('/api/plans', [
    body('title').trim().notEmpty().withMessage('Title required'),
    body('subject').trim().isIn(['Math', 'Science', ...]),
    body('grade').toInt().isInt({ min: 1, max: 12 }),
    body('duration').optional().isInt({ min: 15 })
  ], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    // Process valid data
  });
  ```

---

### 3.3 AI/LLM Integration

#### **Google Gemini 2.0 Flash**
- **Provider**: Google AI API (generative-ai 0.24.1)
- **Model**: `gemini-2.0-flash` (latest stable production model)
- **Use Cases**:
  - Lesson plan generation
  - Quiz/question paper generation
  - Content analysis and AI suggestions
  - Similar lesson plan ranking using semantic similarity
- **API Characteristics**:
  - ~100+ tokens/second throughput
  - 2M context window (allows processing of large documents)
  - Streaming support for long responses
  - JSON mode for structured outputs

#### **Groq LLaMA-3.3-70B**
- **Provider**: Groq API (groq-sdk 0.35.0)
- **Model**: `llama-3.3-70b-versatile`
- **Use Cases**:
  - Fast inference for translation (12 Indian languages)
  - Curriculum alignment analysis
  - Cognitive load assessment
  - Real-time chat responses
- **API Characteristics**:
  - ~600+ tokens/second (8x faster than typical LLMs)
  - Cost-effective for high-volume inference
  - Special optimization for instruction-following tasks

#### **Multi-AI Model Selection Pattern**

```javascript
// aiModelSelector.js: Abstraction layer for AI provider switching
export async function generateLessonPlanWithAI(model, prompt) {
  switch (model.toLowerCase()) {
    case 'gemini':
      return generateWithGemini(prompt);
    case 'groq':
      return generateWithGroq(prompt);
    default:
      throw new Error(`Invalid model: ${model}`);
  }
}

// Route handler: user can select preferred AI model
router.post('/api/ai/generatePlan', async (req, res) => {
  const { subject, topic, aiModel = 'gemini' } = req.body;
  
  // Validate model availability and fallback if needed
  const selectedModel = validateModel(aiModel) ? aiModel : 'gemini';
  
  const lessonPlan = await generateLessonPlanWithAI(selectedModel, prompt);
  res.json(lessonPlan);
});
```

#### **Retry & Error Handling Pattern**

```javascript
// geminiRetry.js: Resilient API interaction with exponential backoff
export async function retryWithBackoff(asyncFn, operationName, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt}/${maxRetries}: ${operationName}`);
      return await asyncFn();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        const delayMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.warn(`Retry after ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw new Error(`${operationName} failed after ${maxRetries} attempts: ${lastError.message}`);
}
```

---

## Database Architecture

### 4.1 Schema Design (Relational Model)

#### **User Management**

```prisma
enum UserRole {
  teacher      // Can create and manage lesson plans
  HOD          // Higher-order decision maker, approves plans
  admin        // Full system access
}

model User {
  id        String      @id @default(uuid())
  email     String      @unique
  password  String      // bcrypt hashed
  name      String
  role      UserRole    @default(teacher)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  
  // Relations
  createdPlans LessonPlan[] @relation("PlanCreator")
  templates Template[]
  approvals Approval[]
}
```

**Indexing Strategy**:
- Primary key: `id` (UUID, faster than auto-increment for distributed systems)
- Unique constraint: `email` (prevents duplicate accounts)
- No explicit index on `role` as cardinality is low (3 values)

#### **Lesson Plan Repository**

```prisma
enum PlanStatus {
  draft                // Editable by creator
  submitted            // Awaiting approval
  approved             // Approved by HOD
  rejected             // Rejected, needs revision
  revision_requested   // Changes required
}

model LessonPlan {
  id                  String      @id @default(uuid())
  title               String
  subject             String
  topic               String?
  grade               String      // "1", "2", ..., "12", "Undergrad", etc.
  duration            Int?        // Minutes
  content             Json        // Structured lesson content (flexible schema)
  version             Int         @default(1)
  status              PlanStatus  @default(draft)
  creatorId           String
  healthScore         Float?      // 1-10 scale (cached from ML model)
  healthScoreDetails  Json?       // Component scores breakdown
  curriculumAlignment Json?       // Alignment analysis results
  language            String?     @default("en")
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt
  
  // Relations
  creator             User        @relation("PlanCreator", fields: [creatorId], references: [id])
  approvals           Approval[]
  versions            LessonPlanVersion[]
  collaborators       CollaborationPermission[]
  
  // Indexes for common queries
  @@index([creatorId])
  @@index([status])
  @@index([subject])
  @@index([healthScore])
}
```

**Content JSON Structure Example**:
```json
{
  "learningObjectives": [
    "Students will understand the concept of photosynthesis",
    "Students will be able to explain the light and dark reactions"
  ],
  "materialsRequired": ["Diagrams", "Projector", "Worksheet"],
  "lessonFlow": {
    "introduction": "5 minutes - Hook with real-world example",
    "activities": [
      {
        "name": "Concept explanation",
        "duration": 20,
        "description": "..."
      }
    ],
    "wrapUp": "..."
  },
  "assessments": ["Formative quiz", "Group discussion"],
  "homework": "...",
  "caseStudies": [...],
  "discussionQuestions": [...]
}
```

**Design Rationale**:
- `content` as JSON: Provides schema flexibility for varied lesson plan formats
- `version`: Tracks iterations for audit trail
- `healthScore`: Cached value (computed via ML model, persisted for performance)
- `curriculumAlignment`: Results stored to avoid re-computation

#### **Version Control**

```prisma
model LessonPlanVersion {
  id        String   @id @default(uuid())
  planId    String
  version   Int
  content   Json
  changeNote String?
  createdAt DateTime @default(now())
  createdBy String
  
  plan      LessonPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  
  @@unique([planId, version])
  @@index([planId])
}
```

**Use Cases**:
- Historical tracking of lesson changes
- Reverting to previous versions
- Auditing who made what changes and when

#### **Collaboration & Permissions**

```prisma
model CollaborationPermission {
  id        String   @id @default(uuid())
  planId    String
  userId    String
  role      String   @default("editor") // "editor", "viewer", "commenter"
  grantedAt DateTime @default(now())
  grantedBy String
  
  plan      LessonPlan @relation("PlanCollaborators", fields: [planId], references: [id])
  user      User       @relation("CollaboratorPermissions", fields: [userId], references: [id])
  grantedByUser User   @relation("PermissionGrantedBy", fields: [grantedBy], references: [id])
  
  @@unique([planId, userId])
}
```

**Permission Roles**:
- **editor**: Can modify content, merge changes
- **viewer**: Read-only access
- **commenter**: Can add comments but not edit content

#### **Approval Workflow**

```prisma
enum ApprovalStatus {
  pending    // Awaiting review
  approved   // Approved by reviewer
  rejected   // Rejected by reviewer
}

model Approval {
  id        String          @id @default(uuid())
  planId    String
  reviewerId String
  status    ApprovalStatus  @default(pending)
  comments  String?
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt
  
  plan      LessonPlan      @relation(fields: [planId], references: [id])
  reviewer  User            @relation(fields: [reviewerId], references: [id])
  
  @@index([planId])
  @@index([reviewerId])
}
```

### 4.2 Query Patterns & Optimization

#### **Common Queries with Index Usage**

```javascript
// 1. Get all plans for a user (uses creatorId index)
const plans = await prisma.lessonPlan.findMany({
  where: { creatorId: userId },
  include: { creator: true, approvals: true },
  orderBy: { createdAt: 'desc' },
  take: 20,
  skip: (page - 1) * 20  // Pagination
});

// 2. Filter by status (uses status index)
const approvalPending = await prisma.lessonPlan.findMany({
  where: { status: 'submitted' },
  include: { creator: true }
});

// 3. Search by subject/grade with sorting by health score
const filtered = await prisma.lessonPlan.findMany({
  where: {
    subject: { equals: 'Mathematics', mode: 'insensitive' },
    grade: { in: ['9', '10', '11'] },
    healthScore: { gte: 7 }  // Uses healthScore index
  },
  orderBy: { healthScore: 'desc' }
});

// 4. Get versions of a plan (uses planId index on versions table)
const versions = await prisma.lessonPlanVersion.findMany({
  where: { planId: planId },
  orderBy: { version: 'desc' }
});

// 5. Complex join: Plans with creator and pending approvals
const pendingApprovals = await prisma.lessonPlan.findMany({
  where: {
    approvals: { some: { status: 'pending' } }
  },
  include: {
    creator: { select: { name: true, email: true } },
    approvals: { where: { status: 'pending' } }
  }
});
```

---

## API Design & Routes

### 5.1 API Architecture

The API follows **REST conventions** with **role-based access control** implemented at the middleware level.

#### **Authentication Routes** (`/api/auth`)

```javascript
// POST /api/auth/register
Request:  { email, password, name }
Response: { userId, token, user: { id, email, name, role } }
Status:   201

// POST /api/auth/login
Request:  { email, password }
Response: { token, user: { id, email, name, role } }
Status:   200

// GET /api/auth/profile
Headers:  Authorization: Bearer <JWT_TOKEN>
Response: { user: { id, email, name, role, createdAt } }
Status:   200
```

**Implementation Details**:
- Passwords hashed with bcrypt (10 rounds) before storage
- JWT token includes: userId, email, role; expires in 24 hours
- Refresh token mechanism (if needed) stores long-lived refresh token separately
- Account lockout policy (optional): after 5 failed login attempts, lock for 15 minutes

#### **Lesson Plans Routes** (`/api/lessonPlans`)

```javascript
// GET /api/lessonPlans
Query:    page=1&limit=10&status=draft&subject=Math&grade=9
Response: { 
  plans: [ { id, title, subject, status, healthScore, creator, ... } ],
  totalCount: 150,
  totalPages: 15
}
Status:   200

// POST /api/lessonPlans
Headers:  Authorization: Bearer <JWT_TOKEN>
Request:  { title, subject, topic, grade, duration, content, language }
Response: { id, title, status: 'draft', createdAt, ... }
Status:   201

// GET /api/lessonPlans/:id
Response: { 
  id, title, subject, content, status, version, 
  creator: { id, name },
  versions: [ { version, content, changeNote, createdAt } ],
  approvals: [ { status, reviewer, comments } ]
}
Status:   200

// PUT /api/lessonPlans/:id
Headers:  Authorization: Bearer <JWT_TOKEN>
Request:  { title, content, changeNote }
Response: { id, title, version: 2, updatedAt, ... }
Status:   200

// DELETE /api/lessonPlans/:id
Headers:  Authorization: Bearer <JWT_TOKEN>
Response: { message: 'Plan deleted' }
Status:   204

// POST /api/lessonPlans/:id/submit
Headers:  Authorization: Bearer <JWT_TOKEN>
Response: { status: 'submitted', approvals: [ { status: 'pending' } ] }
Status:   200

// POST /api/lessonPlans/:id/revert/:version
Headers:  Authorization: Bearer <JWT_TOKEN>
Response: { id, version: 1, content: {...}, message: 'Reverted to version 1' }
Status:   200
```

#### **AI Generation Routes** (`/api/ai`)

```javascript
// POST /api/ai/generatePlan
Request:  {
  subject: "Mathematics",
  topic: "Quadratic Equations",
  educationLevel: "school",  // or "college"
  grade: "10",
  duration: 45,
  approach: "interactive",  // interactive|lecture|hands-on|project-based|inquiry-based
  includeCaseStudies: true,
  includeDiscussionQuestions: true,
  aiModel: "gemini"  // or "groq"
}
Response: {
  success: true,
  plan: {
    learningObjectives: [...],
    materialRequired: [...],
    lessonFlow: {...},
    assessments: [...],
    homework: "...",
    ...
  },
  generatedAt: "2026-04-17T10:30:00Z",
  model: "gemini"
}
Status:   200

// POST /api/ai/generateQuiz/:planId
Request:  { difficulty: "medium", questionCount: 10 }
Response: {
  questions: [
    { id, question, options: [], correctAnswer, explanation },
    ...
  ]
}
Status:   200

// POST /api/ai/generateQuestionPaper/:planId
Request:  { sections: [ { topic, marks, duration } ], totalMarks: 100 }
Response: {
  paper: { sections: [...], totalDuration: 180, totalMarks: 100 }
}
Status:   200
```

#### **Health Score Routes** (`/api/healthScore`)

```javascript
// POST /api/healthScore/calculate/:planId
Headers:  Authorization: Bearer <JWT_TOKEN>
Response: {
  planId,
  healthScore: 8.5,
  details: {
    objectivesScore: 9,
    materialsScore: 8,
    activitiesScore: 7.5,
    assessmentScore: 9,
    differentiationScore: 8
  },
  feedback: "Well-structured lesson plan with good assessment alignment"
}
Status:   200
```

**Technical Implementation**:
- Calls Python ML model via HTTP or subprocess
- Extracts features from lesson content JSON
- Random Forest/Gradient Boosting model predicts score
- Caches result in database to avoid redundant computation

#### **Curriculum Alignment Routes** (`/api/curriculum`)

```javascript
// POST /api/curriculum/check-alignment/:planId
Request:  {
  country: "US",    // or "India", etc.
  gradeLevel: "10", // Override plan's grade if needed
  curriculumStandards: ["CCSS.Math.Content.HS.A.REI.A.1"],
  syllabus: "Optional course syllabus text"
}
Response: {
  alignmentScore: 82,
  overallAlignment: "good",
  strengths: [
    "Strong coverage of learning outcomes",
    "Clear assessment alignment"
  ],
  recommendations: [
    "Add more real-world application examples",
    "Include differentiation strategies for struggling learners"
  ],
  gradeLevelAppropriateness: {
    score: 8,
    feedback: "Content is appropriate for grade 10 learners"
  }
}
Status:   200
```

#### **Language Translation Routes** (`/api/language`)

```javascript
// POST /api/language/translate/:planId
Request:  {
  targetLanguage: "hi",     // Hindi
  sourceLanguage: "en"      // English (default)
}
Response: {
  originalLanguage: "en",
  targetLanguage: "hi",
  translatedContent: {
    learningObjectives: [
      "छात्र द्विघात समीकरणों की अवधारणा को समझेंगे",
      ...
    ],
    ...
  }
}
Status:   200

// Supported languages:
// en (English), hi (Hindi), ta (Tamil), te (Telugu),
// kn (Kannada), ml (Malayalam), mr (Marathi), gu (Gujarati),
// bn (Bengali), pa (Punjabi), or (Odia), as (Assamese)
```

#### **Cognitive Load Analysis Routes** (`/api/cognitiveLoad`)

```javascript
// POST /api/cognitiveLoad/analyze/:planId
Response: {
  overallLoad: "moderate",
  loadScore: 55,
  intrinsicLoad: {
    score: 60,
    complexity: "moderate",
    assessment: "Concept difficulty is appropriate for grade level"
  },
  extraneousLoad: {
    score: 45,
    issues: [
      "Too many materials required",
      "Instructions could be clearer"
    ],
    assessment: "Some extraneous cognitive load that could be optimized"
  },
  germaneLoad: {
    score: 70,
    strengths: [
      "Multiple learning modalities (visual, kinesthetic)",
      "Clear progression from simple to complex"
    ],
    assessment: "Good use of germane load for learning"
  },
  recommendations: [
    {
      issue: "Multiple simultaneous tasks",
      suggestion: "Sequence activities to reduce split attention",
      priority: "high"
    }
  ]
}
Status:   200
```

#### **Approval Workflow Routes** (`/api/approvals`)

```javascript
// GET /api/approvals
Headers:  Authorization: Bearer <JWT_TOKEN> (HOD/Admin only)
Query:    status=pending&page=1
Response: {
  approvals: [
    {
      id, planId, plan: { title, creator, subject, grade },
      status: "pending", createdAt
    }
  ],
  totalCount: 25
}
Status:   200

// PUT /api/approvals/:approvalId/approve
Request:  { comments: "Excellent lesson plan!" }
Response: { status: "approved", updatedAt }
Status:   200

// PUT /api/approvals/:approvalId/reject
Request:  { comments: "Needs revision - add more assessment methods" }
Response: { status: "rejected", planStatus: "revision_requested" }
Status:   200
```

#### **Collaboration Routes** (`/api/collaboration`)

```javascript
// POST /api/collaboration/auth
Headers:  Authorization: Bearer <JWT_TOKEN>
Request:  { planId }
Response: {
  token: "liveblocks_session_token_...",
  user: { id, name, email },
  room: `plan:${planId}`
}
Status:   200

// GET /api/collaboration/plans/:planId/users
Response: {
  collaborators: [
    { id, name, email, role: "editor" }
  ]
}
Status:   200

// POST /api/collaboration/plans/:planId/invite
Request:  { userEmail, role: "editor" }
Response: { success: true, message: "Invitation sent" }
Status:   200
```

#### **Personalization Routes** (`/api/personalization`)

```javascript
// POST /api/personalization/analyze-style/:userId
Headers:  Authorization: Bearer <JWT_TOKEN>
Response: {
  styleProfile: {
    preferredApproaches: ["interactive", "hands-on"],
    averageHealthScore: 7.8,
    commonSubjects: ["Mathematics", "Science"],
    collaborationFrequency: "high",
    feedback: "Teacher emphasizes interactive learning with strong assessment"
  }
}
Status:   200

// POST /api/personalization/recommendations/:userId
Response: {
  recommendations: [
    {
      type: "skill_development",
      title: "Enhance Differentiation Strategies",
      description: "Your lessons would benefit from more differentiation",
      priority: "high"
    }
  ]
}
Status:   200
```

---

## Real-Time Collaboration System

### 6.1 Socket.IO Architecture

Edvance implements **operational transformation** concepts through a combination of Socket.IO and Liveblocks for conflict-free collaborative editing.

#### **Connection & Room Management**

```javascript
// serverside: socket/socketHandler.js
export const initializeSocket = (io) => {
  io.use((socket, next) => {
    // Authenticate via JWT
    const token = socket.handshake.auth.token;
    const userId = socket.handshake.auth.userId;
    const userName = socket.handshake.auth.userName;
    
    // Verify token validity
    jwt.verify(token, process.env.JWT_SECRET, (err) => {
      if (err) return next(new Error('Auth failed'));
      socket.userId = userId;
      socket.userName = userName;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`✅ User ${socket.userName} connected`);

    // Join lesson plan editing room
    socket.on('join-plan', async (planId) => {
      socket.join(`plan-${planId}`);
      socket.currentPlan = planId;
      
      // Notify all users in room about presence
      io.to(`plan-${planId}`).emit('user-joined', {
        userId: socket.userId,
        userName: socket.userName,
        timestamp: new Date()
      });

      // Send list of active users to joining user
      const room = io.sockets.adapter.rooms.get(`plan-${planId}`);
      const activeUsers = [];
      if (room) {
        for (const socketId of room) {
          const s = io.sockets.sockets.get(socketId);
          if (s) activeUsers.push({
            userId: s.userId,
            userName: s.userName
          });
        }
      }
      socket.emit('users-in-room', activeUsers);
    });

    // Broadcast content changes to all collaborators
    socket.on('content-change', (data) => {
      socket.to(`plan-${socket.currentPlan}`).emit('content-change', {
        ...data,
        userId: socket.userId,
        userName: socket.userName,
        timestamp: new Date(),
        fieldPath: data.fieldPath,  // "objectives[2]", "assessments", etc.
        newValue: data.newValue,
        operation: data.operation   // "update", "insert", "delete"
      });
    });

    // Track cursor positions
    socket.on('cursor-position', (data) => {
      socket.to(`plan-${socket.currentPlan}`).emit('cursor-position', {
        userId: socket.userId,
        line: data.line,
        column: data.column,
        color: generateUserColor(socket.userId)
      });
    });

    // Comments system
    socket.on('comment-add', (data) => {
      io.to(`plan-${socket.currentPlan}`).emit('comment-added', {
        commentId: generateId(),
        userId: socket.userId,
        userName: socket.userName,
        text: data.text,
        fieldPath: data.fieldPath,
        timestamp: new Date()
      });
    });

    socket.on('disconnect', () => {
      console.log(`❌ User ${socket.userName} disconnected`);
      socket.to(`plan-${socket.currentPlan}`).emit('user-left', {
        userId: socket.userId,
        userName: socket.userName
      });
    });
  });
};
```

#### **Client-Side Real-Time Updates**

```javascript
// client/context/SocketContext.js
import { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user) return;

    // Establish WebSocket connection
    const newSocket = io(import.meta.env.VITE_API_URL, {
      auth: {
        token: localStorage.getItem('token'),
        userId: user.id,
        userName: user.name
      },
      reconnectionDelay: 1000,
      reconnection: true,
      reconnectionAttempts: 5
    });

    // Handle events
    newSocket.on('users-in-room', (users) => {
      setActiveUsers(users);
    });

    newSocket.on('content-change', (data) => {
      // Apply changeset to local state
      applyRemoteChange(data);
      // Show notification of user editing
      showUserActivity(`${data.userName} is editing`);
    });

    newSocket.on('user-joined', (user) => {
      setActiveUsers(prev => [...prev, user]);
      showNotification(`${user.userName} joined editing`);
    });

    newSocket.on('user-left', (user) => {
      setActiveUsers(prev => prev.filter(u => u.userId !== user.userId));
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, [user]);

  const joinPlanRoom = (planId) => {
    socket?.emit('join-plan', planId);
  };

  const broadcastChange = (fieldPath, newValue, operation) => {
    socket?.emit('content-change', {
      fieldPath,
      newValue,
      operation  // "update", "insert", "delete"
    });
  };

  return (
    <SocketContext.Provider value={{ socket, activeUsers, joinPlanRoom, broadcastChange }}>
      {children}
    </SocketContext.Provider>
  );
};
```

#### **Liveblocks Integration**

For enterprise-grade collaboration with persistence and richer features:

```javascript
// /api/collaboration/auth - Generate Liveblocks session token
router.post('/auth', authenticateToken, async (req, res) => {
  const { planId } = req.body;

  // Verify user has access
  const plan = await prisma.lessonPlan.findUnique({
    where: { id: planId },
    include: { collaborators: { where: { userId: req.user.id } } }
  });

  if (!plan || (plan.creatorId !== req.user.id && plan.collaborators.length === 0)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // Generate Liveblocks token
  const session = liveblocks.prepareSession(req.user.id, {
    userInfo: {
      name: req.user.name,
      email: req.user.email,
      avatar: `https://ui-avatars.com/api/?name=${req.user.name}`
    }
  });

  // Grant permissions: users can edit the plan and add comments
  session.allow(`plan:${planId}`, session.FULL_ACCESS);
  session.allow(`plan:${planId}:comments`, session.FULL_ACCESS);

  res.json({ token: session.token });
});
```

---

## Client-Side Architecture

### 7.1 Component Structure

```
src/
├── pages/
│   ├── Home.jsx              // Public landing page
│   ├── Login.jsx             // Authentication
│   ├── Register.jsx          // User registration
│   ├── Dashboard.jsx         // Main dashboard with stats
│   ├── LessonGenerator.jsx   // Step-by-step lesson generation
│   ├── LessonPlans.jsx       // List view of plans with filters
│   ├── LessonPlanDetail.jsx  // Detailed view + edit + export
│   ├── Collaboration.jsx     // Real-time editing interface
│   ├── Approvals.jsx         // HOD approval workflow
│   ├── Templates.jsx         // Template management
│   ├── Profile.jsx           // User profile settings
│   └── UserManagement.jsx    // Admin: manage users
│
├── components/
│   ├── Navbar.jsx
│   ├── PrivateRoute.jsx      // Route protection
│   ├── AIAssistant.jsx       // Chat sidebar
│   ├── LessonPlanForm.jsx    // Reusable form component
│   ├── HealthScoreBadge.jsx  // Score visualization
│   ├── CollaboratorsList.jsx // Active collaborators
│   ├── ApprovalCard.jsx
│   ├── Dashboard/
│   │   ├── StatsCard.jsx
│   │   ├── RecentPlans.jsx
│   │   └── AnalyticsChart.jsx
│   └── ...
│
├── context/
│   ├── AuthContext.jsx       // User auth state
│   ├── SocketContext.jsx     // Real-time updates
│   └── ThemeContext.jsx      // Dark/light mode
│
├── hooks/
│   ├── useAuth.js            // Auth utilities
│   ├── useApi.js             // Centralized API calls
│   └── useSocket.js          // Socket operations
│
├── utils/
│   ├── apiClient.js          // Axios configuration
│   ├── tokenUtils.js         // JWT handling
│   └── validators.js         // Form validation
│
└── App.jsx                   // Main router component
```

### 7.2 State Management Pattern

**AuthContext**: Global authentication state

```javascript
// context/AuthContext.jsx
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      // Verify token validity
      axios.get('/api/auth/profile', {
        headers: { Authorization: `Bearer ${storedToken}` }
      })
        .then(res => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## Authentication & Authorization

### 8.1 JWT-Based Authentication Flow

```
User Login
  ↓
[Email & Password] → POST /api/auth/login
  ↓
Server: Verify email exists
  ↓
Server: Compare password hash with bcrypt
  ↓
Generate JWT with claims:
  {
    "id": "user-uuid",
    "email": "teacher@school.com",
    "role": "teacher",
    "iat": 1713357000,
    "exp": 1713443400  // 24 hours later
  }
  ↓
Return token to client
  ↓
Client: Store in localStorage
  ↓
Client: Include in all subsequent API calls:
  Authorization: Bearer <JWT_TOKEN>
  ↓
Server: Verify token signature with JWT_SECRET
  ↓
Extract user claims from token payload
  ↓
Attach user to request object: req.user = { id, email, role }
```

### 8.2 Role-Based Access Control (RBAC)

```javascript
// Middleware: Authorization by role
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        requiredRoles: allowedRoles,
        userRole: req.user.role
      });
    }

    next();
  };
};

// Usage in routes
router.post(
  '/api/approvals/:approvalId/approve',
  authenticateToken,
  authorizeRoles('HOD', 'admin'),  // Only HOD and admin can approve
  approveLesson
);
```

**Permission Matrix**:

| Action | Teacher | HOD | Admin |
|--------|---------|-----|-------|
| Create lesson plans | ✓ | ✓ | ✓ |
| Edit own plans | ✓ | ✓ | ✓ |
| Edit any plan | ✗ | ✗ | ✓ |
| Approve lessons | ✗ | ✓ | ✓ |
| Manage users | ✗ | ✗ | ✓ |
| View all analytics | ✗ | ✓ | ✓ |
| Translate plans | ✓ | ✓ | ✓ |
| Generate AI content | ✓ | ✓ | ✓ |

---

## Data Export & Generation

### 9.1 PDF Generation (Puppeteer)

**Purpose**: Convert lesson plans to professional PDF documents

```javascript
// utils/pdfGenerator.js
import puppeteer from 'puppeteer';

export const generateLessonPlanPDF = async (plan) => {
  // Convert lesson plan to styled HTML
  const htmlContent = generateHTML(plan);
  
  // Launch headless browser
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Set content and wait for images/fonts to load
  await page.setContent(htmlContent, {
    waitUntil: 'networkidle0'
  });
  
  // Generate PDF with specific format
  const pdfBuffer = await page.pdf({
    format: 'A4',
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    },
    printBackground: true,
    scale: 1
  });
  
  await browser.close();
  
  return pdfBuffer;  // Returns Buffer object
};

// Helper: Convert lesson plan JSON to HTML
const generateHTML = (plan) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Arial', sans-serif; }
        h1 { color: #4F46E5; border-bottom: 2px solid #4F46E5; }
        .metadata { font-size: 12px; color: #666; }
        .section { margin: 20px 0; }
        .learning-objectives { background: #F3F4F6; padding: 10px; }
      </style>
    </head>
    <body>
      <h1>${plan.title}</h1>
      <div class="metadata">
        <p><strong>Subject:</strong> ${plan.subject}</p>
        <p><strong>Grade:</strong> ${plan.grade}</p>
        <p><strong>Duration:</strong> ${plan.duration} minutes</p>
      </div>
      
      <div class="section learning-objectives">
        <h2>Learning Objectives</h2>
        <ul>
          ${plan.content.learningObjectives
            .map(obj => `<li>${obj}</li>`)
            .join('')}
        </ul>
      </div>
      
      ${/* ... more sections ... */}
    </body>
    </html>
  `;
};

// Route handler
router.get('/api/lessonPlans/:id/export/pdf', authenticateToken, async (req, res) => {
  const plan = await prisma.lessonPlan.findUnique({
    where: { id: req.params.id }
  });

  const pdfBuffer = await generateLessonPlanPDF(plan);
  
  res.contentType('application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${plan.title}.pdf"`);
  res.send(pdfBuffer);
});
```

### 9.2 PowerPoint Generation (pptxgenjs)

**Purpose**: Generate slide deck presentations from lesson plans

```javascript
// utils/pptGenerator.js
import pptxgen from 'pptxgenjs';

export const generateLessonPlanPPT = async (plan) => {
  const prs = new pptxgen();
  
  // Slide 1: Title slide
  const slide1 = prs.addSlide();
  slide1.background = { color: '4F46E5' };
  slide1.addText(plan.title, {
    x: 0.5, y: 2, w: 9, h: 1.5,
    fontSize: 44, bold: true, color: 'FFFFFF'
  });
  slide1.addText(`Grade ${plan.grade} | Duration: ${plan.duration} mins`, {
    x: 0.5, y: 3.7, w: 9, h: 0.5,
    fontSize: 20, color: 'E5E7EB'
  });

  // Slide 2: Learning Objectives
  const slide2 = prs.addSlide();
  slide2.addText('Learning Objectives', {
    x: 0.5, y: 0.5, w: 9, h: 0.5,
    fontSize: 32, bold: true, color: '4F46E5'
  });
  
  let yPos = 1.0;
  plan.content.learningObjectives.forEach((objective, idx) => {
    slide2.addText(`${idx + 1}. ${objective}`, {
      x: 1.0, y: yPos, w: 8.5, h: 0.4,
      fontSize: 14, color: '1F2937'
    });
    yPos += 0.5;
  });

  // Slide 3+: Lesson Flow
  const activities = plan.content.lessonFlow?.activities || [];
  activities.forEach((activity, idx) => {
    const slide = prs.addSlide();
    slide.addText(`Activity ${idx + 1}: ${activity.name}`, {
      x: 0.5, y: 0.5, w: 9, h: 0.5,
      fontSize: 28, bold: true, color: '4F46E5'
    });
    
    slide.addText(`Duration: ${activity.duration} mins`, {
      x: 0.5, y: 1.1, w: 9, h: 0.3,
      fontSize: 12, color: '#666666'
    });
    
    slide.addText(activity.description || '', {
      x: 0.5, y: 1.5, w: 9, h: 4,
      fontSize: 14, color: '#1F2937', align: 'left'
    });
  });

  // Save to file or return buffer
  return prs;
};

// Route handler
router.post('/api/lessonPlans/:id/export/pptx', authenticateToken, async (req, res) => {
  const plan = await prisma.lessonPlan.findUnique({
    where: { id: req.params.id }
  });

  const prs = await generateLessonPlanPPT(plan);
  const fileName = `${plan.title}.pptx`;
  
  // Save to disk or send as response
  prs.writeFile({ fileName });
  
  res.json({ 
    message: 'PPTX generated successfully',
    downloadUrl: `/downloads/${fileName}`
  });
});
```

---

## Machine Learning Pipeline

### 10.1 Health Score Prediction Model

**Objective**: Predict lesson quality on a scale of 1-10 using machine learning

#### **Data Generation** (`ml-model/data_generator.py`)

```python
class LessonPlanDataGenerator:
    """Generate synthetic training data"""
    
    def __init__(self, num_samples=500):
        self.num_samples = num_samples
        self.subjects = ['Mathematics', 'Science', 'English', ...]
        self.grades = ['1', '2', ..., '12']
    
    def generate_training_data(self):
        """Create synthetic lesson plans with rubric-based scores"""
        data = []
        
        for _ in range(self.num_samples):
            # Generate lesson components
            objectives = self.generate_objectives(random.randint(2, 5))
            materials = self.generate_materials(random.randint(1, 4))
            activities = self.generate_activities(random.randint(2, 5))
            assessments = self.generate_assessment_methods(random.randint(1, 3))
            
            # Extract features
            features = {
                'num_objectives': len(objectives),
                'num_materials': len(materials),
                'num_activities': len(activities),
                'num_assessments': len(assessments),
                'has_differentiation': random.choice([0, 1]),
                'duration': random.randint(30, 120),
                'content_words': random.randint(500, 3000)
            }
            
            # Calculate health score using rubric
            health_score = self.calculate_health_score(features)
            
            data.append({**features, 'health_score': health_score})
        
        return pd.DataFrame(data)
    
    def calculate_health_score(self, features):
        """Rubric-based score calculation (1-10 scale)"""
        score = 5.0  # Baseline
        
        # Objectives quality (0-2 points)
        if features['num_objectives'] >= 3:
            score += 2
        elif features['num_objectives'] == 2:
            score += 1
        
        # Activities variety (0-2 points)
        if features['num_activities'] >= 3:
            score += 2
        elif features['num_activities'] == 2:
            score += 1
        
        # Assessment alignment (0-2 points)
        if features['num_assessments'] >= 2:
            score += 1.5
        
        # Differentiation (0-1 point)
        if features['has_differentiation']:
            score += 1
        
        # Duration appropriateness (0-1 point)
        if 40 <= features['duration'] <= 90:
            score += 1
        
        # Content depth (0-1 point)
        if features['content_words'] >= 1000:
            score += 0.5
        
        return min(10, max(1, score))  # Clamp to [1, 10]
```

#### **Model Training** (`ml-model/train_model.py`)

```python
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import joblib

class HealthScoreModelTrainer:
    def __init__(self, data_path='data/training_data.csv'):
        self.data_path = data_path
        self.model = None
        self.scaler = RobustScaler()
        self.feature_importance = None
    
    def load_data(self):
        """Load training dataset"""
        df = pd.read_csv(self.data_path)
        
        feature_cols = [
            'num_objectives', 'num_materials', 'num_activities',
            'num_assessments', 'has_differentiation', 'duration', 'content_words'
        ]
        
        X = df[feature_cols].fillna(df[feature_cols].mean())
        y = df['health_score']
        
        return X, y
    
    def train_random_forest(self, X_train, y_train):
        """Train Random Forest model with hyperparameter tuning"""
        rf_params = {
            'n_estimators': [50, 100, 200],
            'max_depth': [5, 10, 15, None],
            'min_samples_split': [2, 5, 10],
            'min_samples_leaf': [1, 2, 4]
        }
        
        grid_search = GridSearchCV(
            RandomForestRegressor(random_state=42),
            rf_params,
            cv=5,
            scoring='r2'
        )
        
        grid_search.fit(X_train, y_train)
        
        print(f"✅ Best RF params: {grid_search.best_params_}")
        return grid_search.best_estimator_
    
    def train_gradient_boosting(self, X_train, y_train):
        """Train Gradient Boosting model"""
        gb_params = {
            'n_estimators': [100, 200],
            'learning_rate': [0.01, 0.05, 0.1],
            'max_depth': [3, 5, 7]
        }
        
        grid_search = GridSearchCV(
            GradientBoostingRegressor(random_state=42),
            gb_params,
            cv=5
        )
        
        grid_search.fit(X_train, y_train)
        return grid_search.best_estimator_
    
    def evaluate_model(self, model, X_test, y_test):
        """Evaluate model performance"""
        y_pred = model.predict(X_test)
        
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        return {
            'mse': mse,
            'rmse': rmse,
            'mae': mae,
            'r2': r2
        }
    
    def save_model(self, model, path='models/health_score_model.pkl'):
        """Persist trained model to disk"""
        joblib.dump(model, path)
        print(f"✅ Model saved to {path}")

# Training pipeline
trainer = HealthScoreModelTrainer()
X, y = trainer.load_data()
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Scale features
X_train_scaled = trainer.scaler.fit_transform(X_train)
X_test_scaled = trainer.scaler.transform(X_test)

# Train models
rf_model = trainer.train_random_forest(X_train_scaled, y_train)
gb_model = trainer.train_gradient_boosting(X_train_scaled, y_train)

# Evaluate
rf_metrics = trainer.evaluate_model(rf_model, X_test_scaled, y_test)
gb_metrics = trainer.evaluate_model(gb_model, X_test_scaled, y_test)

# Select best model
best_model = rf_model if rf_metrics['r2'] > gb_metrics['r2'] else gb_model
trainer.save_model(best_model)
```

#### **Model Prediction** (`ml-model/predict.py`)

```python
def predict_health_score(lesson_data):
    """
    Predict health score for a lesson plan
    
    Input:
        lesson_data = {
            'num_objectives': 3,
            'num_materials': 2,
            'num_activities': 4,
            'num_assessments': 2,
            'has_differentiation': 1,
            'duration': 45,
            'content_words': 1200
        }
    
    Output:
        score: float (1-10), confidence: float (0-1)
    """
    
    # Load trained model
    model = joblib.load('models/health_score_model.pkl')
    scaler = joblib.load('models/scaler.pkl')
    
    # Extract features in correct order
    feature_cols = [
        'num_objectives', 'num_materials', 'num_activities',
        'num_assessments', 'has_differentiation', 'duration', 'content_words'
    ]
    
    X = pd.DataFrame([lesson_data])[feature_cols]
    X_scaled = scaler.transform(X)
    
    # Predict
    score = model.predict(X_scaled)[0]
    
    # Get feature importance for explanation
    importance = pd.DataFrame({
        'feature': feature_cols,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    # Calculate prediction confidence (variance across trees)
    if hasattr(model, 'estimators_'):
        predictions = np.array([
            tree.predict(X_scaled)[0] for tree in model.estimators_
        ])
        confidence = 1 - (np.std(predictions) / 10)  # Normalize to [0, 1]
    else:
        confidence = 0.8
    
    return {
        'health_score': round(min(10, max(1, score)), 2),
        'confidence': round(confidence, 2),
        'feature_importance': importance.to_dict('records')
    }
```

#### **Integration with Node.js Backend**

```javascript
// healthScorePredictor.js - Bridge between Node and Python
import { spawn } from 'child_process';
import fs from 'fs/promises';

export const predictHealthScoreWithFallback = async (lessonData) => {
  try {
    // Call Python prediction script
    const result = await new Promise((resolve, reject) => {
      const python = spawn('python', ['ml-model/predict.py']);
      
      let stdout = '';
      let stderr = '';
      
      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      python.on('close', (code) => {
        if (code === 0) {
          resolve(JSON.parse(stdout));
        } else {
          reject(new Error(stderr));
        }
      });
      
      // Send lesson data as JSON
      python.stdin.write(JSON.stringify(lessonData));
      python.stdin.end();
    });
    
    return result;
  } catch (error) {
    console.error('❌ ML prediction failed, using fallback rubric');
    
    // Fallback: rule-based scoring
    return calculateHealthScoreFallback(lessonData);
  }
};

const calculateHealthScoreFallback = (data) => {
  let score = 5;
  
  if (data.objectives?.length >= 3) score += 2;
  if (data.activities?.length >= 3) score += 2;
  if (data.assessments?.length >= 2) score += 1.5;
  if (data.differentiation?.length > 0) score += 1;
  
  return {
    healthScore: Math.min(10, Math.max(1, score)),
    method: 'fallback_rubric'
  };
};
```

---

## Advanced Features

### 11.1 Multi-Language Support

**Approach**: Server-side translation using Groq API

```javascript
// routes/language.js
router.post('/api/language/translate/:planId', async (req, res) => {
  const { planId } = req.params;
  const { targetLanguage, sourceLanguage = 'en' } = req.body;
  
  // Supported languages
  const supportedLangs = {
    'en': 'English',
    'hi': 'Hindi',
    'ta': 'Tamil',
    'te': 'Telugu',
    // ... 8 more Indian languages
  };
  
  // Fetch lesson plan
  const plan = await prisma.lessonPlan.findUnique({ where: { id: planId } });
  const planContent = JSON.stringify(plan.content, null, 2);
  
  // Create translation prompt
  const prompt = `Translate this lesson plan from ${supportedLangs[sourceLanguage]} to ${supportedLangs[targetLanguage]}.
  
IMPORTANT: Maintain the exact JSON structure. Only translate the text content.
Do NOT change field names, do NOT change the JSON structure.
Return ONLY valid JSON.

Original content:
${planContent}

Translated content (preserve JSON structure):`;
  
  // Call Groq API for translation
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3  // Lower temp for consistency
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  // Parse and validate translation
  let translatedContent = JSON.parse(response.data.choices[0].message.content);
  
  // Save translated version
  await prisma.lessonPlan.update({
    where: { id: planId },
    data: {
      content: translatedContent,
      language: targetLanguage
    }
  });
  
  res.json({
    success: true,
    targetLanguage,
    translatedContent
  });
});
```

### 11.2 Curriculum Alignment Analysis

**Purpose**: Verify lesson adherence to curriculum standards (Common Core, NGSS, VTU)

```javascript
router.post('/api/curriculum/check-alignment/:planId', async (req, res) => {
  const plan = await prisma.lessonPlan.findUnique({ where: { id: planId } });
  
  // Standard mappings by country/framework
  const standards = {
    'US': {
      'Common Core': [
        'CCSS.Math.Content.HS.A.REI.A.1',
        'CCSS.ELA-Literacy.RL.9-10.2',
        // More standards...
      ],
      'NGSS': [
        'HS-PS1-1',
        'HS-LS1-1',
        // More standards...
      ]
    },
    'India': {
      'VTU': [
        'Unit 1: Fundamentals',
        'Unit 2: Applications',
        // More units...
      ]
    }
  };
  
  // Create alignment analysis prompt
  const prompt = `Analyze this lesson plan for curriculum alignment.

Lesson Plan:
Title: ${plan.title}
Subject: ${plan.subject}
Grade: ${plan.grade}
Content: ${JSON.stringify(plan.content).substring(0, 2000)}

Return JSON with:
{
  "alignmentScore": <0-100>,
  "coveredStandards": ["standard1", "standard2"],
  "missingStandards": ["standard3"],
  "recommendations": ["recommendation1"]
}`;
  
  // Call Groq for analysis
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5
    },
    { headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` } }
  );
  
  const analysis = JSON.parse(response.data.choices[0].message.content);
  
  // Save alignment results
  await prisma.lessonPlan.update({
    where: { id: planId },
    data: { curriculumAlignment: analysis }
  });
  
  res.json(analysis);
});
```

### 11.3 Cognitive Load Assessment

**Cognitive Load Theory (CLT)**: Optimizes how much information students process

```javascript
router.post('/api/cognitiveLoad/analyze/:planId', async (req, res) => {
  const plan = await prisma.lessonPlan.findUnique({ where: { id: planId } });
  
  // Three types of cognitive load (Sweller, 1988)
  const prompt = `Analyze cognitive load in this lesson plan:

${JSON.stringify(plan.content)}

Assess:
1. INTRINSIC LOAD: Complexity of the content itself
2. EXTRANEOUS LOAD: Unnecessary difficulty added by instruction
3. GERMANE LOAD: Load that supports learning

Return JSON:
{
  "intrinsicLoad": {
    "score": <0-100>,
    "complexity": "low|moderate|high",
    "analysis": "..."
  },
  "extraneousLoad": {
    "score": <0-100>,
    "issues": ["issue1", "issue2"],
    "analysis": "..."
  },
  "germaneLoad": {
    "score": <0-100>,
    "strengths": ["strength1"],
    "analysis": "..."
  },
  "overallLoad": "low|moderate|high|overload",
  "recommendations": [
    { "issue": "...", "suggestion": "...", "priority": "high|medium|low" }
  ]
}`;
  
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6
    },
    { headers: { 'Authorization': `Bearer ${GROQ_API_KEY}` } }
  );
  
  const analysis = JSON.parse(response.data.choices[0].message.content);
  
  res.json(analysis);
});
```

---

## Deployment Architecture

### 12.1 Docker Containerization

**Strategy**: Multi-container deployment with docker-compose for local development and Docker Swarm/Kubernetes for production

#### **Server Dockerfile**

```dockerfile
# server/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Copy application code
COPY . .

# Build Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start application
CMD ["node", "index.js"]
```

#### **Client Dockerfile** (Nginx-based)

```dockerfile
# client/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build with Vite
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### **Docker Compose** (Local Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: edvance
      POSTGRES_PASSWORD: edvance123
      POSTGRES_DB: edvance
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U edvance"]
      interval: 10s
      timeout: 5s
      retries: 5

  server:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://edvance:edvance123@postgres:5432/edvance
      JWT_SECRET: your-super-secret-jwt-key
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      GROQ_API_KEY: ${GROQ_API_KEY}
      NODE_ENV: production
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./server:/app
      - /app/node_modules

  client:
    build: ./client
    ports:
      - "3000:80"
    depends_on:
      - server
    environment:
      VITE_API_URL: http://server:5000/api

volumes:
  postgres_data:
```

### 12.2 Nginx Configuration (Production)

```nginx
# client/nginx.conf
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  # Gzip compression
  gzip on;
  gzip_types text/plain text/css text/javascript application/json application/javascript;
  gzip_min_length 1000;

  # Caching for static assets
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
  }

  # API proxy
  location /api {
    proxy_pass http://server:5000/api;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Timeouts for long-running requests
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
  }

  # WebSocket support
  location /socket.io {
    proxy_pass http://server:5000/socket.io;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
  }

  # SPA routing: fall back to index.html for unknown routes
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Security headers
  add_header X-Frame-Options "SAMEORIGIN";
  add_header X-Content-Type-Options "nosniff";
  add_header X-XSS-Protection "1; mode=block";
  add_header Referrer-Policy "strict-origin-when-cross-origin";
}
```

### 12.3 Vercel Deployment

For serverless deployment:

```json
{
  "version": 2,
  "buildCommand": "npm run build:all",
  "outputDirectory": "client/dist",
  "framework": "vite",
  "functions": {
    "api/index.js": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

---

## Security Considerations

### 13.1 Input Validation & Sanitization

```javascript
// Comprehensive input validation
import { body, query, param, validationResult } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';

router.post('/api/lessonPlans', [
  // Body validation
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be 3-200 characters')
    .custom(val => !DOMPurify.sanitize(val).includes('<script'>))
    .withMessage('HTML scripts not allowed'),
  
  body('subject')
    .trim()
    .notEmpty()
    .isIn(['Math', 'Science', 'English']).withMessage('Invalid subject'),
  
  body('content')
    .isObject().withMessage('Content must be an object')
    .custom(val => {
      // Validate JSON schema
      if (!val.learningObjectives || !Array.isArray(val.learningObjectives)) {
        throw new Error('Missing learningObjectives');
      }
      return true;
    }),
  
  // Query parameter validation
  query('page')
    .optional()
    .isInt({ min: 1 }).toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).toInt(), // Limit pagination max
  
  // URL parameter validation
  param('planId')
    .isUUID().withMessage('Invalid plan ID format')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  // Process valid request...
});
```

### 13.2 Authentication & Session Security

```javascript
// Secure JWT implementation
const jwtConfig = {
  expiresIn: '24h',
  algorithm: 'HS256'
};

// Token generation with secure secrets
const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID()  // Unique token ID for revocation
  },
  process.env.JWT_SECRET,
  jwtConfig
);

// Token revocation (optional)
const tokenBlacklist = new Set();  // or use Redis for distributed systems

const verifyToken = (token) => {
  if (tokenBlacklist.has(token)) {
    throw new Error('Token has been revoked');
  }
  return jwt.verify(token, process.env.JWT_SECRET);
};

const logout = (req, res) => {
  const token = extractTokenFromHeader(req);
  tokenBlacklist.add(token);
  res.json({ message: 'Logged out successfully' });
};
```

### 13.3 Database Security

```javascript
// Parameterized queries (Prisma handles this automatically)
// ✓ SAFE: Parameterized
const users = await prisma.user.findMany({
  where: { email: userEmail }  // Parameterized
});

// ✗ DANGEROUS: String concatenation (never do this!)
const query = `SELECT * FROM users WHERE email = '${email}'`;  // SQL injection risk

// Password hashing
const bcryptConfig = {
  saltRounds: 12  // Higher cost = more secure but slower
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, bcryptConfig.saltRounds);
};

const verifyPassword = async (plaintext, hash) => {
  return await bcrypt.compare(plaintext, hash);
};
```

### 13.4 API Security

```javascript
// Security middleware stack
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

const app = express();

// Helmet: Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true
}));

// CORS: Restrict cross-origin requests
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 3600
}));

// Rate limiting
const limiters = {
  general: rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100,  // 100 requests per windowMs
    message: 'Too many requests, please try again later'
  }),
  
  auth: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,  // 5 login attempts per 15 minutes
    skipSuccessfulRequests: true
  }),
  
  ai: rateLimit({
    windowMs: 60 * 60 * 1000,  // 1 hour
    max: 50  // 50 AI requests per hour (expensive API calls)
  })
};

app.use('/api/', limiters.general);
app.use('/api/auth/login', limiters.auth);
app.use('/api/ai/', limiters.ai);
```

### 13.5 Environment Variables & Secrets

```bash
# .env (NEVER commit this file!)
DATABASE_URL=postgresql://user:pass@db:5432/edvance
JWT_SECRET=your-very-long-random-string-of-at-least-32-characters
GEMINI_API_KEY=AIza...
GROQ_API_KEY=gsk_...
NODE_ENV=production
LOG_LEVEL=info
ALLOWED_ORIGINS=https://app.edvance.com,https://www.edvance.com
```

**Best practices**:
- Store secrets in environment variables, never in code
- Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- Rotate secrets regularly
- Use `.env.example` file (without actual values) for reference

---

## Performance Optimization

### 14.1 Database Query Optimization

```javascript
// ✗ N+1 Query Problem (slow)
const plans = await prisma.lessonPlan.findMany();
for (const plan of plans) {
  const creator = await prisma.user.findUnique({
    where: { id: plan.creatorId }
  });  // Database hit for each plan!
}

// ✓ Optimized with eager loading (fast)
const plans = await prisma.lessonPlan.findMany({
  include: {
    creator: { select: { id: true, name: true, email: true } },
    approvals: { select: { status: true, reviewer: { select: { name: true } } } }
  },
  take: 20,  // Pagination
  skip: (page - 1) * 20
});  // Single database call with JOIN!

// ✓ Selective field projection
const plans = await prisma.lessonPlan.findMany({
  select: {
    id: true,
    title: true,
    healthScore: true,
    creatorId: true,  // Don't fetch large 'content' field
    status: true
  }
});
```

### 14.2 Caching Strategy

```javascript
// Redis caching layer
import redis from 'redis';

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

// Cache middleware
const cacheMiddleware = (cacheDurationSeconds) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next();
    
    const cacheKey = `cache:${req.originalUrl}`;
    
    // Check cache
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      return res.json(JSON.parse(cachedData));
    }
    
    // Intercept response
    const originalJson = res.json;
    res.json = function(data) {
      redisClient.setex(cacheKey, cacheDurationSeconds, JSON.stringify(data));
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Apply caching
router.get('/api/lessonPlans', cacheMiddleware(300), getLesson Plans);  // 5-minute cache
```

### 14.3 Frontend Performance

```javascript
// Code splitting with React.lazy
import { lazy, Suspense } from 'react';

const LessonGenerator = lazy(() => import('./pages/LessonGenerator'));
const Collaboration = lazy(() => import('./pages/Collaboration'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/generate" element={<LessonGenerator />} />
        <Route path="/collaborate/:id" element={<Collaboration />} />
      </Routes>
    </Suspense>
  );
}

// Image optimization
import { Image } from 'next/image';  // Or use responsive images with srcset

// CSS splitting
import('./heavyComponent.module.css');  // Only load when needed
```

### 14.4 API Response Optimization

```javascript
// Pagination + field selection
router.get('/api/lessonPlans', async (req, res) => {
  const { page = 1, limit = 20, fields = 'id,title,subject,grade' } = req.query;
  
  // Parse requested fields
  const selectedFields = fields.split(',').reduce((obj, field) => {
    obj[field.trim()] = true;
    return obj;
  }, {});
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [plans, totalCount] = await Promise.all([
    prisma.lessonPlan.findMany({
      select: selectedFields,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.lessonPlan.count()
  ]);
  
  res.json({
    data: plans,
    pagination: {
      current: parseInt(page),
      perPage: parseInt(limit),
      total: totalCount,
      totalPages: Math.ceil(totalCount / parseInt(limit))
    }
  });
});
```

---

## Development Workflow

### 15.1 Local Development Setup

```bash
# Clone repository
git clone <repo-url>
cd edvance

# Install root dependencies
npm install

# Install server and client dependencies
npm run install:all

# Setup environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env

# Edit .env files with actual values
# DATABASE_URL=postgresql://...
# GEMINI_API_KEY=...
# GROQ_API_KEY=...

# Run database migrations
cd server
npx prisma migrate dev --name init
npx prisma generate

# Start development servers
cd ../
npm run dev:server  # Terminal 1: Backend on :5000
npm run dev:client  # Terminal 2: Frontend on :5173
```

### 15.2 Git Workflow

```bash
# Feature branch development
git checkout -b feature/ai-improvements
# ... make changes ...
git add .
git commit -m "feat: improve AI lesson generation with better prompts"

# Create PR for code review
git push origin feature/ai-improvements

# After merge
git checkout main
git pull origin main
```

### 15.3 Testing Strategy

```bash
# Backend unit tests
npm run test:server

# Frontend component tests
npm run test:client

# End-to-end tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### 15.4 Build & Deployment

```bash
# Production build
npm run build:all

# Docker build
docker buildx build -t edvance:latest --push .

# Deploy to Vercel
npm run deploy:vercel

# Deploy to production server
ssh user@production-server
cd /app/edvance
git pull origin main
docker-compose down
docker-compose up -d --build
```

---

## Conclusion

**Edvance** is a sophisticated, production-ready AI-powered educational platform combining:

- **Frontend**: React 18 + Vite (sub-1s HMR, optimized builds)
- **Backend**: Node.js/Express with PostgreSQL + Prisma ORM
- **AI**: Google Gemini 2.0 + Groq LLaMA for fast inference
- **Real-Time**: Socket.IO + Liveblocks for collaborative editing
- **ML**: scikit-learn models for health scoring
- **Deployment**: Docker containerization with nginx reverse proxy

The architecture prioritizes **modularity**, **scalability**, **security**, and **developer experience**, making it suitable for enterprise deployment while remaining maintainable and extensible.

---

**End of Comprehensive Technical Documentation**

---

### Document Statistics

- **Total Lines**: ~2500+
- **Code Examples**: 100+
- **Technical Depth**: Advanced
- **Target Audience**: Technical team members, system architects, developers

This document serves as the single source of truth for all technical aspects of the Edvance project.
