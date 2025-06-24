# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/53cfea11-f843-4690-89c9-29ccead23b24

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/53cfea11-f843-4690-89c9-29ccead23b24) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/53cfea11-f843-4690-89c9-29ccead23b24) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Application Email Confirmation Flow

When a user submits their application, a confirmation email is sent to the email address they registered and logged in with. This is implemented as follows:

- **User logs in with their email**
- **Email gets auto-filled in the application form (non-editable)**
- **When the application is submitted, a confirmation email is sent to that same registered email address**

### Technical Details
- In the application form, the email field is automatically populated from the user's login session and is read-only.
- On submission, the confirmation email is sent to this email address using the `send-submission-confirmation` function.
- The relevant code can be found in `src/components/application/StartupIdeaStep.tsx`:

```ts
// This sends the confirmation email to the registered user's email
const { error: confirmationEmailError } = await supabase.functions.invoke('send-submission-confirmation', {
  body: { 
    applicationId: insertedApplication.id,
    email: data.email, // This is the user's registered email
    founderName: data.founderName,
    startupName: data.startupName
  }
});
```
- The email address (`data.email`) is auto-filled from the logged-in user's session in `src/pages/Application.tsx`:

```ts
setApplicationData(prev => ({
  ...prev,
  email: user.email // Auto-filled from user's login session
}));
```

This ensures that the confirmation email is always sent to the email address the user registered and logged in with, as required.
