# Main Features

Fessior is an online judge backend with a small web client for demonstrating its core flows.

## Authentication

Users can register, log in, refresh their session, and log out. Protected routes distinguish regular users from administrators.

## Problems and versioned testcases

Administrators manage problems, statements, starter code, and execution limits. Testcases are grouped into versioned sets. ZIP imports validate the archive before activating a new set, and submissions keep the testcase set that was active when they were created.

## Asynchronous code judging

The API stores a submission before enqueueing a BullMQ job that contains its ID. The worker loads the pinned problem and testcase data, runs the code through the executor, persists the result, and then publishes a realtime update. Submission state can be recovered from the API after a disconnect.

Judge is the background worker responsible for consuming submission jobs and delegating code execution to Judge0.

## Sandboxed execution

The judge worker delegates untrusted code execution to Judge0. The server controls the supported language and execution configuration; the application API and worker do not execute submitted source code directly.

## Realtime 1v1 matches

Players enter a Redis-backed matchmaking queue and are paired for a problem. Match actions verify participant membership. The first accepted submission settles the match and rating changes atomically; clients can reload match state from the API.

## Web demo

The web client provides a lightweight demo of problem solving and testcase runs, submission history and details, administrator problem/testcase management, and 1v1 matchmaking.

## Technical guides

- [System architecture](architecture.md)
- [Local development](development.md)
- [Deployment and current infrastructure](deployment.md)
- [Secure testcase ingestion](testcase-ingestion.md)
- [Asynchronous judging](judging-pipeline.md)
- [Sandbox security](sandbox-security.md)
- [Realtime 1v1 matchmaking](realtime-1v1.md)
