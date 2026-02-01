# TTC (Take This Code)

A real-time, anonymous code sharing platform built with Next.js, React, and PostgreSQL. TTC enables developers to instantly share code snippets with automatic language detection, syntax highlighting, and persistent storage.

---

## Features

- **Instant Code Sharing**: Share code snippets using simple, memorable keys
- **Real-Time Synchronization**: Changes are automatically saved and synchronized across all viewers
- **Automatic Language Detection**: Smart detection of programming languages including JavaScript, TypeScript, Python, Java, C++, Rust, PHP, HTML, CSS, JSON, and Markdown
- **Syntax Highlighting**: Professional code highlighting powered by CodeMirror 6
- **Copy and Download**: Easily copy code to clipboard or download with appropriate file extensions
- **Anonymous**: No authentication required, start sharing immediately
- **Responsive Design**: Works seamlessly on desktop and mobile devices

---

## Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **CodeMirror 6** - Code editor with syntax highlighting

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Prisma** - Type-safe database ORM
- **PostgreSQL** - Relational database
- **Zod** - Schema validation

---

## Installation and Setup

### Step 1: Clone the Repository

Clone the repository and navigate to the frontend directory:
```bash
git clone https://github.com/moqim-ghizlan/TTC.git
cd TTC/frontend
```

### Step 2: Install Dependencies

Install the required packages:
```bash
npm install
```

### Step 3: Configure Database

Create a `.env` file in the frontend directory with your database connection:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/ttc"
```

### Step 4: Initialize Database

Run Prisma migrations to set up the database schema:
```bash
npx prisma migrate dev
npx prisma generate
```

---

## Running the Application

### Development Mode

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

Build and start the production server:
```bash
npm run build
npm start
```

---

## Usage

1. **Generate or Enter a Key**: On the homepage, either generate a random key or enter your own custom key (2-20 alphanumeric characters)

2. **Start Coding**: Once on the editor page, start typing your code. Changes are automatically saved

3. **Share**: Copy the URL from the address bar and share it with others. Anyone with the link can view and edit the code

4. **Copy or Download**: Use the "Copy Code" button to copy the entire code to clipboard, or "Download" to save as a file with the appropriate extension

---

## Project Structure

```
frontend/
├── app/
│   ├── api/              # API routes
│   │   ├── code/         # Code snippet endpoints
│   │   └── key/          # Key generation and validation
│   ├── [key]/            # Dynamic code editor page
│   ├── lib/              # Utility functions and Prisma client
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Homepage
├── prisma/
│   └── schema.prisma     # Database schema
├── public/               # Static assets
└── package.json          # Dependencies
```

---

## Database Schema

The application uses a simple schema with a single `CodeSnippet` table:

- `id`: Unique identifier
- `key`: Unique, user-facing identifier (2-20 characters)
- `content`: The code content
- `createdAt`: Creation timestamp
- `updatedAt`: Last modification timestamp

---

## API Endpoints

### Key Management
- `POST /api/key/validate` - Validate a key and create if doesn't exist
- `GET /api/key/generate` - Generate a unique random key

### Code Operations
- `GET /api/code/:key` - Retrieve code snippet by key
- `PUT /api/code/:key` - Update code snippet content

---

## Contributing

Contributions are welcome. Please ensure your code follows the existing style and includes appropriate tests.

---

## Author

**GHIZLAN Moqim**

---

## License

This project is open source. See the LICENSE file for more information.
