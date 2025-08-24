## Description
[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Requirements
- Node.js version 20.x or later
- **npm** or **yarn** version 1.x or later
- **Docker** + **Docker Compose**
- **Prisma CLI**
npm install -g prisma

## Project setup
Move to the project directory:
cd backend
Install dependencies:
npm install
Run Prisma migration:
npx prisma migrate dev

## Environment Variables
To run the backend correctly, create a .env file at the project root with these minimum variables (do not include the real API key in the repo):
GEMINI_API_KEY=<your_api_key_here>
AI_MODEL=gemini-2.0-flash-exp
AI_MAX_OUTPUT_TOKENS=512
AI_TEMPERATURE=0.2
RATE_LIMIT=10
MINIO_ACCESS_KEY=<your_minio_user>
MINIO_SECRET_KEY=<your_minio_password>
For local development, you can use .env.local if you want to keep different values that won't be pushed to the repository.

## Compile and run the project
# development
npm run start
# watch mode
npm run start:dev
# production mode
npm run start:prod

## Chat Endpoint
A new endpoint has been added for academic IA queries:
POST /api/v1/chat/ask
Content-Type: application/json
Expected payload:
{
  "question": "What is AWS?",
  "lang": "en",
  "context": "academic_general"
}
Expected response:
{
  "answer": "AWS is a cloud computing platform that provides a wide range of services..."
}
Notes:
- Limit of 10 questions per minute per user.
- question, lang, and context fields are validated.
- Currently, the endpoint may return an error if the IA or database is not configured.

## Run tests
# unit tests
npm run test
# e2e tests
npm run test:e2e
# test coverage
npm run test:cov

## Deployment
When you're ready to deploy your NestJS application to production, check out the deployment documentation: https://docs.nestjs.com/deployment
For cloud-based deployment, see Mau: https://mau.nestjs.com
npm install -g @nestjs/mau
mau deploy
