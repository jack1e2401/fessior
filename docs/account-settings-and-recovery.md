# Account settings and password recovery

Authenticated users can update their username, full name, and short bio at `/settings` through `PATCH /api/v1/auth/me`. Email changes and avatar uploads are not supported.

Password recovery uses `POST /api/v1/auth/forgot-password` and `POST /api/v1/auth/reset-password`. Reset links contain a random single-use token that expires after 30 minutes; the database stores only its SHA-256 digest. The request endpoint uses a generic response for unknown accounts and Redis limits requests by IP and normalized email. Completing a reset changes the password and revokes the user's refresh tokens. Existing access JWTs remain valid until their normal expiry.

## Gmail SMTP configuration

Copy these values into the private root `.env` (never commit the real App Password):

```dotenv
APP_PUBLIC_URL=http://localhost:5173
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-gmail-address@gmail.com
SMTP_APP_PASSWORD=your-16-character-google-app-password
SMTP_FROM=Fessior <your-gmail-address@gmail.com>
```

Create a Google App Password for the sender account. The app password may be pasted with spaces; the mailer removes whitespace before connecting. `SMTP_USER` and `SMTP_APP_PASSWORD` must both be set before reset requests can be sent. In deployment, set `APP_PUBLIC_URL` to the public frontend origin.
