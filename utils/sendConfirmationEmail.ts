export const sendConfirmationEmail = async ({ applicationId, email, founderName, startupName }) => {
    try {
      const res = await fetch("https://nxsrxdlsnabpshncdplv.functions.supabase.co/send-submission-confirmation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54c3J4ZGxzbmFicHNobmNkcGx2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MTE1NDcsImV4cCI6MjA2NTQ4NzU0N30.ZqVwsMeCHTpr5_CH_lQ9Gs5fNTKO5Y9VpOuSBL3nsg8"
        },
        body: JSON.stringify({
            applicationId: application.id,     // Pass the actual application ID
            email: user.email,                 // From logged-in session or form
            founderName: user.name,            // Or from form
            startupName: user.startupName      // Or from form
          })
        });     
  
      const data = await res.json();
      return { success: res.ok, message: data.message || data.error };
    } catch (error) {
      return { success: false, message: error.message || "Unknown error occurred" };
    }
  };
  