import { serve, createClient } from "./deps.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "submission" | "verification";
  assignmentId: string;
  recipientId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const { type, assignmentId, recipientId }: EmailRequest = await req.json();

    // Get assignment details
    const { data: assignment } = await supabase
      .from("assignments")
      .select(`
        *,
        student:profiles!assignments_student_id_fkey(full_name),
        verification:verifications(*)
      `)
      .eq("id", assignmentId)
      .single();

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // Get recipient details
    const { data: recipient } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", recipientId)
      .single();

    if (!recipient) {
      throw new Error("Recipient not found");
    }

    let emailContent;
    if (type === "submission") {
      emailContent = {
        subject: `New Assignment Submission: ${assignment.title}`,
        html: `
          <h2>New Assignment Submission</h2>
          <p>Student: ${assignment.student.full_name}</p>
          <p>Title: ${assignment.title}</p>
          <p>Subject: ${assignment.subject}</p>
          <p>Type: ${assignment.artifact_type}</p>
          <a href="${SUPABASE_URL}/assignments/${assignmentId}">Review Assignment</a>
        `,
      };
    } else {
      const verification = assignment.verification[0];
      emailContent = {
        subject: `Assignment Verification Update: ${assignment.title}`,
        html: `
          <h2>Assignment Verification Update</h2>
          <p>Title: ${assignment.title}</p>
          <p>Status: ${verification.status}</p>
          <p>Feedback: ${verification.feedback || "No feedback provided"}</p>
          <a href="${SUPABASE_URL}/assignments/${assignmentId}">View Assignment</a>
        `,
      };
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Portfolio System <notifications@yourdomain.com>",
        to: [recipient.email],
        ...emailContent,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to send email");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);